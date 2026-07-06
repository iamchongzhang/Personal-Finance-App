export interface CategoryNode {
  value: string
  label: string
  children: { value: string; label: string }[]
}

export const categories: CategoryNode[] = [
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

export function getSecondaryCategories(
  primary: string
): { value: string; label: string }[] {
  const cat = categories.find((c) => c.value === primary)
  return cat?.children ?? []
}
