import type Database from '@tauri-apps/plugin-sql'
import type { MergedCategoryNode, UserCategory } from '../types/expense'

export interface CategoryNode {
  value: string
  label: string
  children: { value: string; label: string }[]
}

export const BUILTIN_CATEGORIES: CategoryNode[] = [
  {
    value: 'Food & Dining',
    label: 'Food & Dining',
    children: [
      { value: 'Groceries', label: 'Groceries' },
      { value: 'Food Delivery', label: 'Food Delivery' },
      { value: 'Restaurants', label: 'Restaurants' },
      { value: 'Snacks & Drinks', label: 'Snacks & Drinks' },
    ],
  },
  {
    value: 'Transportation',
    label: 'Transportation',
    children: [
      { value: 'Public Transit', label: 'Public Transit' },
      { value: 'Ride-hailing', label: 'Ride-hailing' },
      { value: 'Fuel/Charging', label: 'Fuel/Charging' },
      { value: 'Parking', label: 'Parking' },
    ],
  },
  {
    value: 'Housing',
    label: 'Housing',
    children: [
      { value: 'Rent/Mortgage', label: 'Rent/Mortgage' },
      { value: 'Utilities', label: 'Utilities' },
      { value: 'Property Management', label: 'Property Management' },
      { value: 'Maintenance', label: 'Maintenance' },
    ],
  },
  {
    value: 'Shopping',
    label: 'Shopping',
    children: [
      { value: 'Clothing', label: 'Clothing' },
      { value: 'Electronics', label: 'Electronics' },
      { value: 'Daily Needs', label: 'Daily Needs' },
      { value: 'Home Goods', label: 'Home Goods' },
    ],
  },
  {
    value: 'Entertainment',
    label: 'Entertainment',
    children: [
      { value: 'Movies/TV', label: 'Movies/TV' },
      { value: 'Games', label: 'Games' },
      { value: 'Travel', label: 'Travel' },
      { value: 'Subscriptions', label: 'Subscriptions' },
    ],
  },
  {
    value: 'Healthcare',
    label: 'Healthcare',
    children: [
      { value: 'Medical Visits', label: 'Medical Visits' },
      { value: 'Medicine', label: 'Medicine' },
      { value: 'Fitness', label: 'Fitness' },
    ],
  },
  {
    value: 'Education',
    label: 'Education',
    children: [
      { value: 'Books', label: 'Books' },
      { value: 'Courses & Training', label: 'Courses & Training' },
    ],
  },
  {
    value: 'Communication',
    label: 'Communication',
    children: [
      { value: 'Phone Bill', label: 'Phone Bill' },
      { value: 'Internet', label: 'Internet' },
    ],
  },
  {
    value: 'Finance',
    label: 'Finance',
    children: [
      { value: 'Insurance', label: 'Insurance' },
      { value: 'Loan Interest', label: 'Loan Interest' },
      { value: 'Investment Fees', label: 'Investment Fees' },
    ],
  },
  {
    value: 'Other',
    label: 'Other',
    children: [
      { value: 'Gifts', label: 'Gifts' },
      { value: 'Charity', label: 'Charity' },
      { value: 'Miscellaneous', label: 'Miscellaneous' },
    ],
  },
]

// Backward-compat alias — existing code imports `categories`
export const categories: CategoryNode[] = BUILTIN_CATEGORIES

export function getSecondaryCategories(
  primary: string,
  merged?: MergedCategoryNode[]
): { value: string; label: string }[] {
  const list = merged ?? BUILTIN_CATEGORIES.map((c) => ({ ...c, isBuiltin: true, children: c.children.map((ch) => ({ ...ch, isBuiltin: true })) }))
  const cat = list.find((c) => c.value === primary)
  return cat?.children.map(({ value, label }) => ({ value, label })) ?? []
}

/**
 * Load user-created categories from the database.
 */
export async function loadUserCategories(db: Database): Promise<UserCategory[]> {
  try {
    return await db.select<UserCategory[]>(
      'SELECT * FROM user_categories ORDER BY primary_category, secondary_category'
    )
  } catch {
    return []
  }
}

/**
 * Merge built-in and user-created categories into a single list.
 * Built-in categories come first, followed by user-created (alphabetically).
 */
export function mergeCategories(userCategories: UserCategory[]): MergedCategoryNode[] {
  const builtin: MergedCategoryNode[] = BUILTIN_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
    isBuiltin: true,
    children: c.children.map((ch) => ({ value: ch.value, label: ch.label, isBuiltin: true })),
  }))

  // Group user categories by primary
  const grouped: Record<string, { value: string; label: string; children: { value: string; label: string; isBuiltin: boolean }[] }> = {}
  for (const uc of userCategories) {
    if (!grouped[uc.primary_category]) {
      grouped[uc.primary_category] = {
        value: uc.primary_category,
        label: uc.primary_category,
        children: [],
      }
    }
    grouped[uc.primary_category].children.push({
      value: uc.secondary_category,
      label: uc.secondary_category,
      isBuiltin: false,
    })
  }

  const userNodes: MergedCategoryNode[] = Object.values(grouped)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((g) => ({
      value: g.value,
      label: g.label,
      isBuiltin: false,
      children: g.children.sort((a, b) => a.label.localeCompare(b.label)),
    }))

  return [...builtin, ...userNodes]
}

/**
 * Check whether a category name matches a built-in category.
 */
export function isBuiltinCategory(primary: string, secondary?: string): boolean {
  const cat = BUILTIN_CATEGORIES.find((c) => c.value === primary || c.label === primary)
  if (!cat) return false
  if (!secondary) return true
  return cat.children.some((ch) => ch.value === secondary || ch.label === secondary)
}
