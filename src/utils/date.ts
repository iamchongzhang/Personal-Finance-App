/**
 * Returns the current month as a "YYYY-MM" string.
 *
 * Used throughout the app whenever we need to group or filter expenses by
 * the current month — for example, showing monthly totals in the sidebar
 * or computing month-over-month changes on the stats bar.
 *
 * Previously this exact same logic was duplicated in three different files.
 * Having it in one place means we only need to change it once if the format
 * ever needs to be different.
 *
 * @example getCurrentMonthKey() // "2026-07" (if today is July 2026)
 */
export function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
