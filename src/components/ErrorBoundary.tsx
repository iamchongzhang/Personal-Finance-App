import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary is a React safety net that catches rendering crashes anywhere
 * in its child component tree. Instead of showing a blank white screen when
 * something breaks, it shows a friendly error message to the user.
 *
 * Think of it like a circuit breaker: when one component fails, the rest of
 * the app can still work, and the user gets a helpful message instead of a crash.
 *
 * The full error details (stack trace, component stack) are logged to the
 * browser console for debugging — but only the error message is shown to
 * the user, to avoid confusion and prevent leaking internal file paths.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /** Called by React when a child component throws an error during rendering.
   *  Updates state so the next render shows the fallback UI. */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /** Called after an error is caught. Logs full diagnostic details to the
   *  developer console, but does NOT show them to the user. */
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            fontFamily: 'system-ui, sans-serif',
            color: '#dc2626',
            background: '#fff',
            minHeight: '100vh',
          }}
        >
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ fontSize: 16, color: '#4b5563', marginBottom: 24 }}>
            The app encountered an unexpected error. Try restarting the app. If the
            problem continues, please contact support.
          </p>
          {/* Show only the error message to the user — the full stack trace
              is logged to the console (see componentDidCatch above) for
              debugging, but kept hidden to avoid leaking internal file paths
              and confusing novice users with technical details. */}
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              background: '#fef2f2',
              padding: 16,
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
