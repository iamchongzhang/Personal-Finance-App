export interface Expense {
  id?: number
  amount: number
  primary_category: string
  secondary_category: string
  date: string
  note: string
  created_at?: string
  updated_at?: string
}

export interface CategoryOption {
  value: string
  label: string
  children?: CategoryOption[]
}

export interface UserCategory {
  id?: number
  primary_category: string
  secondary_category: string
  created_at?: string
}

export interface MergedCategoryNode {
  value: string
  label: string
  isBuiltin: boolean
  children: { value: string; label: string; isBuiltin: boolean }[]
}
