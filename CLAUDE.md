# PrinceSteve Residence — Production Management System

A high-security, multi-role property management SaaS.

## Project Status
- **Current State**: Production-Ready / Version 1.0.
- **Core Features**:
  - Role-Based Access Control (RBAC) enforced via Supabase Row Level Security (RLS).
  - Landlord, Caretaker, and Tenant specialized dashboards.
  - Secure Paystack payment integration with HMAC-SHA512 webhook verification.
  - Digital Signature Canvas and automated Tenancy Agreement generation.
  - Public-facing 4-stage Application Wizard.
  - PWA (Progressive Web App) with offline resilience.
  - Atomic, server-side receipt numbering via PostgreSQL sequences.

## Architecture
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL + Auth + RLS).
- **Payments**: Paystack.
- **Deployment**: Vercel.

## Security Audit Verdict: ✅ SECURE
- **Confidentiality**: RLS ensures tenants only see their own data; Caretakers are locked out of financial tables.
- **Integrity**: Critical data (Receipts, Payments) is managed via server-side triggers and webhooks.
- **Secrets**: Configuration is handled exclusively via environment variables (`.env.local`).

## Pending Tasks (Phase 2)
- [ ] Implement eBulk SMS for stage notifications.
- [ ] Migrate base64 photo/document storage to Supabase Storage.
- [ ] Integrate Web Push API for notifications.
- [ la ] Add support for multiple properties per landlord account.
- [ ] Implement Paystack subscription billing.

## Development Guidelines
- **Backend**: All new tables MUST have RLS enabled and specific policies defined in `lib/supabase/schema.sql`.
- **Frontend**: Use Next.js Server Components where possible for data fetching.
- **Styling**: Strictly use Tailwind CSS.
- **Types**: All interfaces must be defined in `types/index.ts`.
