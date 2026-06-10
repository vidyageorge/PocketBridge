import * as XLSX from 'xlsx';
import { normalizeKey, parseAmount, parseDateValue, parseOptionalText } from '@/lib/parseUtils';
import type {
  AddClientProjectInput,
  ClientPaymentColumnFilters,
  ClientPaymentInput,
  ClientPaymentRecord,
  ClientPaymentRegistry,
  ClientPaymentSummary,
  ClientProjectMeta,
  CompletedProjectSummary,
  ProjectStatus,
} from '@/types/clientPayment';
import { EMPTY_CLIENT_PAYMENT_REGISTRY } from '@/types/clientPayment';

export const CLIENT_PAYMENT_BLANK_FILTER = '__blank__';

const CLIENT_PAYMENT_DROPDOWN_FIELDS = new Set<keyof ClientPaymentColumnFilters>([
  'sno',
  'paymentDate',
  'description',
  'invoiceNumber',
  'comment',
]);

function parseSheetMetadata(
  rows: unknown[][],
  sheetName: string,
): Pick<ClientPaymentRecord, 'projectCode' | 'projectName' | 'clientName'> {
  let projectCode = sheetName;
  let projectName = '';
  let clientName = '';

  for (const row of rows.slice(0, 6)) {
    const firstCell = String(row[0] ?? '');
    const thirdCell = String(row[2] ?? '').trim();

    if (firstCell.includes('PROJECT CODE') && thirdCell) {
      projectCode = thirdCell;
    }
    if (firstCell.startsWith('PROJECT NAME')) {
      projectName = firstCell.replace(/^PROJECT NAME:\s*/i, '').trim();
    }
    if (firstCell.startsWith('CLIENT')) {
      clientName = firstCell.replace(/^CLIENT\s*:\s*/i, '').trim();
    }
  }

  return { projectCode, projectName, clientName };
}

function hasSplitAmountColumns(rows: unknown[][], headerRowIndex: number): boolean {
  const subHeaderRow = rows[headerRowIndex + 1];
  if (!subHeaderRow) {
    return false;
  }
  const amountLabel = normalizeKey(String(subHeaderRow[3] ?? ''));
  return amountLabel.includes('banking') || amountLabel.includes('cash');
}

function resolvePaymentAmounts(
  row: unknown[],
  splitAmountColumns: boolean,
): Pick<ClientPaymentRecord, 'banking' | 'cash' | 'gpay' | 'amount'> {
  if (splitAmountColumns) {
    const banking = parseAmount(row[3]) ?? 0;
    const cash = parseAmount(row[4]) ?? 0;
    const gpay = parseAmount(row[5]) ?? 0;
    const runningTotal = parseAmount(row[6]) ?? 0;
    const remarkValue = parseAmount(row[9]) ?? 0;

    let amount = banking + cash + gpay;
    if (amount === 0 && runningTotal > 0) {
      amount = runningTotal;
    }
    if (amount === 0 && remarkValue > 0) {
      amount = remarkValue;
    }

    return { banking, cash, gpay, amount };
  }

  const amount = parseAmount(row[3]) ?? 0;
  return { banking: amount, cash: 0, gpay: 0, amount };
}

function parseClientPaymentRow(
  row: unknown[],
  sheetName: string,
  metadata: Pick<ClientPaymentRecord, 'projectCode' | 'projectName' | 'clientName'>,
  splitAmountColumns: boolean,
  nextId: number,
): ClientPaymentRecord | null {
  if (typeof row[0] !== 'number') {
    return null;
  }

  const description = parseOptionalText(row[2]) ?? '';
  const amounts = resolvePaymentAmounts(row, splitAmountColumns);

  if (!description && amounts.amount === 0) {
    return null;
  }

  return {
    id: nextId,
    sheetProject: sheetName,
    projectCode: metadata.projectCode,
    projectName: metadata.projectName,
    clientName: metadata.clientName,
    sno: String(row[0]),
    paymentDate: parseDateValue(row[1]) ?? '',
    description: description || '—',
    banking: amounts.banking,
    cash: amounts.cash,
    gpay: amounts.gpay,
    amount: amounts.amount,
    invoiceNumber: parseOptionalText(row[7]) ?? '',
    remarkDate: parseDateValue(row[8]) ?? '',
    remarkValue: parseAmount(row[9]) ?? 0,
    comment: parseOptionalText(row[10]) ?? '',
  };
}

