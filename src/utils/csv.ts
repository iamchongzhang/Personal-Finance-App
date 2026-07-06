import type { Expense } from '../types/expense'

/**
 * Convert an array of expense objects into a CSV (Comma-Separated Values) string.
 *
 * ## What is CSV?
 *
 * CSV is a plain-text format that spreadsheets (Excel, Google Sheets) can open.
 * Each line is one row, and commas separate the columns. This function is used
 * when the user clicks "Export" — it takes their expense data from the database
 * and turns it into a downloadable .csv file.
 *
 * ## Why are some fields wrapped in quotes?
 *
 * Category names and notes can contain commas (e.g. "Food, Drinks & Snacks").
 * If we didn't wrap them in quotes, a spreadsheet would split one value across
 * two columns. The quotes tell the spreadsheet "everything between these
 * quotes is one cell, even if there's a comma inside."
 *
 * ## The double-quote escaping (`""`):
 *
 * If the user's note contains a literal double-quote character (e.g.
 * 'He said "hello"'), we double it up to `""` inside the CSV cell. This is
 * the standard CSV escaping rule: a double-quote inside a quoted field is
 * represented as two double-quote characters.
 *
 * @param expenses - The list of expense objects to export.
 * @returns A CSV string ready to be written to a .csv file.
 */
export function expensesToCsv(expenses: Expense[]): string {
  // The first line of a CSV is the "header row" — column names.
  const header = 'Date,Primary Category,Secondary Category,Amount,Note'

  // Build one row string per expense.
  const rows = expenses.map((e) =>
    [
      e.date,
      // Wrap text fields in double quotes to protect embedded commas.
      `"${e.primary_category}"`,
      `"${e.secondary_category}"`,
      // Format the amount with exactly 2 decimal places (e.g. 42.99).
      e.amount.toFixed(2),
      // Escape any double-quote characters in the user's note by doubling them.
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ].join(',')
  )

  // Join all rows with newline characters to produce valid CSV.
  return [header, ...rows].join('\n')
}

/**
 * Parse a CSV string back into an array of Expense objects.
 *
 * This is the reverse of `expensesToCsv()`. It is used when the user imports
 * a .csv file (for example, from a bank export or another budgeting app).
 *
 * ## What happens during parsing
 *
 *   1. Split the text into lines, skipping blank ones.
 *   2. Skip the first line (it is the header row, not actual data).
 *   3. For each remaining line, use `parseCsvLine()` to split it into columns
 *      while respecting quotes.
 *   4. Validate the row has enough columns and the amount is a positive number.
 *   5. Build an Expense object from the column values.
 *
 * ## Error handling
 *
 * This function is forgiving — it silently skips malformed rows rather than
 * crashing. Rows with missing columns, non-numeric amounts, or zero/negative
 * amounts are simply ignored. This means the user might not get every row
 * imported if their CSV file has problems, but the import will succeed for
 * the valid rows.
 *
 * @param csv - Raw text content of a .csv file.
 * @returns A clean array of Expense objects (invalid rows are skipped).
 */
export function csvToExpenses(csv: string): Expense[] {
  // Split the text into lines, removing any that are completely blank.
  const lines = csv.split('\n').filter((l) => l.trim())

  // Need at least a header row + one data row; otherwise there's nothing to do.
  if (lines.length < 2) return []

  const expenses: Expense[] = []

  // Start at index 1 to skip the header row (index 0).
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])

    // A valid expense row needs at least 4 columns: Date, Primary, Secondary, Amount.
    // Note is optional (column index 4), so we don't require it.
    if (row.length < 4) continue

    // Column index 3 (zero-based) is the amount. It must be a positive number.
    const amount = parseFloat(row[3])
    if (isNaN(amount) || amount <= 0) continue

    // Build the expense object from the parsed column values.
    expenses.push({
      amount,
      primary_category: row[1],
      secondary_category: row[2],
      date: row[0],
      note: row[4] || '',   // Default to empty string if no note column exists.
    })
  }

  return expenses
}

