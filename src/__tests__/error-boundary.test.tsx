import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "@/components/error-boundary"

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test explosion")
  }
  return <div>Safe content</div>
}

describe("ErrorBoundary", () => {
  // Suppress React's noisy error logging for the throw case.
  const originalError = console.error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalNodeEnv = (import.meta as any).env?.NODE_ENV
  beforeAll(() => {
    console.error = () => {}
  })
  afterAll(() => {
    console.error = originalError
    if (originalNodeEnv !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(import.meta as any).env.NODE_ENV = originalNodeEnv
    }
  })

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Safe content")).toBeInTheDocument()
  })

  it("renders fallback when child throws", () => {
    render(
      <ErrorBoundary label="Test section">
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText(/Test section failed to load/i)).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom fallback")).toBeInTheDocument()
  })
})
