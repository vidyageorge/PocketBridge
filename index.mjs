/**
 * Render entry when Root Directory is the repo root and Start Command is `node index.mjs`.
 * Prefer setting Root Directory to `server` instead (see RENDER_DEPLOY.md).
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const serverEntry = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'server',
  'index.mjs',
);

await import(pathToFileURL(serverEntry).href);
