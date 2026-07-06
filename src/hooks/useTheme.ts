import { useState, useEffect, useCallback } from 'react'

/** The two possible visual modes the user can switch between. */
type Theme = 'light' | 'dark'

/**
 * Custom React hook that manages light/dark mode for the entire app.
 *
 * ## What it does
 *
 *   1. **First visit** — checks whether the user's operating system is set
 *      to dark mode (`prefers-color-scheme: dark`). If so, the app starts
 *      in dark mode automatically. Otherwise it starts in light mode.
 *   2. **Remembers choice** — when the user toggles the theme, the choice is
 *      saved to the browser's `localStorage`. On the next visit, their saved
 *      preference is used instead of the system default.
 *   3. **Applies the theme** — sets a `data-theme` attribute on the root
 *      `<html>` element so CSS rules can react to it (e.g. dark backgrounds,
 *      light text).
 *
 * ## Return value
 *
 * | Property      | Type       | Description                                |
 * |---------------|------------|--------------------------------------------|
 * | `theme`       | string     | Current theme: `"light"` or `"dark"`.      |
 * | `toggleTheme` | function   | Call this to flip between light and dark.  |
 * | `isDark`      | boolean    | Convenience shortcut: `true` if dark mode. |
 */
export function useTheme() {
  // --- Initialize theme state -------------------------------------------------
  // useState can accept a function (called a "lazy initializer"). It runs only
  // once, when the component first mounts.
  const [theme, setTheme] = useState<Theme>(() => {
    // Step 1: has the user already picked a theme in a previous session?
    const stored = localStorage.getItem('app-theme')
    if (stored === 'light' || stored === 'dark') return stored

    // Step 2: no saved preference — ask the operating system.
    // matchMedia queries the OS-level setting for dark mode.
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  // --- Side effect: apply theme to DOM + persist to localStorage --------------
  // useEffect runs AFTER React has painted the UI. Every time `theme` changes,
  // we update the <html> tag's data-theme attribute (which CSS uses) and save
  // the choice to localStorage for next time.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  // --- Toggle function --------------------------------------------------------
  // useCallback memoizes the function so its identity stays stable between
  // renders. This prevents unnecessary re-renders in child components that
  // receive toggleTheme as a prop.
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme, isDark: theme === 'dark' }
}
