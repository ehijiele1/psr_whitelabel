'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Optional label shown in the fallback UI for diagnostics */
  label?: string
  /** Show the error message (only useful in development) */
  showError?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Client-side Error Boundary for dashboard sections.
 * Catches render errors and displays a friendly fallback instead of
 * breaking the entire page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, errorInfo)
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-900">
              {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
            </h3>
            {this.props.showError && this.state.error && (
              <p className="text-xs text-red-700">{this.state.error.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
