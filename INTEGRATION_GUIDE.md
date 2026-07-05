# Quick Integration Guide for Apply Page

This guide shows how to integrate the new UI components into your existing application pages.

## Step 1: Update the Apply Page

Open `app/apply/page.tsx` and add these imports:

```typescript
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Field, Grid2, Button, InfoBox, ReceiptTemplate, LeaseAgreementTemplate } from '@/components/ui';
import { DigitalSignatureCanvas, TenancyAgreement } from '@/components/ui';
import { formatCurrency, formatDate, numberToWords } from '@/utils';
import type { Applicant, PropertySettings } from '@/types';
```

## Step 2: Replace Form Elements

Replace your current form elements with the new UI components:

```typescript
// Before
<div className="space-y-5">
  <div className="bg-white border border-slate-200 rounded-xl p-6">
    <h2 className="text-[13px] font-semibold mb-4">Personal information</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[12px] font-medium mb-1.5">Full name *</label>
        <input type="text" value={form.name} onChange={...} />
      </div>
    </div>
  </div>
</div>

// After
<Card title="Personal information" icon="ti-user">
  <Grid2>
    <Field
      label="Full name *"
      value={form.name}
      onChange={(v) => save({ name: v })}
      placeholder="Your full legal name"
    />
    <Field
      label="Sex"
      type="select"
      value={form.sex}
      onChange={(v) => save({ sex: v })}
      options={['Male', 'Female']}
    />
  </Grid2>
</Card>
```

## Step 3: Add Info Boxes

Replace standard alert boxes with InfoBox:

```typescript
// Before
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[12px] text-blue-800">
  Please make the initial payment to proceed
</div>

// After
<InfoBox type="blue">
  Please make the initial payment to proceed
</InfoBox>
```

## Step 4: Update Buttons

Replace standard buttons with the new Button component:

```typescript
// Before
<button className="w-full bg-blue-600 text-white rounded-xl py-3.5 text-[14px] font-semibold">
  Submit Application
</button>

// After
<Button
  onClick={submitStage1}
  loading={loading}
  label="Submit application"
  icon="ti-arrow-right"
/>
```

## Step 5: Use GlassCard for Layout

Wrap your sections with GlassCard:

```typescript
<GlassCard hoverEffect>
  <h3 className="font-semibold mb-2">Section Title</h3>
  {children}
</GlassCard>
```

## Step 6: Add Print Functionality

Add a print button for the lease agreement:

```typescript
<button
  onClick={() => window.print()}
  className="text-[12px] text-blue-600 hover:underline flex items-center gap-1"
>
  <i className="ti ti-download" /> Download / print agreement
</button>
```

## Complete Example

Here's how your updated form section would look:

```typescript
<Card title="Personal information" icon="ti-user">
  <Grid2>
    <Field
      label="Full name *"
      value={form.name}
      onChange={(v) => save({ name: v })}
      placeholder="Your full legal name"
    />
    <Field
      label="Phone 1 *"
      value={form.phone}
      onChange={(v) => save({ phone: v })}
      placeholder="080xxxxxxxx"
    />
    <Field
      label="Email"
      value={form.email}
      onChange={(v) => save({ email: v })}
      type="email"
      placeholder="your@email.com"
    />
    <Field
      label="Sex"
      type="select"
      value={form.sex}
      onChange={(v) => save({ sex: v })}
      options={['Male', 'Female']}
    />
    <Field
      label="NIN (11 digits)"
      value={form.nin}
      onChange={(v) => save({ nin: v })}
      placeholder="12345678901"
      maxLength={11}
    />
    <Field
      label="State of origin"
      value={form.state_of_origin}
      onChange={(v) => save({ state_of_origin: v })}
    />
    <Field
      label="LGA"
      value={form.lga}
      onChange={(v) => save({ lga: v })}
    />
    <Field
      label="Home address"
      value={form.home_address}
      onChange={(v) => save({ home_address: v })}
      className="col-span-2"
    />
    <Field
      label="Reason for moving"
      value={form.reason_moving}
      onChange={(v) => save({ reason_moving: v })}
      className="col-span-2"
    />
  </Grid2>
</Card>

<Card title="Unit preference" icon="ti-building">
  <Grid2>
    <Field
      label="Preferred unit type"
      type="select"
      value={form.unit_type}
      onChange={(v) => save({ unit_type: v as 'apartment' | 'shop' | 'stall' })}
      options={['apartment', 'shop', 'stall']}
    />
    <Field
      label="Preferred move-in date"
      type="date"
      value={form.move_in}
      onChange={(v) => save({ move_in: v })}
    />
  </Grid2>
</Card>
```

## Displaying Receipts

When displaying a payment receipt, use:

```typescript
import { ReceiptTemplate } from '@/components/ui';

<GlassCard>
  <h3 className="font-semibold mb-4">Payment Receipt</h3>
  <ReceiptTemplate
    payment={{
      id: payment.id,
      tenant_name: payment.tenant_name,
      amount: payment.amount,
      type: payment.type,
      date: payment.date,
      period: payment.period,
      unit: payment.unit
    }}
    settings={{
      property_name: 'PrinceSteve Residence',
      landlady_name: 'Mrs. Ibadin R.E',
      address: '35 Godilove Street, Akowonjo Egbeda, Lagos',
      phone: '+2348054164910',
      email: 'beckydin63@gmail.com',
      account_name: 'Prince Steve Residence',
    }}
  />
</GlassCard>
```

## Printing Documents

For lease agreements, use:

```typescript
<LeaseAgreementTemplate
  tenant={{
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    fullName: tenant.fullName,
    phone: tenant.phone,
    address: tenant.address
  }}
  settings={{
    landladyName: settings.landlady_name,
    propertyAddress: settings.address,
    propertyPhone: settings.emergency_phone,
    propertyEmail: settings.email,
  }}
  mode="print"
/>
```

Then add a print button:
```typescript
<button
  onClick={() => window.print()}
  className="text-[12px] text-blue-600 hover:underline flex items-center gap-1"
>
  <i className="ti ti-download" /> Download / print agreement
</button>
```

## Benefits

1. **Consistency**: All forms now look and feel consistent
2. **Professional**: Glassmorphism design feels premium
3. **Maintainable**: Single source of truth for UI components
4. **Accessible**: Built-in accessibility features
5. **Responsive**: Mobile-friendly by default

## Testing

After updating, test your forms by:
1. Running `npm run dev`
2. Visiting `/apply` route
3. Testing all form fields
4. Checking print functionality
5. Verifying mobile responsiveness

## Need Help?

If you encounter issues:
1. Check the demo page at `/demo`
2. Review component documentation
3. Examine the component source code
4. Test with a fresh browser session