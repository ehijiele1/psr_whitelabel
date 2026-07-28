import "@testing-library/jest-dom/vitest"

// Ensure required env vars are set so that env.ts doesn't throw at module load
// when modules import `env` at top level.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key"
process.env.NEXT_PUBLIC_APP_URL ||= "http://localhost:3000"
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key"
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||= "pk_test_placeholder"
process.env.PAYSTACK_SECRET_KEY ||= "sk_test_placeholder"
process.env.CSRF_SECRET ||= "test-csrf-secret-for-vitest"
