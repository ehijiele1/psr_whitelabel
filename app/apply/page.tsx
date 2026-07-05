'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import DigitalSignatureCanvas from '@/components/ui/DigitalSignatureCanvas';
import FileUpload from '@/components/ui/FileUpload';
import TenancyAgreement from '@/components/ui/TenancyAgreement';
import type { Applicant, PropertySettings } from '@/types';

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

type Stage = 1 | 2 | 3 | 4 | 5;

const DEFAULT_SETTINGS: PropertySettings = {
  property_name:    'PrinceSteve Residence',
  landlord_name:    'Mrs. Ibadin R.E',
  address:          '35 Godilove Street, Akowonjo Egbeda, Lagos',
  emergency_phone:  '+2348054164910',
  caretaker_name:   'Steve',
  caretaker_phone:  '+2348024427735',
  bank_name:        'First Bank Nigeria',
  account_number:   '3012345678',
  account_name:     'Prince Steve Residence',
  email:            'beckydin63@gmail.com',
  landlord_pin:     '1234',
  caretaker_pin:    '5678',
  tenant_pin:       '0000',
};

export default function ApplyPage() {
  const supabase = createClient();
  const [stage, setStage]   = useState<Stage>(1);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');
  const [appId, setAppId]   = useState<string>('');

  const [form, setForm] = useState<Partial<Applicant>>(() => {
    try {
      const saved = localStorage.getItem('psr_draft');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [sigData, setSigData]   = useState('');
  const [sigType, setSigType]   = useState('');
  const [payMethod, setPayMeth] = useState<'paystack' | 'manual'>('paystack');

  const save = useCallback((updates: Partial<Applicant>) => {
    const merged = { ...form, ...updates };
    setForm(merged);
    localStorage.setItem('psr_draft', JSON.stringify(merged));
  }, [form]);

  // ── SMS notification helper ──────────────────────────────────
  const notifySms = useCallback(async (action: string, overrides?: Record<string, unknown>) => {
    try {
      await fetch('/api/notify/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, phone: form.phone, name: form.name, ...overrides }),
      });
    } catch {
      // SMS is best-effort — never block the flow
    }
  }, [form.phone, form.name]);

  // ── Stage 1: Personal info form ────────────────────────────────
  const submitStage1 = async () => {
    if (!form.name || !form.phone) { setError('Full name and phone are required.'); return; }
    setLoad(true); setError('');

    const { data, error: err } = await supabase.from('applicants').insert({
      name: form.name, phone: form.phone, phone2: form.phone2, email: form.email,
      sex: form.sex, state_of_origin: form.state_of_origin, tribe: form.tribe,
      lga: form.lga, home_address: form.home_address, nationality: form.nationality || 'Nigerian',
      religion: form.religion, reason_moving: form.reason_moving,
      occupation: form.occupation, employer: form.employer,
      employer_address: form.employer_address, employer_duration: form.employer_duration,
      job_title: form.job_title, office_phone: form.office_phone,
      guarantor: form.guarantor, guarantor_address: form.guarantor_address,
      guarantor_phone: form.guarantor_phone, guarantor_occupation: form.guarantor_occupation,
      nin: form.nin, photo: form.photo,
      unit_type: form.unit_type || 'apartment', move_in: form.move_in,
      stage: 'form-submitted', payment_status: 'unpaid',
    }).select().single();

    if (err || !data) { setError(err?.message || 'Submission failed. Try again.'); setLoad(false); return; }

    setAppId(data.id);

    // Notify landlord inbox
    await supabase.from('inbox').insert({
      type: 'application', from_name: form.name,
      subject: `New tenancy application — ${form.name}`,
      preview: `${form.name} submitted a tenancy application for a ${form.unit_type || 'apartment'}. Review in your inbox.`,
      applicant_id: data.id,
    });

    localStorage.removeItem('psr_draft');
    notifySms('application-received');
    setLoad(false); setStage(2);
  };

  // ── Stage 2: Payment ──────────────────────────────────────────
  const launchPaystack = () => {
    const amount = Number(form.payment_amount);
    if (!amount || amount < 1000) { setError('Enter a valid payment amount.'); return; }
    setError('');

    // @ts-ignore — PaystackPop loaded via CDN script
    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_KEY,
      email: form.email || `${form.phone}@princesteve.ng`,
      amount: amount * 100,
      currency: 'NGN',
      ref: `PSR-APP-${Date.now()}`,
      metadata: {
        applicant_id: appId,
        applicant_name: form.name,
        type: 'application_fee',
        is_application: true,
      },
      callback: async (response: { reference: string }) => {
        save({ payment_status: 'paid', payment_ref: response.reference,
               payment_method: 'paystack', payment_date: new Date().toISOString().split('T')[0] });

        await supabase.from('applicants').update({
          payment_status: 'paid', payment_ref: response.reference,
          payment_method: 'paystack',
          payment_date: new Date().toISOString().split('T')[0],
          stage: 'payment-confirmed',
        }).eq('id', appId);

        notifySms('payment-confirmed', { amount: form.payment_amount, reference: response.reference });
        setStage(3);
      },
      onClose: () => setError('Payment cancelled. Try again when ready.'),
    });
    handler?.openIframe();
  };

  const submitManualPayment = async () => {
    if (!form.payment_date || !form.depositor_name || !form.payment_amount) {
      setError('Fill all manual payment fields.'); return;
    }
    if (!form.proof_image) { setError('Upload proof of payment.'); return; }
    setLoad(true); setError('');

    await supabase.from('applicants').update({
      payment_status: 'proof-submitted',
      payment_amount: form.payment_amount,
      payment_date: form.payment_date,
      depositor_name: form.depositor_name,
      payment_method: 'bank transfer',
      proof_image: form.proof_image,
      stage: 'payment-proof-submitted',
    }).eq('id', appId);

    await supabase.from('inbox').insert({
      type: 'proof', from_name: form.name || '',
      subject: `Manual payment proof — ${form.name}`,
      preview: `Depositor: ${form.depositor_name} · Amount: ₦${Number(form.payment_amount).toLocaleString('en-NG')} · Date: ${form.payment_date}. Please verify.`,
      applicant_id: appId,
    });

    notifySms('payment-confirmed', { amount: form.payment_amount, reference: '' });
    setLoad(false); setStage(3);
  };

  // ── Stage 3: Agreement signing ─────────────────────────────────
  const submitAgreement = async () => {
    if (!sigData) { setError('Please sign the agreement.'); return; }
    setLoad(true); setError('');

    const agreedOn = new Date().toISOString().split('T')[0];
    await supabase.from('applicants').update({
      signature_data: sigData,
      signature_type: sigType,
      agreed_on: agreedOn,
      stage: 'agreement-signed',
    }).eq('id', appId);

    await supabase.from('inbox').insert({
      type: 'agreement', from_name: form.name || '',
      subject: `Signed agreement submitted — ${form.name}`,
      preview: `${form.name} has signed the tenancy agreement. Please review and grant dashboard access.`,
      applicant_id: appId,
    });

    notifySms('agreement-signed');
    setLoad(false); setStage(4);
  };

  // ── Stage 4: Landlord review (waiting) ─────────────────────────
  // ── Stage 5: Done ──────────────────────────────────────────────

  const STAGES = ['Personal info', 'Payment', 'Agreement', 'Under review', 'Complete'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Script for Paystack */}
      <script src="https://js.paystack.co/v1/inline.js" async />

      {/* Header */}
      <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-[14px]">PrinceSteve Residence</div>
          <div className="text-slate-400 text-[11px]">Tenancy Application</div>
        </div>
        <a href="/login" className="text-slate-400 text-[12px] hover:text-white">
          Back to login →
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all
                  ${i + 1 < stage ? 'bg-green-500 text-white' : i + 1 === stage ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i + 1 < stage ? <i className="ti ti-check text-[14px]" /> : i + 1}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 hidden sm:block text-center whitespace-nowrap">{s}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i + 1 < stage ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-center gap-2">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        {/* ── STAGE 1: Form ── */}
        {stage === 1 && (
          <div className="space-y-5">
            <Card title="Personal information" icon="ti-user">
              <Grid2>
                <Field label="Full name *" value={form.name} onChange={v => save({ name: v })} placeholder="Your full legal name" />
                <Field label="Sex" type="select" value={form.sex} onChange={v => save({ sex: v })} options={['Male','Female']} />
                <Field label="Phone 1 *" value={form.phone} onChange={v => save({ phone: v })} placeholder="080xxxxxxxx" />
                <Field label="Phone 2" value={form.phone2} onChange={v => save({ phone2: v })} placeholder="Optional" />
                <Field label="Email" value={form.email} onChange={v => save({ email: v })} placeholder="your@email.com" />
                <Field label="NIN (11 digits)" value={form.nin} onChange={v => save({ nin: v })} placeholder="12345678901" maxLength={11} />
                <Field label="State of origin" value={form.state_of_origin} onChange={v => save({ state_of_origin: v })} />
                <Field label="LGA" value={form.lga} onChange={v => save({ lga: v })} />
                <Field label="Tribe / Ethnicity" value={form.tribe} onChange={v => save({ tribe: v })} />
                <Field label="Religion" value={form.religion} onChange={v => save({ religion: v })} />
                <Field label="Home address" value={form.home_address} onChange={v => save({ home_address: v })} className="col-span-2" />
                <Field label="Reason for moving" value={form.reason_moving} onChange={v => save({ reason_moving: v })} className="col-span-2" />
              </Grid2>
            </Card>

            <Card title="Employment" icon="ti-briefcase">
              <Grid2>
                <Field label="Occupation" value={form.occupation} onChange={v => save({ occupation: v })} />
                <Field label="Employer / Business" value={form.employer} onChange={v => save({ employer: v })} />
                <Field label="Employer address" value={form.employer_address} onChange={v => save({ employer_address: v })} className="col-span-2" />
                <Field label="Duration employed" value={form.employer_duration} onChange={v => save({ employer_duration: v })} placeholder="e.g. 3 years" />
                <Field label="Job title" value={form.job_title} onChange={v => save({ job_title: v })} />
                <Field label="Office phone" value={form.office_phone} onChange={v => save({ office_phone: v })} />
              </Grid2>
            </Card>

            <Card title="Guarantor" icon="ti-shield-check">
              <Grid2>
                <Field label="Guarantor full name *" value={form.guarantor} onChange={v => save({ guarantor: v })} />
                <Field label="Guarantor phone *" value={form.guarantor_phone} onChange={v => save({ guarantor_phone: v })} />
                <Field label="Guarantor address *" value={form.guarantor_address} onChange={v => save({ guarantor_address: v })} className="col-span-2" />
                <Field label="Guarantor occupation" value={form.guarantor_occupation} onChange={v => save({ guarantor_occupation: v })} />
              </Grid2>
            </Card>

            <Card title="Passport photograph" icon="ti-camera">
              <FileUpload
                onUpload={url => save({ photo: url })}
                bucket="avatars"
                folder="applicants"
                accept="image/*"
                maxSizeMB={5}
                currentUrl={form.photo}
                label="Upload or take passport photo"
              />
            </Card>

            <Card title="Unit preference" icon="ti-building">
              <Grid2>
                <Field label="Preferred unit type" type="select" value={form.unit_type} onChange={v => save({ unit_type: v as 'apartment' | 'shop' | 'stall' })} options={['apartment','shop','stall']} />
                <Field label="Preferred move-in date" type="date" value={form.move_in} onChange={v => save({ move_in: v })} />
              </Grid2>
            </Card>

            <Btn onClick={submitStage1} loading={loading} label="Submit application" icon="ti-arrow-right" />
          </div>
        )}

        {/* ── STAGE 2: Payment ── */}
        {stage === 2 && (
          <Card title="Initial payment" icon="ti-cash">
            <InfoBox type="blue">
              Your application has been received. Please make the initial payment to proceed to the tenancy agreement.
            </InfoBox>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Amount to pay (₦) *" type="number" value={String(form.payment_amount || '')} onChange={v => save({ payment_amount: Number(v) })} placeholder="Enter agreed amount" />
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Payment method</label>
                <div className="flex gap-2">
                  {(['paystack', 'manual'] as const).map(m => (
                    <button key={m} onClick={() => setPayMeth(m)}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-[12px] font-medium transition-all
                        ${payMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {m === 'paystack' ? 'Paystack' : 'Bank transfer'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {payMethod === 'paystack' ? (
              <div className="space-y-3">
                <InfoBox type="green"><i className="ti ti-shield-check mr-1" /> Secured by Paystack · 256-bit SSL encryption</InfoBox>
                <Btn onClick={launchPaystack} loading={loading} label={`Pay ₦${Number(form.payment_amount || 0).toLocaleString('en-NG')} securely`} icon="ti-credit-card" color="paystack" />
              </div>
            ) : (
              <div className="space-y-3">
                <InfoBox type="amber">Transfer the amount to the account below, then complete the form and upload your proof.</InfoBox>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <Row2 label="Bank"           value={DEFAULT_SETTINGS.bank_name} />
                  <Row2 label="Account number" value={DEFAULT_SETTINGS.account_number} mono />
                  <Row2 label="Account name"   value={DEFAULT_SETTINGS.account_name} />
                </div>
                <Grid2>
                  <Field label="Transfer date *" type="date" value={form.payment_date} onChange={v => save({ payment_date: v })} />
                  <Field label="Depositor name *" value={form.depositor_name} onChange={v => save({ depositor_name: v })} placeholder="Name on bank receipt" />
                </Grid2>
                <FileUpload
                  onUpload={url => save({ proof_image: url })}
                  bucket="documents"
                  folder="proofs"
                  accept="image/*,application/pdf"
                  maxSizeMB={10}
                  currentUrl={form.proof_image}
                  label="Upload bank receipt / screenshot"
                />
                <Btn onClick={submitManualPayment} loading={loading} label="Submit payment for approval" icon="ti-check" />
              </div>
            )}
          </Card>
        )}

        {/* ── STAGE 3: Agreement signing ── */}
        {stage === 3 && (
          <div className="space-y-4">
            <Card title="Tenancy agreement" icon="ti-file-text">
              <InfoBox type="blue">Please read the agreement carefully. You may download a copy before signing.</InfoBox>
              <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto p-4 bg-white text-[11px] leading-relaxed mb-4">
                <TenancyAgreement
                  applicant={{ ...form, stage: 'form-submitted', submitted_at: '', payment_status: 'unpaid', unit_type: form.unit_type || 'apartment' } as Applicant}
                  settings={DEFAULT_SETTINGS}
                  mode="preview"
                />
              </div>
              <button onClick={() => window.print()} className="text-[12px] text-blue-600 hover:underline flex items-center gap-1 mb-4">
                <i className="ti ti-download" /> Download / print agreement
              </button>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-[13px] font-semibold mb-3">Sign the agreement</p>
                <DigitalSignatureCanvas
                  onSignature={(data, method) => { setSigData(data); setSigType(method); }}
                  signerName={form.name}
                />
              </div>
            </Card>
            <Btn onClick={submitAgreement} loading={loading} label="Sign & submit agreement" icon="ti-check" />
          </div>
        )}

        {/* ── STAGE 4: Under landlord review ── */}
        {stage === 4 && (
          <Card title="Under review" icon="ti-clock">
            <div className="text-center py-8">
              <i className="ti ti-clock text-5xl text-amber-400 mb-4 block" />
              <h2 className="text-[16px] font-semibold mb-2">Application submitted!</h2>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your tenancy application, payment, and signed agreement have been received.
                The landlord will review your submission and contact you via <strong>{form.phone}</strong>
                {form.email ? ` or ${form.email}` : ''}.
              </p>
              <div className="mt-6 p-4 bg-slate-50 rounded-xl text-left max-w-xs mx-auto text-[12px] space-y-1">
                <p className="font-semibold text-slate-700">{DEFAULT_SETTINGS.property_name}</p>
                <p className="text-slate-500">{DEFAULT_SETTINGS.emergency_phone}</p>
                <p className="text-slate-500">{DEFAULT_SETTINGS.address}</p>
              </div>
              <a href="/login" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-[13px] font-medium hover:bg-blue-700">
                Return to login
              </a>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Reusable sub-components ─────────────────────────────────────
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-[13px] font-semibold flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <i className={`ti ${icon} text-blue-500`} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', options, className, maxLength }: {
  label: string; value?: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; options?: string[]; className?: string; maxLength?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">{label}</label>
      {type === 'select' ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500 bg-white">
          {options?.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-blue-500" />
      )}
    </div>
  );
}

function Btn({ onClick, loading, label, icon, color }: {
  onClick: () => void; loading: boolean; label: string; icon: string; color?: string;
}) {
  const bg = color === 'paystack' ? 'bg-[#00C3F7] hover:bg-[#00A8D8]' : 'bg-blue-600 hover:bg-blue-700';
  return (
    <button onClick={onClick} disabled={loading}
      className={`w-full ${bg} text-white rounded-xl py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60`}>
      {loading ? <><i className="ti ti-loader-2 animate-spin" /> Please wait…</> : <><i className={`ti ${icon}`} /> {label}</>}
    </button>
  );
}

function InfoBox({ type, children }: { type: 'blue' | 'green' | 'amber'; children: React.ReactNode }) {
  const styles = { blue: 'bg-blue-50 border-blue-200 text-blue-800', green: 'bg-green-50 border-green-200 text-green-800', amber: 'bg-amber-50 border-amber-200 text-amber-800' };
  return <div className={`border rounded-lg p-3 text-[12px] mb-3 ${styles[type]}`}>{children}</div>;
}

function Row2({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`text-[13px] font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