export function parseClientPaymentFromWorkbook(
  workbook: XLSX.WorkBook,
  sheetNames: string[] = workbook.SheetNames,
): ClientPaymentRecord[] {
  const records: ClientPaymentRecord[] = [];
  let nextId = 1;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const metadata = parseSheetMetadata(rows, sheetName);
    const headerRowIndex = rows.findIndex((row) => normalizeKey(String(row[0] ?? '')) === 'sno');

    if (headerRowIndex < 0) {
      continue;
    }

    const splitAmountColumns = hasSplitAmountColumns(rows, headerRowIndex);
    const dataStartIndex = headerRowIndex + (splitAmountColumns ? 2 : 1);

    for (let rowIndex = dataStartIndex; rowIndex < rows.length; rowIndex += 1) {
      const parsed = parseClientPaymentRow(
        rows[rowIndex],
        sheetName,
        metadata,
        splitAmountColumns,
        nextId,
      );
      if (parsed) {
        records.push(parsed);
        nextId += 1;
      }
    }
  }

  return records.map((record, index) => ({ ...record, id: index + 1 }));
}

export function parseClientPaymentWorkbook(buffer: ArrayBuffer): ClientPaymentRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  return parseClientPaymentFromWorkbook(workbook);
}

function matchesTextField(value: string, filter: string): boolean {
  if (!filter.trim()) {
    return true;
  }
  return value.toLowerCase().includes(filter.trim().toLowerCase());
}

function matchesDropdownField(value: string, filter: string): boolean {
  if (!filter.trim()) {
    return true;
  }
  if (filter === CLIENT_PAYMENT_BLANK_FILTER) {
    return !value.trim();
  }
  return value.trim().toLowerCase() === filter.trim().toLowerCase();
}

function matchesColumnField(
  value: string,
  filter: string,
  field: keyof ClientPaymentColumnFilters,
): boolean {
  if (CLIENT_PAYMENT_DROPDOWN_FIELDS.has(field)) {
    return matchesDropdownField(value, filter);
  }
  return matchesTextField(value, filter);
}

export function getClientPaymentFieldValue(
  record: ClientPaymentRecord,
  field: keyof ClientPaymentColumnFilters,
): string {
  switch (field) {
    case 'sno':
      return record.sno;
    case 'paymentDate':
      return record.paymentDate;
    case 'description':
      return record.description;
    case 'banking':
      return record.banking > 0 ? String(record.banking) : '';
    case 'cash':
      return record.cash > 0 ? String(record.cash) : '';
    case 'gpay':
      return record.gpay > 0 ? String(record.gpay) : '';
    case 'amount':
      return String(record.amount);
    case 'invoiceNumber':
      return record.invoiceNumber;
    case 'comment':
      return record.comment;
    default:
      return '';
  }
}

export function getClientPaymentColumnOptions(
  records: ClientPaymentRecord[],
  field: keyof ClientPaymentColumnFilters,
): string[] {
  const values = new Set<string>();
  for (const record of records) {
    values.add(getClientPaymentFieldValue(record, field).trim());
  }

  return [...values].sort((left, right) => {
    if (!left && right) {
      return 1;
    }
    if (left && !right) {
      return -1;
    }
    return left.localeCompare(right);
  });
}

export function applyClientPaymentColumnFilters(
  records: ClientPaymentRecord[],
  filters: ClientPaymentColumnFilters,
): ClientPaymentRecord[] {
  return records.filter((record) => {
    const fields = Object.keys(filters) as (keyof ClientPaymentColumnFilters)[];
    return fields.every((field) =>
      matchesColumnField(getClientPaymentFieldValue(record, field), filters[field], field),
    );
  });
}

export function filterClientPaymentsByProject(
  records: ClientPaymentRecord[],
  sheetProject: string,
): ClientPaymentRecord[] {
  return records.filter((record) => record.sheetProject === sheetProject);
}

export function sortClientPaymentsByDateDesc(records: ClientPaymentRecord[]): ClientPaymentRecord[] {
  return [...records].sort((left, right) => {
    const leftDate = left.paymentDate || '';
    const rightDate = right.paymentDate || '';

    if (!leftDate && !rightDate) {
      return Number(right.sno) - Number(left.sno);
    }
    if (!leftDate) {
      return 1;
    }
    if (!rightDate) {
      return -1;
    }

    return rightDate.localeCompare(leftDate);
  });
}

