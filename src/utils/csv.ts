import type { Expense } from '../types/expense'

export function expensesToCsv(expenses: Expense[]): string {
  const header = 'Date,Primary Category,Secondary Category,Amount,Note'
  const rows = expenses.map((e) =>
    [
      e.date,
      `"${e.primary_category}"`,
      `"${e.secondary_category}"`,
      e.amount.toFixed(2),
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

export function csvToExpenses(csv: string): Expense[] {
  const lines = csv.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const expenses: Expense[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    if (row.length < 4) continue

    const amount = parseFloat(row[3])
    if (isNaN(amount) || amount <= 0) continue

    expenses.push({
      amount,
      primary_category: row[1],
      secondary_category: row[2],
      date: row[0],
      note: row[4] || '',
    })
  }
  return expenses
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}
