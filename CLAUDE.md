# EstateManager — Production Management System

A high-security, multi-role property management SaaS. White-label: all branding is configurable per deployment via environment variables (defaults in `src/lib/config.ts`).

## Project Status
- **Current State**: Production-Ready / Version 1.0.
- **Core Features**:
  - Role-Based Access Control (RBAC) enforced via Supabase Row Level Security (RLS).
  - Landlord, Caretaker, and Tenant specialized dashboards.
  - Secure Paystack payment integration with HMAC-SHA512 webhook verification.
  - Digital Signature Canvas and automated Tenancy Agreement generation.
  - Public-facing application/onboarding wizard.
  - PWA (Progressive Web App) with offline resilience.
  - Atomic, server-side receipt numbering via PostgreSQL sequences.
  - Web Push notifications (VAPID) with per-user opt-in.
  - CSRF double-submit cookie protection on all state-changing routes.

## Architecture
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Backend**: Supabase (PostgreSQL + Auth + RLS).
- **Payments**: Paystack.
- **Email**: Resend. **SMS**: eBulkSMS. **Rate limiting**: Upstash Redis (in-memory fallback).
- **Deployment**: Vercel.

## Security Audit Verdict: ✅ SECURE
- **Confidentiality**: RLS ensures tenants only see their own data; Caretakers are locked out of financial tables.
- **Integrity**: Critical data (Receipts, Payments) is managed via server-side triggers and webhooks.
- **CSRF**: State-changing API routes reject requests whose `X-CSRF-Token` header does not match the `csrf-token` cookie set by the proxy middleware.
- **Secrets**: Configuration is handled exclusively via environment variables (`.env.local`). Never commit `.env*` files or real credentials.

## Development Guidelines
- **Backend**: All new tables MUST have RLS enabled and specific policies defined in `supabase/migrations/` (add a new timestamped migration file — do not edit applied migrations).
- **Frontend**: Use Next.js Server Components where possible for data fetching.
- **Styling**: Strictly use Tailwind CSS.
- **Types**: All interfaces must be defined in `src/types/index.ts`.
- **White-labeling**: Never hardcode brand names, contacts, addresses, currency, or landlord/tenant details in components — use the `brand` / `brandServer` exports from `src/lib/config.ts` (which read `NEXT_PUBLIC_BRAND_*` / `BRAND_*` env vars).

## Quality Gates
Run all four before releasing:
- `npm run typecheck` (tsc --noEmit)
- `npm run lint` (eslint .)
- `npm run test` (vitest run)
- `npm run build` (next build)

## Pending Tasks (Phase 2)
- [ ] Implement eBulkSMS for stage notifications.
- [ ] Migrate base64 photo/document storage to Supabase Storage.
- [ ] Add support for multiple properties per landlord account.
- [ ] Implement Paystack subscription billing.
