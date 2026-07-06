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
