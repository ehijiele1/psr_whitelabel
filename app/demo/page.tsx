'use client';

import { useState } from 'react';
import { GlassCard, Button, Card, Field, Grid2, InfoBox, ReceiptTemplate, LeaseAgreementTemplate } from '@/components/ui';
import { formatCurrency } from '@/utils';

const DEFAULT_SETTINGS = {
  property_name: 'PrinceSteve Residence',
  landlady_name: 'Mrs. Ibadin R.E',
  address: '35 Godilove Street, Akowonjo Egbeda, Lagos',
  phone: '+2348054164910',
  phone2: '+2348024427735',
  email: 'beckydin63@gmail.com',
  account_name: 'Prince Steve Residence',
};

export default function ComponentDemo() {
  const [view, setView] = useState<'glasscard' | 'receipt' | 'agreement' | 'forms'>('glasscard');
  const [receiptData, setReceiptData] = useState({
    id: 'PSR-2024-RENT-001234',
    tenant_name: 'Adebayo Okafor',
    amount: 500000,
    type: 'rent' as const,
    date: '2024-07-04',
    period: '2024-2025',
    unit: 'Apt 1'
  });

  const [agreementData, setAgreementData] = useState({
    firstName: 'Adebayo',
    lastName: 'Okafor',
    fullName: 'Adebayo Okafor',
    phone: '08031234567',
    address: '45 Avenue, Lagos, Nigeria'
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-[14px]">PrinceSteve Residence</div>
          <div className="text-slate-400 text-[11px]">Component Demo</div>
        </div>
        <div className="flex gap-2">
          {['glasscard', 'receipt', 'agreement', 'forms'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* View Container */}
        <div className="space-y-6">
          {view === 'glasscard' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">GlassCard Component</h2>

              <GlassCard hoverEffect>
                <h3 className="font-semibold mb-2">Default Card</h3>
                <p className="text-sm text-slate-300">
                  This is a premium glassmorphism card with blur effects, transparency, and subtle shadows.
                </p>
              </GlassCard>

              <GlassCard hoverEffect className="bg-blue-500/10 border-blue-500/20">
                <h3 className="font-semibold mb-2">Color Customized</h3>
                <p className="text-sm text-slate-300">
                  Glass cards can be customized with different background colors and border styles.
                </p>
              </GlassCard>

              <GlassCard hoverEffect className="bg-green-500/10 border-green-500/20">
                <h3 className="font-semibold mb-2">Success State</h3>
                <p className="text-sm text-slate-300">
                  Glass cards work well for success messages, status indicators, and positive information.
                </p>
              </GlassCard>

              <GlassCard hoverEffect className="bg-amber-500/10 border-amber-500/20">
                <h3 className="font-semibold mb-2">Warning State</h3>
                <p className="text-sm text-slate-300">
                  Glass cards can also be used for warning states and important notifications.
                </p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-bold">JS</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">John Smith</h3>
                    <p className="text-sm text-slate-400">Software Developer</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">
                  Professional card layout with avatar, name, and role information.
                </p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <i className="ti ti-check text-green-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Task Completed</h3>
                    <p className="text-sm text-slate-400 mb-2">Completed 5 tasks today</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                      <span className="text-xs text-slate-400">75%</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {view === 'receipt' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">ReceiptTemplate Component</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="font-semibold mb-4">Default Receipt</h3>
                  <ReceiptTemplate
                    payment={receiptData}
                    settings={DEFAULT_SETTINGS}
                  />
                </GlassCard>

                <div className="space-y-4">
                  <GlassCard>
                    <h3 className="font-semibold mb-4">Print-Optimized Receipt</h3>
                    <ReceiptTemplate
                      payment={{
                        ...receiptData,
                        id: 'PSR-2024-RENT-001234'
                      }}
                      settings={DEFAULT_SETTINGS}
                      mode="print"
                    />
                  </GlassCard>

                  <GlassCard>
                    <h3 className="font-semibold mb-4">Levy Payment</h3>
                    <ReceiptTemplate
                      payment={{
                        ...receiptData,
                        id: 'PSR-2024-LEVY-000987',
                        amount: 25000,
                        type: 'levy' as const,
                        period: 'July 2024',
                        unit: 'Apt 1'
                      }}
                      settings={DEFAULT_SETTINGS}
                    />
                  </GlassCard>

                  <GlassCard>
                    <h3 className="font-semibold mb-4">Large Amount</h3>
                    <ReceiptTemplate
                      payment={{
                        ...receiptData,
                        id: 'PSR-2024-RENT-002345',
                        amount: 5000000,
                        period: '2024-2025',
                        unit: 'Apt 1'
                      }}
                      settings={DEFAULT_SETTINGS}
                    />
                  </GlassCard>
                </div>
              </div>
            </div>
          )}

          {view === 'agreement' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">LeaseAgreementTemplate Component</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="font-semibold mb-4">Default View Mode</h3>
                  <div className="max-h-[600px] overflow-y-auto">
                    <LeaseAgreementTemplate
                      tenant={agreementData}
                      settings={{
                        ...DEFAULT_SETTINGS,
                        landladyName: 'Mrs. Ibadin R.E',
                        propertyAddress: '35 Godilove Street, Akowonjo Egbeda, Lagos',
                        propertyPhone: '+2348054164910',
                        propertyEmail: 'beckydin63@gmail.com',
                      }}
                      mode="view"
                    />
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-semibold mb-4">Print-Optimized Mode</h3>
                  <div className="max-h-[600px] overflow-y-auto">
                    <LeaseAgreementTemplate
                      tenant={agreementData}
                      settings={{
                        ...DEFAULT_SETTINGS,
                        landladyName: 'Mrs. Ibadin R.E',
                        propertyAddress: '35 Godilove Street, Akowonjo Egbeda, Lagos',
                        propertyPhone: '+2348054164910',
                        propertyEmail: 'beckydin63@gmail.com',
                      }}
                      mode="print"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <i className="ti ti-printer mr-2" /> Print Agreement
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {view === 'forms' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Form Components</h2>

              <GlassCard>
                <h3 className="font-semibold mb-4">Card Component</h3>
                <Card title="Application Information" icon="ti-user">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      The Card component wraps content with a glassmorphism background and optional header with icon.
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Icon: ti-user</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Title: Application Information</span>
                    </div>
                  </div>
                </Card>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Field Component</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    value="John Doe"
                    onChange={() => {}}
                    placeholder="Enter full name"
                  />
                  <Field
                    label="Email"
                    value="john@example.com"
                    onChange={() => {}}
                    type="email"
                    placeholder="Enter email"
                  />
                  <Field
                    label="Phone Number"
                    value="08012345678"
                    onChange={() => {}}
                    placeholder="080xxxxxxxx"
                  />
                  <Field
                    label="Date of Birth"
                    value="1990-01-15"
                    onChange={() => {}}
                    type="date"
                  />
                  <Field
                    label="Gender"
                    value="Male"
                    onChange={() => {}}
                    type="select"
                    options={['Male', 'Female', 'Other']}
                  />
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Grid2 Component</h3>
                <Grid2>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">12</div>
                    <div className="text-xs text-slate-400">Total Items</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">5</div>
                    <div className="text-xs text-slate-400">Completed</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-amber-400">7</div>
                    <div className="text-xs text-slate-400">Pending</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-400">0</div>
                    <div className="text-xs text-slate-400">Overdue</div>
                  </div>
                </Grid2>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">InfoBox Component</h3>
                <div className="space-y-3">
                  <InfoBox type="blue">
                    <strong>Information:</strong> This is an informational box with a blue theme.
                  </InfoBox>
                  <InfoBox type="green">
                    <strong>Success:</strong> Your changes have been saved successfully!
                  </InfoBox>
                  <InfoBox type="amber">
                    <strong>Warning:</strong> Please review your changes before submitting.
                  </InfoBox>
                  <InfoBox type="red">
                    <strong>Error:</strong> Something went wrong. Please try again.
                  </InfoBox>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Button Component</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    label="Primary Button"
                    onClick={() => {}}
                    icon="ti-check"
                    color="blue"
                  />
                  <Button
                    label="Pay with Paystack"
                    onClick={() => {}}
                    icon="ti-credit-card"
                    color="paystack"
                  />
                  <Button
                    label="Download Receipt"
                    onClick={() => {}}
                    icon="ti-download"
                    color="green"
                  />
                  <Button
                    label="Print Document"
                    onClick={() => {}}
                    icon="ti-printer"
                    color="amber"
                  />
                  <Button
                    label="Delete"
                    onClick={() => {}}
                    icon="ti-trash"
                    color="red"
                  />
                  <Button
                    label="Loading State"
                    onClick={() => {}}
                    icon="ti-loader-2"
                    loading
                  />
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="font-semibold mb-4">Complete Form Example</h3>
                <Card title="Application Details" icon="ti-user">
                  <div className="space-y-4">
                    <Grid2>
                      <Field
                        label="First Name"
                        value="Adebayo"
                        onChange={() => {}}
                        placeholder="Enter first name"
                      />
                      <Field
                        label="Last Name"
                        value="Okafor"
                        onChange={() => {}}
                        placeholder="Enter last name"
                      />
                    </Grid2>
                    <Field
                      label="Email Address"
                      value="adebayo@example.com"
                      onChange={() => {}}
                      type="email"
                      placeholder="Enter email"
                    />
                    <Field
                      label="Phone Number"
                      value="08031234567"
                      onChange={() => {}}
                      placeholder="080xxxxxxxx"
                    />
                    <Grid2>
                      <Field
                        label="Unit Type"
                        value="apartment"
                        onChange={() => {}}
                        type="select"
                        options={['apartment', 'shop', 'stall']}
                      />
                      <Field
                        label="Move-in Date"
                        value="2024-08-01"
                        onChange={() => {}}
                        type="date"
                      />
                    </Grid2>
                    <Field
                      label="Reason for Moving"
                      value="Looking for a more spacious apartment"
                      onChange={() => {}}
                      placeholder="Enter reason"
                      className="col-span-2"
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <InfoBox type="blue">
                      <strong>Note:</strong> All fields marked with * are required for processing your application.
                    </InfoBox>
                  </div>
                  <div className="mt-4">
                    <Button
                      label="Submit Application"
                      onClick={() => {}}
                      icon="ti-arrow-right"
                      color="blue"
                    />
                  </div>
                </Card>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}