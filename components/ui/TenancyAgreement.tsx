'use client';

import { formatDate } from '@/utils';
import type { Applicant, PropertySettings } from '@/types';
import { useState, useEffect } from 'react';

interface AgreementProps {
  applicant: Applicant;
  settings: PropertySettings;
  signatureData?: string;
  signatureType?: string;
  mode?: 'preview' | 'signed';
}

export default function TenancyAgreement({
  applicant: a,
  settings: s,
  signatureData,
  signatureType,
  mode = 'preview',
}: AgreementProps) {
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);
  const leaseStart = a.payment_date ? formatDate(a.payment_date) : '___';
  const rent = a.payment_amount ? `₦${Number(a.payment_amount).toLocaleString('en-NG')}.00` : '₦___________.00';
  const deposit = rent;

  return (
    <div className="agreement-doc font-serif text-[13px] leading-relaxed text-slate-800 max-w-2xl mx-auto bg-white p-8 print:p-0">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-[16px] font-bold uppercase tracking-wider">RESIDENTIAL TENANCY AGREEMENT</h1>
        <p className="text-[13px] mt-2">This Lease dated this ___ day of {today || '____ ____ ____'}</p>
      </div>

      {/* Parties */}
      <div className="mb-4 space-y-2">
        <p><strong>BETWEEN:</strong></p>
        <p className="pl-6"><strong>{s.landlord_name}</strong> (the "Landlady")</p>
        <p><strong>AND—</strong></p>
        <p className="pl-6"><strong>{a.name || '_________________________'}</strong> (the "Tenant")</p>
        <p><strong>AND</strong></p>
        <p className="pl-6"><strong>{a.guarantor || '_________________________'}</strong> (the "Guarantor")</p>
        <p className="text-[12px] text-slate-500 italic">(individually the "Party" and collectively the "Parties")</p>
      </div>

      <div className="border-t border-b border-slate-300 py-3 my-4 text-[12px] italic text-slate-600">
        IN CONSIDERATION of the Landlady leasing certain premises to the Tenant and other valuable consideration, the receipt and sufficiency of which consideration is acknowledged, the Parties agree as follows:
      </div>

      {/* Clauses */}
      <Section title="Leased Property">
        <Clause n={1}>The Landlady agrees to rent to the Tenant the flat, municipally described as <strong>{s.address}</strong> (the "Property"), for use as residential premises only. The Property is more particularly described as: A Yellow and Brown building with black gate.</Clause>
        <Clause n={2}>No guest(s) of the Tenant may occupy the Property for longer than one week without the prior consent of the Landlady.</Clause>
        <Clause n={3}>No pets or animals are allowed to be kept in or about the Property without the prior written permission of the Landlady.</Clause>
        <Clause n={4}>Car park space is limited under the terms of this Lease and no vehicle may park on or about the Property without consent of the Landlady.</Clause>
        <Clause n={5}>The Property is provided to the Tenant without any furnishings or chattels.</Clause>
      </Section>

      <Section title="Term">
        <Clause n={6}>The term of the Lease is a periodic tenancy commencing at 12:00 noon on <strong>{leaseStart}</strong> and continuing on a year-to-year basis until the Landlady or the Tenant terminates the tenancy (the "Term").</Clause>
        <Clause n={7}>If the tenant is in default under this Lease, then upon providing 30 days of notice, the Landlady may terminate this tenancy, exercise rights of distress, or exercise any other available rights at law.</Clause>
      </Section>

      <Section title="Rent">
        <Clause n={8}>Subject to the provisions of this Lease, the rent for the Property is <strong>{rent}</strong> per year (the "Rent").</Clause>
        <Clause n={9}>The Tenant will pay the Rent on or before the agreed date of every year of the Term by cash or direct transfer or deposit to the account supplied by the Landlady at {s.address} or at such other place as the Landlady may later designate.</Clause>
        <Clause n={10}>The Landlady may review the rent from time to time and may increase the rent in accordance with the applicable laws of Lagos State. The Landlady will provide a minimum of 120 days' notice to the Tenant to increase the rent.</Clause>
      </Section>

      <Section title="Security Deposit">
        <Clause n={11}>On execution of this Lease, the Tenant will pay the Landlady a security deposit of <strong>{deposit}</strong> (the "Security").</Clause>
        <Clause n={12}>During the Term or after its termination, the Landlady may charge the Tenant or make deductions from the Security for: (a) repair of walls; (b) repainting; (c) unplugging toilets, sinks, and drains; (d) replacing damaged fixtures; (e) repairing damage beyond normal wear and tear; (f) extermination costs; (g) any other repairs due to Tenant's negligence.</Clause>
        <Clause n={13}>The Tenant may not use the Security as payment for the Rent.</Clause>
      </Section>

      <Section title="Sureties">
        <Clause n={14}>The Guarantor, <strong>{a.guarantor || '___________________'}</strong> of <strong>{a.guarantor_address || '___________________'}</strong>, guarantees to the Landlady that the Tenant will comply with the Tenant's obligations under this Lease.</Clause>
        <Clause n={15}>The Guarantor agrees to compensate the Landlady in full on demand for: (a) the Rent during any time the Tenant occupies the Property; (b) arrears if the Tenant fails to pay; (c) any damage caused by the Tenant's negligence.</Clause>
        <Clause n={16}>The Guarantor's obligation to guarantee survives the termination or expiry of this Lease.</Clause>
      </Section>

      <Section title="Quiet Enjoyment">
        <Clause n={17}>The Landlady covenants that on paying the Rent and performing the covenants contained in this Lease, the Tenant will peacefully and quietly have, hold, and enjoy the Property for the Term.</Clause>
      </Section>

      <Section title="Inspections">
        <Clause n={18}>The Parties will complete an inspection report at the beginning and at the end of this tenancy.</Clause>
        <Clause n={19}>During the Term, the Landlady and its agents may enter the Property between 8:00 AM and 6:00 PM to make inspections upon a minimum of 48 hours' notice. In the event of an emergency, entry may be made at any time without prior notice.</Clause>
      </Section>

      <Section title="Tenant Improvements">
        <Clause n={20}>The Tenant will obtain permission from the Landlady before: (a) applying adhesive materials or inserting nails in walls; (b) painting or redecorating; (c) removing or adding walls or structural alterations; (d) placing any signs or notices.</Clause>
        <Clause n={21}>The Tenant accepts this Lease as the sole form of compensation for any improvements made to the Property.</Clause>
      </Section>

      <Section title="Services and Facility Costs">
        <Clause n={22}>The Tenant is responsible for the payment of all the Tenant's services in relation to the Property.</Clause>
      </Section>

      <Section title="Insurance">
        <Clause n={23}>The Tenant understands that personal property of the Tenant is not insured by the Landlady for either damage or loss.</Clause>
      </Section>

      <Section title="Governing Law">
        <Clause n={24}>This Lease will be construed in accordance with and exclusively governed by the laws of Lagos State.</Clause>
      </Section>

      <Section title="Assignment and Subletting">
        <Clause n={25}>Without prior, express, and written consent of the Landlady, the Tenant will not assign this Lease or sublet the Property or any part thereof.</Clause>
      </Section>

      <Section title="Damage to Property">
        <Clause n={26}>If the Property is damaged other than by the Tenant's negligence and the Landlady decides not to rebuild or repair, the Landlady may end this Lease by giving appropriate notice.</Clause>
      </Section>

      <Section title="Maintenance">
        <Clause n={27}>The Tenant will, at its sole expense, keep and maintain the Property in good and sanitary condition and repair during the Term.</Clause>
        <Clause n={28}>Major maintenance and repair of the Property not due to the Tenant's misuse will be the responsibility of the Landlady.</Clause>
        <Clause n={29}>The Tenant will keep fixtures in good order. The Tenant will, at Tenant's sole expense, make all required repairs to plumbing and electric fixtures whenever damage results from the Tenant's misuse or neglect.</Clause>
        <Clause n={30}>Where the Property has exclusive sidewalk or car park space, the Tenant will keep these areas clean and free of objectionable material.</Clause>
      </Section>

      <Section title="Care and Use of Property">
        <Clause n={31}>The Tenant will promptly notify the Landlady of any damage or situation that may significantly interfere with the normal use of the Property.</Clause>
        <Clause n={32}>The Tenant will not engage in any illegal trade or activity on or about the Property.</Clause>
        <Clause n={33}>At the expiration of the Term, the Tenant will quit and surrender the Property in as good a state as at commencement, reasonable use and wear and tear excepted.</Clause>
      </Section>

      <Section title="Prohibited Activities">
        <Clause n={34}>The Tenant will not keep on the property any article of a dangerous, flammable, or explosive character.</Clause>
        <Clause n={35}>The Tenant will not perform any activity that significantly increases the use of electricity, water, or other services.</Clause>
      </Section>

      <Section title="Rules and Regulations">
        <Clause n={36}>The Tenant will obey all rules and regulations of the Landlady regarding the Property.</Clause>
      </Section>

      <Section title="Address for Notice">
        <Clause n={37}>For any matter relating to this tenancy, the Tenant may be contacted at: <strong>Name:</strong> {a.name} · <strong>Phone:</strong> {a.phone}</Clause>
        <Clause n={38}>For any matter relating to this tenancy, the Guarantor's address for notice is: <strong>Name:</strong> {a.guarantor} · <strong>Address:</strong> {a.guarantor_address}</Clause>
        <Clause n={39}>For any matter relating to this tenancy, the Landlady's address for notice is: <strong>Name:</strong> {s.landlord_name} · <strong>Address:</strong> {s.address} · <strong>Phone:</strong> {s.emergency_phone} · <strong>Email:</strong> {s.email}</Clause>
      </Section>

      <Section title="General Provisions">
        <Clause n={40}>All monetary amounts stated or referred to in this Lease are based in the Nigerian Naira (₦).</Clause>
        <Clause n={41}>This Lease may only be amended or modified by a written document executed by the Parties.</Clause>
        <Clause n={42}>This Lease may be executed in counterparts. <strong>Electronic signatures are binding and are considered to be original signatures.</strong></Clause>
        <Clause n={43}>This Lease constitutes the entire agreement between the Parties.</Clause>
        <Clause n={44}>During the last 30 days of this Lease, the Landlady will have the privilege of displaying the usual 'For Sale' or 'For Rent' signs on the Property.</Clause>
        <Clause n={45}>Time is of the essence in this Lease.</Clause>
      </Section>

      {/* Signature blocks */}
      <div className="mt-8 pt-6 border-t-2 border-slate-300">
        <p className="text-[13px] font-medium mb-6">
          IN WITNESS WHEREOF the Parties have duly affixed their signatures on the _____ day of {today || '____ ____ ____'}.
        </p>

        <div className="grid grid-cols-2 gap-12">
          {/* Tenant signature */}
          <div>
            <p className="text-[12px] font-semibold text-slate-600 mb-1">TENANT</p>
            <div className="min-h-[60px] border-b-2 border-slate-800 flex items-end pb-1">
              {mode === 'signed' && signatureData ? (
                signatureType === 'type'
                  ? <span className="sig-cursive text-[28px]">{signatureData}</span>
                  : <img src={signatureData} alt="Tenant signature" className="max-h-14 object-contain" />
              ) : (
                <span className="text-slate-300 text-[12px] italic">Awaiting signature</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{a.name || 'Tenant name'}</p>
            {mode === 'signed' && a.agreed_on && (
              <p className="text-[11px] text-slate-400">Date: {formatDate(a.agreed_on)}</p>
            )}
          </div>

          {/* Landlord signature */}
          <div>
            <p className="text-[12px] font-semibold text-slate-600 mb-1">LANDLADY</p>
            <div className="min-h-[60px] border-b-2 border-slate-800 flex items-end pb-1">
              <span className="sig-cursive text-[24px]">{s.landlord_name}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{s.landlord_name}</p>
          </div>

          {/* Guarantor signature */}
          <div>
            <p className="text-[12px] font-semibold text-slate-600 mb-1">GUARANTOR</p>
            <div className="min-h-[60px] border-b-2 border-slate-800" />
            <p className="text-[11px] text-slate-500 mt-1">{a.guarantor || 'Guarantor name'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[13px] font-bold underline mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Clause({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="pl-4 text-[12.5px] leading-relaxed">
      <strong>{n}.</strong> {children}
    </p>
  );
}