export function computeClientPaymentSummary(records: ClientPaymentRecord[]): ClientPaymentSummary {
  return records.reduce(
    (summary, record) => {
      summary.paymentCount += 1;
      summary.totalAmount += record.amount;
      summary.totalBanking += record.banking;
      summary.totalCash += record.cash;
      summary.totalGpay += record.gpay;
      return summary;
    },
    {
      paymentCount: 0,
      totalAmount: 0,
      totalBanking: 0,
      totalCash: 0,
      totalGpay: 0,
    },
  );
}

/**
 * Normalizes user input to a sheet label such as P-01.
 */
export function normalizeSheetProjectLabel(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return '';
  }

  const sheetMatch = trimmed.match(/^P-(\d+)$/);
  if (sheetMatch) {
    return `P-${sheetMatch[1].padStart(2, '0')}`;
  }

  const digitsOnly = trimmed.replace(/^P-?/, '');
  if (/^\d+$/.test(digitsOnly)) {
    return `P-${digitsOnly.padStart(2, '0')}`;
  }

  return trimmed;
}

export function getNextClientPaymentId(records: ClientPaymentRecord[]): number {
  return records.reduce((maximum, record) => Math.max(maximum, record.id), 0) + 1;
}

export function getNextClientPaymentSno(
  records: ClientPaymentRecord[],
  sheetProject: string,
): string {
  const projectRecords = filterClientPaymentsByProject(records, sheetProject);
  const maximumSerial = projectRecords.reduce((maximum, record) => {
    const parsedSerial = Number(record.sno);
    if (!Number.isFinite(parsedSerial)) {
      return maximum;
    }
    return Math.max(maximum, parsedSerial);
  }, 0);

  return String(maximumSerial + 1);
}

export function resolveClientPaymentAmounts(
  input: Pick<ClientPaymentInput, 'banking' | 'cash' | 'gpay'>,
  useSplitAmounts: boolean,
): Pick<ClientPaymentRecord, 'banking' | 'cash' | 'gpay' | 'amount'> {
  const banking = Math.max(0, input.banking);
  const cash = Math.max(0, input.cash);
  const gpay = Math.max(0, input.gpay);

  if (useSplitAmounts) {
    const amount = banking + cash + gpay;
    return { banking, cash, gpay, amount };
  }

  const amount = banking;
  return { banking: amount, cash: 0, gpay: 0, amount };
}

/**
 * Applies form input to an existing client payment row (preserves id and serial).
 */
export function applyClientPaymentUpdate(
  existing: ClientPaymentRecord,
  input: ClientPaymentInput,
  useSplitAmounts: boolean,
): ClientPaymentRecord | null {
  const amounts = resolveClientPaymentAmounts(input, useSplitAmounts);
  const trimmedDescription = input.description.trim();

  if (!input.paymentDate || (!trimmedDescription && amounts.amount === 0)) {
    return null;
  }

  return {
    ...existing,
    paymentDate: input.paymentDate,
    description: trimmedDescription || '—',
    banking: amounts.banking,
    cash: amounts.cash,
    gpay: amounts.gpay,
    amount: amounts.amount,
    invoiceNumber: input.invoiceNumber?.trim() ?? '',
    comment: input.comment?.trim() ?? existing.comment,
  };
}

export function buildClientPaymentRecord(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry,
  input: ClientPaymentInput,
  useSplitAmounts: boolean,
): ClientPaymentRecord | null {
  const sheetProject = normalizeSheetProjectLabel(input.sheetProject);
  const meta = getClientProjectMeta(records, registry, sheetProject);
  if (!meta) {
    return null;
  }

  const amounts = resolveClientPaymentAmounts(input, useSplitAmounts);
  const trimmedDescription = input.description.trim();

  if (!input.paymentDate || (!trimmedDescription && amounts.amount === 0)) {
    return null;
  }

  return {
    id: getNextClientPaymentId(records),
    sheetProject: meta.sheetProject,
    projectCode: meta.projectCode,
    projectName: meta.projectName,
    clientName: meta.clientName,
    sno: getNextClientPaymentSno(records, meta.sheetProject),
    paymentDate: input.paymentDate,
    description: trimmedDescription || '—',
    banking: amounts.banking,
    cash: amounts.cash,
    gpay: amounts.gpay,
    amount: amounts.amount,
    invoiceNumber: input.invoiceNumber?.trim() ?? '',
    remarkDate: '',
    remarkValue: 0,
    comment: input.comment?.trim() ?? '',
  };
}

