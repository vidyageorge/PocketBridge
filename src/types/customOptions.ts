/**
 * Keys for user-added dropdown values (merged with built-in defaults).
 */
export type CustomOptionListKey =
  | 'expenseCategories'
  | 'incomeCategories'
  | 'bankCategories'
  | 'procurementPaymentStatuses'
  | 'employeeExpenseCategories'
  | 'paymentModes'
  | 'projectCodes'
  | 'employeeNames';

export type CustomOptionsData = Partial<Record<CustomOptionListKey, string[]>>;

export const EMPTY_CUSTOM_OPTIONS: CustomOptionsData = {};
