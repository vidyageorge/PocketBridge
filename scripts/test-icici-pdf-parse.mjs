import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseAmount(value) {
  if (!value) return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function parseIciciDate(value) {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

const MONTH = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseIciciSummaryFromText(text) {
  const match = text.match(/as\s+on\s+([A-Za-z]+)\s+(\d{1,2})[,\s]+(\d{4})/i);
  if (!match) return null;
  const month = MONTH[match[1].toLowerCase()];
  const asOnDate = `${match[3]}-${String(month).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
  const summarySection = text.split(/Statement of transactions/i)[0] ?? text;
  const balance = parseAmount(
    summarySection.match(/Balance\s*\(INR\)[\s\S]{0,400}?([\d,]+\.\d{2})\s*Cr/i)?.[1],
  );
  return { asOnDate, balance };
}

function splitDescriptionAndLocation(body) {
  const matchers = [
    /\s+(CHENNAI-K\.K\.NAGAR)\s*$/,
    /\s+(RPC\s*-\s*TRICHY)\s*$/,
    /\s+(RPC\s*-\s*LUCKNOW\s*-\s*0116)\s*$/,
    /\s+(RPC-CHH\.\s*SAMBHAJINAGAR)\s*$/,
  ];
  for (const matcher of matchers) {
    const match = body.match(matcher);
    if (match) {
      return { description: body.slice(0, match.index).trim(), location: match[1].trim() };
    }
  }
  return { description: body.trim() };
}

function parseAmountTail(chunk) {
  const threeAmount = chunk.match(
    /\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*Cr\s*$/i,
  );
  if (threeAmount) {
    return {
      withdrawal: parseAmount(threeAmount[1]),
      deposit: parseAmount(threeAmount[2]),
      balance: parseAmount(threeAmount[3]),
      bodyWithoutAmounts: chunk.slice(0, threeAmount.index).trim(),
    };
  }
  const two = chunk.match(/\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*Cr\s*$/i);
  if (two) {
    return {
      withdrawal: parseAmount(two[1]),
      balance: parseAmount(two[2]),
      bodyWithoutAmounts: chunk.slice(0, two.index).trim(),
    };
  }
  const one = chunk.match(/\s+([\d,]+\.\d{2})\s*Cr\s*$/i);
  if (!one) return null;
  return {
    balance: parseAmount(one[1]),
    bodyWithoutAmounts: chunk.slice(0, one.index).trim(),
  };
}

function parseTransactionChunk(chunk) {
  const amountTail = parseAmountTail(chunk);
  if (!amountTail) return null;

  const transactionMatch = amountTail.bodyWithoutAmounts.match(
    /^(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+)$/,
  );
  if (!transactionMatch) return null;

  const tranDate = parseIciciDate(transactionMatch[1]);
  const valueDate = parseIciciDate(transactionMatch[2]);
  if (!tranDate || !valueDate) return null;

  const { description, location } = splitDescriptionAndLocation(transactionMatch[3]);
  const withdrawal = amountTail.withdrawal ?? 0;
  const deposit = amountTail.deposit ?? 0;
  const amount = deposit > 0 ? deposit : withdrawal;
  if (amount <= 0) return null;

  return { date: tranDate, description, location, balance: amountTail.balance, amount };
}

function findTransactionBodyStart(cleaned) {
  const broughtForwardStart = cleaned.search(/\d{2}-\d{2}-\d{4}\s+B\/F/i);
  if (broughtForwardStart >= 0) return broughtForwardStart;
  return cleaned.search(/\d{2}-\d{2}-\d{4}\s+\d{2}-\d{2}-\d{4}\s+/);
}

function findTransactionRowEnd(cleaned, start) {
  const tail = cleaned.slice(start);
  if (/^\d{2}-\d{2}-\d{4}\s+B\/F/i.test(tail)) {
    const one = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s*Cr/i);
    return one ? start + one[0].length : start + tail.length;
  }
  const three = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s*Cr/i);
  if (three) return start + three[0].length;
  const two = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s+[\d,]+\.\d{2}\s*Cr/i);
  if (two) return start + two[0].length;
  const one = tail.match(/^[\s\S]*?\s+[\d,]+\.\d{2}\s*Cr/i);
  if (one) return start + one[0].length;
  return cleaned.length;
}

function sliceTransactionChunks(cleaned) {
  const chunks = [];
  let searchFrom = 0;
  while (searchFrom < cleaned.length) {
    while (searchFrom < cleaned.length && /\s/.test(cleaned[searchFrom])) searchFrom += 1;
    if (searchFrom >= cleaned.length) break;
    const slice = cleaned.slice(searchFrom);
    const rowStart = slice.match(/^(\d{2}-\d{2}-\d{4})\s+(?:B\/F|\d{2}-\d{2}-\d{4})\s+/);
    if (!rowStart) break;
    const rowEnd = findTransactionRowEnd(cleaned, searchFrom);
    const chunk = cleaned.slice(searchFrom, rowEnd).trim();
    if (chunk) chunks.push(chunk);
    searchFrom = rowEnd;
  }
  return chunks;
}

function parseIciciTransactionsFromText(text) {
  const section = text.split(/Statement of transactions/i)[1] ?? '';
  const afterHeader = section.replace(/[\s\S]*?Balance \(INR\)\s*/i, '').trim();
  const bodyStart = findTransactionBodyStart(afterHeader);
  const cleaned = bodyStart >= 0 ? afterHeader.slice(bodyStart) : afterHeader;
  const footerIndex = cleaned.search(/\*{3}\s*End of Statement/i);
  const body = footerIndex >= 0 ? cleaned.slice(0, footerIndex) : cleaned;
  return sliceTransactionChunks(body).map(parseTransactionChunk).filter(Boolean);
}

const pdfPath = path.join(__dirname, '..', 'support_files', '579963418_2026_M04.PDF');
const data = new Uint8Array(fs.readFileSync(pdfPath));
const document = await pdfjs.getDocument({ data }).promise;
let text = '';
for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
  const page = await document.getPage(pageNumber);
  const textContent = await page.getTextContent();
  text += textContent.items.map((item) => item.str).join(' ') + ' ';
}

const summary = parseIciciSummaryFromText(text);
const entries = parseIciciTransactionsFromText(text);
console.log('summary', summary);
console.log('entries', entries.length);
console.log('last', entries[entries.length - 1]);