export function normalizeProjectStatus(project: ClientProjectMeta): ClientProjectMeta {
  return {
    ...project,
    status: project.status ?? 'active',
  };
}

export function isProjectCompleted(project: ClientProjectMeta): boolean {
  return normalizeProjectStatus(project).status === 'completed';
}

export function getClientProjectList(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): ClientProjectMeta[] {
  const projects = new Map<string, ClientProjectMeta>();

  for (const project of registry.projects) {
    projects.set(project.sheetProject, normalizeProjectStatus(project));
  }

  for (const record of records) {
    if (!projects.has(record.sheetProject)) {
      projects.set(record.sheetProject, {
        sheetProject: record.sheetProject,
        projectCode: record.projectCode,
        projectName: record.projectName,
        clientName: record.clientName,
        status: 'active',
      });
    }
  }

  return [...projects.values()].sort((left, right) =>
    left.sheetProject.localeCompare(right.sheetProject),
  );
}

export function getActiveClientProjectList(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): ClientProjectMeta[] {
  return getClientProjectList(records, registry).filter((project) => !isProjectCompleted(project));
}

export function getCompletedClientProjectList(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): ClientProjectMeta[] {
  return getClientProjectList(records, registry).filter((project) => isProjectCompleted(project));
}

export function getCompletedProjectSummaries(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): CompletedProjectSummary[] {
  return getCompletedClientProjectList(records, registry)
    .map((project) => {
      const projectRecords = filterClientPaymentsByProject(records, project.sheetProject);
      const paymentDates = projectRecords
        .map((record) => record.paymentDate)
        .filter(Boolean)
        .sort();

      return {
        ...project,
        paymentCount: projectRecords.length,
        totalReceived: projectRecords.reduce((sum, record) => sum + record.amount, 0),
        firstPaymentDate: paymentDates[0] ?? '',
        lastPaymentDate: paymentDates[paymentDates.length - 1] ?? '',
      };
    })
    .sort((left, right) => (right.completedAt ?? '').localeCompare(left.completedAt ?? ''));
}

export function getDefaultClientProject(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): string {
  const projects = getActiveClientProjectList(records, registry);
  return projects[0]?.sheetProject ?? '';
}

export function mergeClientPaymentRegistry(
  incoming: ClientPaymentRegistry,
  existing: ClientPaymentRegistry,
): ClientPaymentRegistry {
  const existingBySheet = new Map(
    existing.projects.map((project) => [project.sheetProject, normalizeProjectStatus(project)]),
  );
  const mergedProjects = new Map<string, ClientProjectMeta>();

  for (const project of incoming.projects) {
    const previous = existingBySheet.get(project.sheetProject);
    mergedProjects.set(project.sheetProject, {
      ...project,
      status: previous?.status ?? project.status ?? 'active',
      completedAt: previous?.status === 'completed' ? previous.completedAt : project.completedAt,
    });
  }

  for (const project of existing.projects) {
    if (isProjectCompleted(project) && !mergedProjects.has(project.sheetProject)) {
      mergedProjects.set(project.sheetProject, normalizeProjectStatus(project));
    }
  }

  const clientNames = new Set([...existing.clientNames, ...incoming.clientNames]);

  return {
    projects: [...mergedProjects.values()].sort((left, right) =>
      left.sheetProject.localeCompare(right.sheetProject),
    ),
    clientNames: [...clientNames].sort((left, right) => left.localeCompare(right)),
  };
}

export function getClientProjectMeta(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry,
  sheetProject: string,
): ClientProjectMeta | null {
  const normalizedProject = normalizeSheetProjectLabel(sheetProject);
  const fromRegistry = registry.projects.find(
    (project) => project.sheetProject === normalizedProject,
  );
  if (fromRegistry) {
    return fromRegistry;
  }

  const record = records.find((entry) => entry.sheetProject === normalizedProject);
  if (!record) {
    return null;
  }

  return {
    sheetProject: record.sheetProject,
    projectCode: record.projectCode,
    projectName: record.projectName,
    clientName: record.clientName,
    status: 'active' as ProjectStatus,
  };
}

export type ClientSummary = {
  clientName: string;
  projectCount: number;
  paymentCount: number;
  totalReceived: number;
  projects: string[];
};

function resolveClientName(record: ClientPaymentRecord): string {
  return record.clientName.trim() || 'Unknown client';
}

/**
 * Builds one row per client with totals and linked project sheets.
 */