/**
 * Split one line of CSV text into individual column values.
 *
 * ## Why not just use `line.split(',')`?
 *
 * A simple split on commas would break on values like:
 *
 * ```
 * 2026-07-06,"Food, Drinks & Snacks",Groceries,15.50,"Bought chips, soda, and candy"
 * ```
 *
 * Splitting that on commas would produce 7 pieces instead of 5, because the
 * commas inside the quoted fields would also be split. This function is a
 * proper CSV parser that treats everything inside double quotes as a single
 * column value.
 *
 * ## How the algorithm works (step by step)
 *
 * The function walks through the input string character by character, keeping
 * track of two things:
 *
 *   - `current` — the text we've accumulated so far for the current column.
 *   - `inQuotes` — a flag that is `true` when we are inside a quoted section
 *     and `false` when we are not.
 *
 * Rules applied at each character:
 *
 * | Character  | Inside quotes? | What happens                                  |
 * |------------|----------------|-----------------------------------------------|
 * | `"`        | No             | Enter quoted mode. Don't add the quote.         |
 * | `"`        | Yes            | Look ahead. If the next char is also `"`, it is an escaped quote — add one `"` and skip the next char. Otherwise, exit quoted mode. |
 * | `,`        | No             | This column is finished — save `current` to the result array and reset it. |
 * | `,`        | Yes            | Just a literal comma inside quotes — add it to `current`. |
 * | anything   | either         | Add the character to `current`.                |
 *
 * After the loop finishes, whatever is left in `current` becomes the last
 * column (a CSV line doesn't end with a comma, so the final column is not
 * triggered by the comma rule above).
 *
 * ## Example walk-through
 *
 * Given the input: `hello,"world, earth",foo`
 *
 * ```
 * h → add                current="h"
 * e → add                current="he"
 * l → add                current="hel"
 * l → add                current="hell"
 * o → add                current="hello"
 * , → not in quotes      save "hello", reset
 * " → not in quotes      enter quoted mode  (current="")
 * w → add (in quotes)    current="w"
 * o → add (in quotes)    current="wo"
 * r → add (in quotes)    current="wor"
 * l → add (in quotes)    current="worl"
 * d → add (in quotes)    current="world"
 * , → add (in quotes)    current="world,"    ← comma kept because we're inside quotes!
 *   → add (in quotes)    current="world, "
 * e → add (in quotes)    current="world, e"
 * a → add (in quotes)    current="world, ea"
 * r → add (in quotes)    current="world, ear"
 * t → add (in quotes)    current="world, eart"
 * h → add (in quotes)    current="world, earth"
 * " → in quotes, next is , not " → exit quoted mode
 * , → not in quotes      save "world, earth", reset
 * f → add                current="f"
 * o → add                current="fo"
 * o → add                current="foo"
 * END → save "foo"
 * ```
 *
 * Result: `["hello", "world, earth", "foo"]`
 *
 * @param line - A single line of CSV text (no newline characters).
 * @returns An array of column values, with surrounding whitespace trimmed from each.
 */
function parseCsvLine(line: string): string[] {
  // The accumulated column values we'll return.
  const result: string[] = []

  // Characters collected so far for the current column.
  let current = ''

  // Are we currently between an opening quote and its matching closing quote?
  let inQuotes = false

  // Walk through each character one at a time.
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (inQuotes) {
      // ─── WE ARE INSIDE A QUOTED FIELD ──────────────────────────────────
      if (ch === '"') {
        // A quote inside quotes — could be a closing quote OR an escaped quote.
        // Look one character ahead to decide.
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Two double-quote characters in a row (""). This is the standard
          // CSV way to represent a single literal double-quote in the data.
          // Example: "He said ""hello""" → the actual value is: He said "hello"
          current += '"'
          // Skip the next character since we already handled it.
          i++
        } else {
          // A lone double-quote means "end of the quoted field."
          inQuotes = false
        }
      } else {
        // Any other character inside quotes (letters, commas, spaces, etc.)
        // is part of the column value — just add it.
        current += ch
      }
    } else {
      // ─── WE ARE OUTSIDE QUOTES (in "normal" mode) ──────────────────────
      if (ch === '"') {
        // A double-quote in normal mode signals the start of a quoted field.
        // Enter quoted mode. Do NOT add the quote character to current.
        inQuotes = true
      } else if (ch === ',') {
        // A comma in normal mode is a column separator.
        // The current column is complete — save it and start a new one.
        // trim() removes any whitespace that might have snuck in around the value.
        result.push(current.trim())
        current = ''
      } else {
        // Just a regular character — add it to the current column.
        current += ch
      }
    }
  }

  // After the loop, there's always one last column sitting in `current`.
  // CSV lines don't end with a comma, so the final column is never triggered
  // by the comma rule — we have to push it manually here.
  result.push(current.trim())

  return result
}
