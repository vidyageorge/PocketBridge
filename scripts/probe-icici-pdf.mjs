import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, '..', 'support_files', '579963418_2026_M04.PDF');
const data = new Uint8Array(fs.readFileSync(pdfPath));
const document = await pdfjs.getDocument({ data }).promise;

const items = [];
for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
  const page = await document.getPage(pageNumber);
  const textContent = await page.getTextContent();
  for (const item of textContent.items) {
    if ('str' in item && 'transform' in item) {
      items.push({ str: String(item.str), transform: item.transform });
    }
  }
}

const lineMap = new Map();
for (const item of items) {
  const text = item.str.trim();
  if (!text) continue;
  const y = Math.round(item.transform[5] ?? 0);
  const x = item.transform[4] ?? 0;
  const bucket = lineMap.get(y) ?? [];
  bucket.push({ x, text });
  lineMap.set(y, bucket);
}

const lines = [...lineMap.entries()]
  .sort((a, b) => b[0] - a[0])
  .map(([, bucket]) => bucket.sort((a, b) => a.x - b.x).map((c) => c.text));

let inSection = false;
for (const cells of lines) {
  const joined = cells.join(' | ');
  if (/statement of transactions/i.test(joined)) {
    inSection = true;
    console.log('--- SECTION START ---');
    continue;
  }
  if (!inSection) continue;
  if (/total/i.test(joined) && /withdrawal/i.test(joined)) {
    console.log('--- TOTAL ---', joined);
    break;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(cells[0] ?? '')) {
    console.log(cells.join(' | '));
  }
}

const text = items.map((i) => i.str).join(' ');
const summaryMatch = text.split(/Statement of transactions/i)[0] ?? text;
console.log('\nAS ON:', summaryMatch.match(/as\s+on\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/i)?.[0]);
console.log(
  'BALANCE:',
  summaryMatch.match(/Balance\s*\(INR\)[\s\S]{0,400}?([\d,]+\.\d{2})\s*Cr/i)?.[1],
);
