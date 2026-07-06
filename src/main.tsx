/**
 * App Entry Point
 * --------------
 * This is the very first file that runs when the app starts. Think of it as the
 * "ignition key" — it takes the React app we built and attaches it to the HTML
 * page so the user can see and interact with it.
 *
 * The process works in two steps:
 *   1. Find the empty <div id="root"> in index.html (a "mount point").
 *   2. Render our React component tree inside that div.
 *
 * Everything the user sees — the dashboard, forms, tables, charts — grows from
 * this single file.
 */

import { StrictMode } from 'react'
// StrictMode is a development helper. It doesn't show anything on screen.
// Instead, it double-runs certain parts of your code during development to
// help you spot accidental side-effects, outdated patterns, or potential bugs
// before they cause problems in production. It has zero effect on the
// production build — it simply makes your dev console noisier on purpose.

import { createRoot } from 'react-dom/client'
// createRoot is the React 18+ way to attach a React app to the DOM.
// "DOM" = Document Object Model, the browser's internal tree of HTML elements.
// We call it once: find the "root" div, then render our component tree inside it.

import './index.css'
// Global styles that apply to the entire app (layout, resets, etc.).

import App from './App'
// The top-level React component — our entire application.

import ErrorBoundary from './components/ErrorBoundary'
// A safety net. If any child component crashes (throws an error), the
// ErrorBoundary catches it and shows a friendly "Something went wrong" message
// instead of a blank white screen.

// Create the React root and render the app.
// The '!' after getElementById tells TypeScript "we are certain this element
// exists — don't warn us about it being possibly null."
createRoot(document.getElementById('root')!).render(
  // <StrictMode> wraps the app in React's developer checks (see import above).
  <StrictMode>
    {/* ErrorBoundary catches crashes anywhere inside <App /> */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
