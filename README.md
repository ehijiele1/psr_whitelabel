# PrinceSteve Residence — Property Management System

A production-grade, secure, multi-role property management SaaS built with Next.js 15, Supabase, Tailwind CSS, and deployed on Vercel.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 15 (App Router), React 18 |
| Styling    | Tailwind CSS, Tabler Icons        |
| Backend    | Supabase (Auth + PostgreSQL)      |
| Payments   | Paystack (PaystackPop + Webhooks) |
| Hosting    | Vercel                            |
| Version    | GitHub                            |
| PWA        | next-pwa                          |

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx                    # Root layout with PWA meta
│   ├── page.tsx                      # Auth redirect entry point
│   ├── login/page.tsx                # Role-based login
│   ├── apply/page.tsx                # 4-stage public applicant wizard
│   ├── dashboard/
│   │   ├── layout.tsx                # Shared sidebar layout
│   │   ├── landlord/page.tsx         # Landlord dashboard
│   │   ├── caretaker/page.tsx        # Caretaker dashboard (no financials)
│   │   └── tenant/page.tsx           # Tenant dashboard
│   └── api/
│       └── webhooks/paystack/route.ts # Secure Paystack webhook
├── components/ui/
│   ├── Sidebar.tsx                   # Navigation with badge counters
│   ├── Receipt.tsx                   # Print-clean receipt component
│   ├── TenancyAgreement.tsx          # 45-clause auto-populated agreement
│   └── DigitalSignatureCanvas.tsx    # Draw / type / upload signature
├── lib/supabase/
│   ├── client.ts                     # Browser Supabase client
│   ├── server.ts                     # Server + Admin Supabase clients
│   └── schema.sql                    # Full PostgreSQL schema + RLS
├── types/index.ts                    # TypeScript interfaces
├── utils/index.ts                    # Formatting, helpers, CSV export
├── styles/globals.css                # Tailwind + global styles
└── public/
    ├── manifest.json                 # PWA manifest
    └── icons/                        # App icons (add your own)
```

---

## Setup Instructions

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/princesteve-residence.git
cd princesteve-residence
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **Anon key** from Settings → API
3. Copy your **Service Role key** (keep this secret — server only)
4. Go to **SQL Editor** → paste the contents of `lib/supabase/schema.sql` → Run

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_46d83d4877d760e148a943152cdbdaf04154d4e3
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create user accounts in Supabase

Go to Supabase → Authentication → Users → Add user

Create three users:
- **Landlord**: `landlord@princesteve.ng` + password
- **Caretaker**: `steve@princesteve.ng` + password
- **Tenant**: `tenant@princesteve.ng` + password

Then go to SQL Editor and run:
```sql
-- After creating users, assign roles (replace UUIDs with real user IDs)
INSERT INTO profiles (user_id, role, full_name, phone) VALUES
  ('UUID_OF_LANDLORD',  'landlord',  'Mrs. Ibadin R.E', '+2348054164910'),
  ('UUID_OF_CARETAKER', 'caretaker', 'Steve',           '+2348024427735'),
  ('UUID_OF_TENANT',    'tenant',    'Adebayo Okafor',  '08031234567');
```

### 5. Configure Paystack webhook

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys & Webhooks
2. Set webhook URL to: `https://YOUR_VERCEL_URL.vercel.app/api/webhooks/paystack`
3. Copy your secret key into `PAYSTACK_SECRET_KEY`

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

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
- Receipt numbers generated by PostgreSQL trigger — never on frontend
- Paystack secret key lives only in server environment variables
- Supabase Service Role key never exposed to browser

**Availability**
- Vercel edge deployment (global CDN)
- PWA with service worker caching for offline resilience
- Supabase free tier: 500MB DB, 1GB bandwidth, 50,000 MAU

---

## Phase 2 Upgrades (When Ready)

- [ ] Add eBulk SMS real delivery for stage notifications
- [ ] Supabase Storage for photo/document uploads (replace base64)
- [ ] Push notifications via Web Push API
- [ ] Multi-property support per landlord account
- [ ] Paystack subscription billing for SaaS model

---

## Support

Property: 35 Godilove Street, Akowonjo Egbeda, Lagos  
Emergency: +2348054164910  
Caretaker (Steve): +2348024427735
