# PrinceSteve Residence — Architecture & User Flows

## User Roles & Access

| Role | Description | Dashboard Route |
|------|-------------|-----------------|
| **Landlord / Owner** | Full property, tenant, and financial control | `/dashboard/landlord` |
| **Caretaker** | Daily operations, maintenance, tenant roster (no financial data) | `/dashboard/caretaker` |
| **Tenant** | Rent payments, maintenance tickets, subscriptions | `/dashboard/tenant` |

## Login Flow

```
Visitor → /login (role selection page)
             │
             ├── Landlord/Owner → email + password → /dashboard/landlord
             ├── Caretaker      → email + password → /dashboard/caretaker
             └── Tenant         → email + password → /dashboard/tenant
```

- **Role selection** happens first on the login page via 3 card buttons
- The system verifies the user's role matches their selected portal
- Mismatched roles are rejected with a clear error message
- Demo credentials auto-fill via a "Fill demo" button per role

## Onboarding Flow (New Tenants)

```
Visitor → /apply (Application Wizard)
             │
             ├─ Stage 1: Personal info + passport photo (→ applicants table)
             ├─ Stage 2: Payment (Paystack or bank transfer + proof upload)
             ├─ Stage 3: Sign digital tenancy agreement
             ├─ Stage 4: Under review (landlord notified via inbox + SMS)
             │
             └── Landlord approves → tenant receives:
                    • SMS notification (eBulk SMS)
                    • Push notification (Web Push API)
                    • Email notification
                    • Account activated with /dashboard/tenant access
```

**Key details:**
- Applicants start at `form-submitted` stage
- Payments flow through Paystack webhook (`charge.success`) or manual proof upload
- Signed agreements store signature data as base64 embedded in the agreement
- On landlord approval, a profile with `role: 'tenant'` is created in Supabase Auth + profiles table
- The new tenant receives SMS + push notifications

## Existing Tenant Login

Existing tenants who already have accounts:
1. Visit `/login`
2. Select "Tenant" role card
3. Enter their registered email + password
4. Redirected to `/dashboard/tenant` showing their unit, payments, lease info

## Security

- **Supabase RLS** enforces role-based data isolation
- **Caretakers** are locked out of payments/financial tables
- **Tenants** only see their own data
- **Paystack webhooks** verified via HMAC-SHA512
- **Push subscriptions** stored per-user with RLS
- **SMS** is best-effort (never blocks the flow)