export function getClientList(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): ClientSummary[] {
  const clients = new Map<string, ClientSummary>();

  for (const clientName of registry.clientNames) {
    const trimmedName = clientName.trim();
    if (!trimmedName) {
      continue;
    }
    clients.set(trimmedName, {
      clientName: trimmedName,
      projectCount: 0,
      paymentCount: 0,
      totalReceived: 0,
      projects: [],
    });
  }

  for (const project of registry.projects) {
    const trimmedName = project.clientName.trim();
    if (!trimmedName) {
      continue;
    }
    const existing = clients.get(trimmedName) ?? {
      clientName: trimmedName,
      projectCount: 0,
      paymentCount: 0,
      totalReceived: 0,
      projects: [],
    };
    if (!existing.projects.includes(project.sheetProject)) {
      existing.projects.push(project.sheetProject);
      existing.projectCount = existing.projects.length;
    }
    clients.set(trimmedName, existing);
  }

  for (const record of records) {
    const clientName = resolveClientName(record);
    const existing = clients.get(clientName) ?? {
      clientName,
      projectCount: 0,
      paymentCount: 0,
      totalReceived: 0,
      projects: [],
    };

    existing.paymentCount += 1;
    existing.totalReceived += record.amount;

    if (!existing.projects.includes(record.sheetProject)) {
      existing.projects.push(record.sheetProject);
      existing.projectCount = existing.projects.length;
    }

    clients.set(clientName, existing);
  }

  return [...clients.values()].sort((left, right) =>
    left.clientName.localeCompare(right.clientName),
  );
}

export function getDefaultClientName(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry = EMPTY_CLIENT_PAYMENT_REGISTRY,
): string {
  const clients = getClientList(records, registry);
  return clients[0]?.clientName ?? '';
}

export function getProjectsForClient(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry,
  clientName: string,
): ClientProjectMeta[] {
  const trimmedClient = clientName.trim();
  return getClientProjectList(records, registry).filter(
    (project) => project.clientName.trim() === trimmedClient,
  );
}

/**
 * Returns the next workbook-style sheet label (P-01, P-02, …).
 */
export function getNextSheetProjectLabel(
  records: ClientPaymentRecord[],
  registry: ClientPaymentRegistry,
): string {
  const projects = getClientProjectList(records, registry);
  let maximumNumber = 0;

  for (const project of projects) {
    const match = project.sheetProject.match(/^P-(\d+)$/i);
    if (match) {
      maximumNumber = Math.max(maximumNumber, Number(match[1]));
    }
  }

  return `P-${String(maximumNumber + 1).padStart(2, '0')}`;
}

export function validateAddClientProjectInput(input: AddClientProjectInput): string | null {
  const sheetProject = normalizeSheetProjectLabel(input.sheetProject);
  if (!sheetProject) {
    return 'Enter a project label such as P-05.';
  }
  if (!input.projectCode.trim()) {
    return 'Enter a project code.';
  }
  if (!input.projectName.trim()) {
    return 'Enter a project name.';
  }
  if (!input.clientName.trim()) {
    return 'Enter a client name.';
  }
  return null;
}

export function filterClientPaymentsByClient(
  records: ClientPaymentRecord[],
  clientName: string,
): ClientPaymentRecord[] {
  return records.filter((record) => resolveClientName(record) === clientName);
}

export function sheetUsesSplitAmounts(records: ClientPaymentRecord[]): boolean {
  return records.some(
    (record) => record.banking > 0 || record.cash > 0 || record.gpay > 0,
  );
}

/**
 * Builds project and client lists from imported payment rows.
 */
export function buildClientPaymentRegistry(records: ClientPaymentRecord[]): ClientPaymentRegistry {
  const projects = new Map<string, ClientProjectMeta>();
  const clientNames = new Set<string>();

  for (const record of records) {
    if (!projects.has(record.sheetProject)) {
      projects.set(record.sheetProject, {
        sheetProject: record.sheetProject,
        projectCode: record.projectCode,
        projectName: record.projectName,
        clientName: record.clientName,
        status: 'active',
      });
    }

    const trimmedClient = record.clientName.trim();
    if (trimmedClient) {
      clientNames.add(trimmedClient);
    }
  }

  return {
    projects: [...projects.values()].sort((left, right) =>
      left.sheetProject.localeCompare(right.sheetProject),
    ),
    clientNames: [...clientNames].sort((left, right) => left.localeCompare(right)),
  };
}
