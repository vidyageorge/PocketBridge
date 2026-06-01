import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import type { TransactionType } from '@/types/transaction';

type CategoryRule = {
  category: string;
  keywords: string[];
};

const INCOME_RULES: CategoryRule[] = [
  { category: 'Salary', keywords: ['salary', 'payroll'] },
  { category: 'Other Income', keywords: ['refund', 'reversal', 'cashback'] },
  {
    category: 'Client Payment',
    keywords: ['client', 'payment', 'neft', 'rtgs', 'imps', 'upi', 'project', 'invoice'],
  },
];

const EXPENSE_RULES: CategoryRule[] = [
  {
    category: 'Materials',
    keywords: ['cement', 'material', 'steel', 'brick', 'sand', 'aggregate', 'supplier'],
  },
  { category: 'Labour', keywords: ['labour', 'labor', 'wage', 'wages', 'mason', 'helper'] },
  { category: 'Equipment', keywords: ['equipment', 'machine', 'rental', 'rent', 'jcb', 'crane'] },
  { category: 'Transport', keywords: ['transport', 'fuel', 'diesel', 'petrol', 'logistics'] },
  { category: 'Utilities', keywords: ['electric', 'electricity', 'water', 'utility', 'bill'] },
  { category: 'Food', keywords: ['food', 'canteen', 'lunch'] },
  { category: 'Health', keywords: ['medical', 'health', 'hospital'] },
];

function normalizeDescription(description: string): string {
  return description.toLowerCase();
}

function matchCategory(description: string, rules: CategoryRule[], fallback: string): string {
  const normalized = normalizeDescription(description);

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.category;
    }
  }

  return fallback;
}

export function inferCategoryFromDescription(
  description: string,
  type: TransactionType,
): string {
  if (type === 'income') {
    return matchCategory(description, INCOME_RULES, 'Client Payment');
  }

  return matchCategory(description, EXPENSE_RULES, 'Other');
}

export function isValidCategory(category: string, type: TransactionType): boolean {
  const allowed = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (allowed as readonly string[]).includes(category);
}
