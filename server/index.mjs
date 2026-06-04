import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import {
  deleteStoreValue,
  getDatabasePath,
  isDatabaseEmpty,
  migrateStorePayload,
  readStoreValue,
  writeStoreValue,
} from './db.mjs';

const PORT = Number(process.env.PORT ?? 3001);
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', async (_request, response) => {
  try {
    response.json({
      ok: true,
      database: getDatabasePath(),
      empty: await isDatabaseEmpty(),
    });
  } catch (error) {
    response.status(500).json({ ok: false, error: String(error) });
  }
});

app.get('/api/store/:key', async (request, response) => {
  try {
    const value = await readStoreValue(request.params.key);
    if (value === null) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    response.json(value);
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
});

app.put('/api/store/:key', async (request, response) => {
  try {
    await writeStoreValue(request.params.key, request.body);
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
});

app.delete('/api/store/:key', async (request, response) => {
  try {
    await deleteStoreValue(request.params.key);
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
});

app.post('/api/migrate', async (request, response) => {
  try {
    if (!request.body || typeof request.body !== 'object') {
      response.status(400).json({ error: 'Expected JSON object of store keys' });
      return;
    }

    await migrateStorePayload(request.body);
    response.json({ ok: true, keys: Object.keys(request.body) });
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
});

const distDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (existsSync(path.join(distDirectory, 'index.html'))) {
  app.use(express.static(distDirectory));
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(distDirectory, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`PocketBridge API listening on http://localhost:${PORT}`);
  console.log(`Database: ${getDatabasePath()}`);
});
