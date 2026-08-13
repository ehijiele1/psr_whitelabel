# EstateManager — Property Management System

A production-grade, white-label, multi-role property management platform built with Next.js, Supabase, Tailwind CSS, and deployed on Vercel.

Every brand surface (name, colors, contacts, agreement placeholders, sender IDs) is driven by environment variables with neutral defaults, so each deployment can be rebranded without code changes.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 16 (App Router), React 19 |
| Styling    | Tailwind CSS 4                    |
| Backend    | Supabase (Auth + PostgreSQL + RLS)|
| Payments   | Paystack (PaystackPop + Webhooks) |
| Emails     | Resend                            |
| SMS        | eBulkSMS                          |
| Push       | Web Push (VAPID)                  |
| Rate limit | Upstash Redis (in-memory fallback)|
| Hosting    | Vercel                            |
| PWA        | Hand-written service worker + manifest route |

---

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Authenticated multi-role dashboards
│   │   │   ├── dashboard/
│   │   │   │   ├── applications/     # Tenant applications
│   │   │   │   ├── messages/         # In-app messaging (realtime)
│   │   │   │   ├── payments/         # Payment records & import
│   │   │   │   ├── properties/       # Properties + units management
│   │   │   │   ├── reports/          # Financial reports
│   │   │   │   ├── settings/         # Preferences + push notifications
│   │   │   │   ├── staff/            # Staff (caretaker) management
│   │   │   │   ├── tenants/          # Tenant management + migrate
│   │   │   │   └── tickets/          # Maintenance tickets
│   │   │   ├── login/                # Role-aware login + OTP verify
│   │   │   ├── register/             # Registration
│   │   │   ├── onboarding/           # Multi-step application wizard
│   │   │   ├── invite/               # Tenant invitation acceptance
│   │   │   ├── setup/                # Initial admin setup
│   │   │   ├── forgot-password/      # Password reset
│   │   │   └── reset-password/
│   │   ├── api/
│   │   │   ├── auth/                 # Forgot password, SMS webhook
│   │   │   ├── emails/send
│   │   │   ├── notify/sms
│   │   │   ├── payments/             # Import + approve
│   │   │   ├── push/                 # Web Push subscribe/send
│   │   │   ├── setup, staff/create
│   │   │   ├── subscriptions/        # Plans + manage
│   │   │   ├── tickets/[id]/update
│   │   │   ├── upload
│   │   │   └── webhooks/paystack     # HMAC-SHA512 verified webhook
│   │   ├── layout.tsx                # Root layout + PWA meta
│   │   ├── manifest.ts               # PWA manifest (/manifest.webmanifest)
│   │   └── page.tsx                  # Entry point
│   ├── components/                   # UI components (dashboard views, onboarding, settings)
│   ├── contexts/                     # Role, Property, Theme contexts
│   ├── lib/
│   │   ├── config.ts                 # White-label brand config (env-driven)
│   │   ├── csrf.ts / csrf-client.ts  # Double-submit cookie CSRF protection
│   │   ├── env.ts                    # Env access + validation
│   │   ├── paystack-client/server.ts # Paystack integration
│   │   ├── push.ts                   # VAPID Web Push helpers
│   │   ├── rateLimiter.ts            # Upstash / in-memory rate limiting
│   │   └── supabase/
│   │       ├── browser.ts            # Browser Supabase client
│   │       ├── clientFactory.ts      # Server client factory
│   │       └── invitations.ts        # Invitation helpers
│   └── types/index.ts                # TypeScript interfaces
├── supabase/
│   ├── migrations/                   # Ordered SQL migrations + RLS policies
│   └── apply-migrations.ps1
├── public/sw.js                      # Hand-written service worker
├── src/proxy.ts                      # Middleware: route guard + CSRF cookie
├── next.config.ts                    # CSP + PWA headers
└── vercel.json
```

---

## Setup Instructions

### 1. Clone and install

```bash
git clone YOUR_REPO_URL estate-manager
cd estate-manager
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **Anon key** from Settings → API
3. Copy your **Service Role key** (keep this secret — server only)
4. Run the migrations in `supabase/migrations/` in order (via the SQL Editor or the included `apply-migrations.ps1`). All tables ship with RLS policies.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see the example file for the complete list, including the white-label `NEXT_PUBLIC_BRAND_*` variables.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Complete the initial admin setup at `/setup`.

---

## Quality Gates

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run test        # vitest run
npm run build       # next build
```

All four gates must pass before release.

---

## Deploy to Vercel

1. Push the repository to GitHub and import into Vercel.
2. Add all variables from `.env.local.example` in Project → Settings → Environment Variables (mark server-only ones as private).
3. Configure the Paystack webhook to `https://YOUR_VERCEL_URL.vercel.app/api/webhooks/paystack`.
4. Deploy.

---

## Role Access Summary

| Feature              | Landlord | Caretaker | Tenant |
|---------------------|----------|-----------|--------|
| Full dashboard       | ✅       | ❌        | ❌     |
| Financial reports    | ✅       | ❌        | ❌     |
| View NIN / Guarantor | ✅       | ❌        | ❌     |
| Tenant management    | ✅       | Read only | Own    |
| Record payments      | ✅       | ❌        | ❌     |
| View own payments    | ✅       | ❌        | ✅     |
| Maintenance tickets  | ✅ All   | ✅ Update | ✅ Own |
| Inbox / Applications | ✅       | ❌        | ❌     |
| Settings             | ✅       | ❌        | ❌     |
| Apply for tenancy    | —        | —         | Public |

---

## Security (CIA Triad)

**Confidentiality**
- Supabase Row Level Security (RLS) on every table
- Caretakers cannot query financial tables — enforced at DB level
- NIN visible only to Landlord role
- Bank details never appear on receipts — shown only on payment screen

**Integrity**
- Paystack webhook signature verified with HMAC-SHA512
- Receipt numbers generated by PostgreSQL sequence — never on frontend
- CSRF double-submit cookie protection on all state-changing API routes
- Paystack secret key / Supabase service role key live only in server environment variables

**Availability**
- Vercel edge deployment (global CDN)
- PWA with service worker caching for offline resilience
- Optional distributed rate limiting via Upstash Redis

---

## Phase 2 Upgrades

- [x] Push notifications via Web Push API
- [ ] eBulkSMS real delivery for stage notifications
- [ ] Migrate base64 photo/document storage to Supabase Storage
- [ ] Support for multiple properties per landlord account
- [ ] Paystack subscription billing
