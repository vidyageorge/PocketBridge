import type { StoreKey } from '@/lib/storeKeys';

export type ActivityAction = 'create' | 'update' | 'delete' | 'import' | 'clear';

export type ActivityEntityType =
  | 'transaction'
  | 'procurement'
  | 'client_payment'
  | 'expense_project'
  | 'expense_employee'
  | 'supplier'
  | 'project'
  | 'client';

export type ActivityFieldChange = {
  field: string;
  before: string;
  after: string;
};

export type ActivityUndoPayload = {
  stores: Partial<Record<StoreKey, unknown>>;
};

export type ActivityLogEntry = {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  title: string;
  detail?: string;
  actor: string;
  createdAt: string;
  changes: ActivityFieldChange[];
  undoPayload: ActivityUndoPayload;
  undoneAt: string | null;
};

export type RecordActivityInput = {
  action: ActivityAction;
  entityType: ActivityEntityType;
  title: string;
  detail?: string;
  changes?: ActivityFieldChange[];
  undoPayload: ActivityUndoPayload;
};
