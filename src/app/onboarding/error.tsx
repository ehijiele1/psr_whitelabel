"use client"

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="text-sm text-muted-foreground font-mono bg-muted p-4 rounded-lg text-left whitespace-pre-wrap break-all">
          {error.message}
          {error.digest && (
            <span className="block mt-2 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
