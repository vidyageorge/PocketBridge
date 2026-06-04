import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parseIciciTransactionsFromText } from '@/lib/iciciPdfTransactions';
import { parseIciciSummaryFromText } from '@/lib/iciciStatementSummary';
import type { BankStatementPreview } from '@/types/transaction';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const EMPTY_DETECTED_COLUMNS: BankStatementPreview['detectedColumns'] = {
  tranDate: 'PDF',
  valueDate: 'PDF',
  description: 'PDF',
  location: 'PDF',
  chqNo: 'Not in PDF',
  debit: 'PDF',
  credit: 'PDF',
  balance: 'PDF',
};

async function extractPdfPlainText(buffer: ArrayBuffer): Promise<string> {
  const document = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n');
}

/**
 * Extracts ICICI statement summary and transactions from a bank PDF.
 */
export async function parseBankStatementPdf(file: File): Promise<BankStatementPreview> {
  const buffer = await file.arrayBuffer();
  const text = await extractPdfPlainText(buffer);
  const statementSummary = parseIciciSummaryFromText(text);
  const entries = parseIciciTransactionsFromText(text);

  return {
    entries,
    skipped: [],
    statementSummary,
    detectedColumns: EMPTY_DETECTED_COLUMNS,
  };
}
