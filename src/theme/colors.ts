/**
 * Shared color constants for the Personal Finance App.
 *
 * Defining colors in one place means we can change the entire app's color
 * scheme by editing this single file, instead of hunting down hardcoded
 * color values scattered across 8+ files.
 */

/** Primary brand color — green. Used for the main theme, primary buttons, and the sidebar total. */
export const COLOR_PRIMARY = '#16a34a'

/** Secondary color — blue. Used for charts, secondary stats, and the income/balance display. */
export const COLOR_SECONDARY = '#2563eb'

/** Accent color — purple. Used for tertiary chart data and highlighting. */
export const COLOR_ACCENT = '#9333ea'

/**
 * Chart color palette used across the Analytics page for pie charts,
 * bar charts, and legends. Each color is distinct enough to be easily
 * told apart, even for users with common forms of color blindness.
 */
export const CHART_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#dc2626', '#ca8a04', '#0891b2', '#7c3aed', '#db2777', '#65a30d', '#ea580c'] as const
