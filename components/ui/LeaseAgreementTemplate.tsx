import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LeaseAgreementTemplateProps {
  tenant: {
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    address: string;
  };
  settings: {
    landladyName: string;
    propertyAddress: string;
    propertyPhone: string;
    propertyEmail: string;
    propertyPhone2?: string;
  };
  agreementDate?: Date;
  mode?: 'view' | 'print';
}

export const LeaseAgreementTemplate: React.FC<LeaseAgreementTemplateProps> = ({
  tenant,
  settings,
  agreementDate = new Date(),
  mode = 'view'
}) => {
  const formatDay = (d: Date) => d.getDate();
  const formatMonth = (d: Date) => d.toLocaleString('default', { month: 'long' });
  const formatYear = (d: Date) => d.getFullYear();

  const today = agreementDate;
  const leaseStart = today;

  const getPaymentDayString = (d: Date) => {
    const day = d.getDate();
    const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3) ? 0 : Number(day % 100 - day % 10 !== 10) * (day % 10)];
    return `${day}${suffix} day of ${d.toLocaleString('default', { month: 'long' })}`;
  };

  const containerClasses = mode === 'print'
    ? "font-serif text-black leading-relaxed text-sm p-8 bg-white text-justify"
    : "font-serif text-slate-300 leading-relaxed text-sm p-4 bg-slate-900/90 text-justify";

  const headingClasses = mode === 'print'
    ? "font-bold text-black text-xl mb-6 uppercase tracking-widest border-b-2 border-black pb-2 inline-block"
    : "font-bold text-white text-xl mb-6 uppercase tracking-widest border-b-2 border-white/20 pb-2 inline-block";

  return (
    <div id="lease-content" className={containerClasses}>
      <div className="text-center mb-8">
        <h3 className={headingClasses}>RESIDENTIAL TENANCY AGREEMENT</h3>

        <p className="mb-4 text-base">
          THIS LEASE (the "Lease") dated this <strong>{formatDay(today)}</strong> day of <strong>{formatMonth(today)}</strong> 20<strong>{formatYear(today).toString().slice(-2)}</strong>
        </p>

        <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">BETWEEN:</p>
        <p className="mb-1 font-bold text-lg uppercase" style={{ color: mode === 'print' ? 'black' : 'white' }}>{settings.landladyName}</p>
        <p className="mb-6">(the "Landlady")</p>

        <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">AND-</p>
        <p className={`mb-1 text-white font-bold border-b border-white/20 inline-block min-w-[200px]`}>{tenant.fullName}</p>
        <p className="mb-6">(the "Tenant")</p>

        <p className="mb-2 italic text-slate-400">(individually the "Party" and collectively the "Parties")</p>
      </div>

      <p className="mb-6 text-center">
        IN CONSIDERATION of the Landlady leasing certain premises to the Tenant and other valuable consideration, the receipt and sufficiency of which consideration is acknowledged, the Parties agree as follows:
      </p>

      <div className="space-y-4">
        <div>
          <h4 className={`text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full`}>Leased Property</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>The Landlady agrees to rent to the Tenant the flat, municipally described as {settings.propertyAddress}. The Property is more particularly described as: A Yellow and Brown building with black gate.</li>
            <li>No guest(s) of the Tenant may occupy the Property for longer than one week without the prior consent of the Landlady.</li>
            <li>No pets or animals are allowed to be kept in or about the Property without the prior written permission of the Landlady. Upon thirty (30) days' notice, the Landlady may revoke any consent previously given pursuant to this clause.</li>
            <li>Car park space is limited under the terms of this Lease and no vehicle may park on or about the Property without consent of the Landlady.</li>
            <li>The Property is provided to the Tenant without any furnishings or chattels.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Term</h4>
          <ol start={6} className="list-decimal pl-5 space-y-2">
            <li>The term of the Lease is a periodic tenancy commencing at 12:00 noon on <strong>{formatDay(leaseStart)}</strong> day of <strong>{formatMonth(leaseStart)}</strong> 20<strong>{formatYear(leaseStart).toString().slice(-2)}</strong> and continuing on a year-to-year basis until the Landlady or the Tenant terminates the tenancy (the "Term").</li>
            <li>If the tenant is in default under this Lease, then upon providing 30 days of notice, the Landlady may terminate this tenancy, exercise rights of distress, or exercise any other available rights at law.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Rent</h4>
          <ol start={8} className="list-decimal pl-5 space-y-2">
            <li>Subject to the provisions of this Lease, the rent for the Property is ₦<strong>500,000.00</strong> per year (the "Rent").</li>
            <li>The Tenant will pay the Rent on or before the <strong>{getPaymentDayString(leaseStart)}</strong> of every year of the Term by cash or direct transfer or deposit to the account supplied by the Landlady.</li>
            <li>The Landlady may review the rent from time to time and may increase the rent in accordance with the applicable laws of Lagos State. The Landlady will provide a minimum of 120 days' notice to the Tenant to increase the rent.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Security Deposit</h4>
          <ol start={11} className="list-decimal pl-5 space-y-2">
            <li>During the Term or after its termination, the Landlady may charge the Tenant or make deductions from the Security deposit for any or all of the following:
              <ul className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                <li>repair of walls due to plugs, large nails, or any unreasonable number of holes in the walls including the repainting of such damaged walls;</li>
                <li>repainting required to repair the results of any other improper use or excessive damage by the Tenant;</li>
                <li>unplugging toilets, sinks, and drains;</li>
                <li>replacing damaged or missing doors, windows, screens, mirrors, or light fixtures;</li>
                <li>repairing cuts, burns, or water damage to linoleum, rugs, and other areas;</li>
                <li>any other repairs or cleaning due to any damage beyond normal wear and tear caused or permitted by the Tenant or by any person whom the Tenant is responsible for;</li>
                <li>the cost of extermination where the Tenant or the Tenant's guests have brought or allowed insects or other pests into the Property or building;</li>
                <li>repairs and replacement required where windows are left open which have caused rain or water damage to floors or walls;</li>
                <li>any other purpose allowed under this Lease or the applicable laws of Lagos State.</li>
                <li>For the purpose of this clause, the Landlady may charge the Tenant for professional cleaning and repairs if the Tenant has not made alternate arrangements with the Landlady.</li>
              </ul>
            </li>
            <li>The Tenant may not use the Security as payment for the Rent.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Sureties</h4>
          <ol start={13} className="list-decimal pl-5 space-y-2">
            <li>The Guarantor, <strong>{tenant.firstName} {tenant.lastName}</strong> of <strong>{tenant.address}</strong></li>
            <li>, guarantees to the Landlady that the Tenant will comply with the Tenant's obligations under this Lease arising during the original term, any renewed or additional term, and any resulting periodic tenancy by virtue of statute, contract, or consent. As such, the Guarantor agrees to compensate the Landlady in full on demand for
              <ul className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                <li>the Rent during any time the Tenant occupies the Property;</li>
                <li>if the Tenant fails to pay the Rent according to this Lease, the arrears and any fees charged by or to the Landlady for the collection of the Rent according to this Lease; and</li>
                <li>any damage caused by the Tenant's negligence or willful act or that of the Tenant's employee, family, agent, or visitor, if the Tenant fails to rectify, or pay to rectify, that damage.</li>
              </ul>
            </li>
            <li>The Guarantor's obligation to guarantee survives the termination or expiry of this Lease. The Guarantor's obligations remain fully effective even if this Lease is disclaimed or the Landlady gives the Tenant extra time to comply with any obligation or does not insist on strict compliance with its terms.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Quiet Enjoyment</h4>
          <ol start={16} className="list-decimal pl-5 space-y-2">
            <li>The Landlady covenants that on paying the Rent and performing the covenants contained in this Lease, the Tenant will peacefully and quietly have, hold, and enjoy the Property for the Term.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Inspections</h4>
          <ol start={17} className="list-decimal pl-5 space-y-2">
            <li>The Parties will complete, an inspection report at the beginning and at the end of this tenancy.</li>
            <li>During the Term and any renewal of this Lease, the Landlady and its agents may enter the Property between 8:00 AM and 6:00 PM to make inspections or to show the Property to prospective tenants or purchasers upon a minimum of 48 hours' notice to the Tenant. During the Term and any renewal of this Lease, the Landlady and its agents may enter the Property at any time without prior notice in the event of an emergency.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Tenant Improvements</h4>
          <ol start={19} className="list-decimal pl-5 space-y-2">
            <li>The Tenant will obtain permission from the Landlady before doing any of the following:
              <ul className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                <li>applying adhesive materials, or inserting nails or hooks in walls or ceilings other than two small picture hooks per wall;</li>
                <li>painting, wallpapering, redecorating, or in any way significantly altering the appearance of the Property;</li>
                <li>removing or adding walls, or performing any structural alterations;</li>
                <li>placing or exposing or allowing to be placed or exposed anywhere inside or outside the Property any placard, notice, or sign for advertising or any other purpose; or</li>
              </ul>
            </li>
            <li>The Tenant accepts this Lease and the rights it contains as the sole form of compensation for any improvements made to the Property.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Services and Facility Costs</h4>
          <ol start={21} className="list-decimal pl-5 space-y-2">
            <li>The Tenant is responsible for the payment of all the Tenant's services in relation to the Property.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Insurance</h4>
          <ol start={22} className="list-decimal pl-5 space-y-2">
            <li>The Tenant understands that the personal property of the Tenant is not insured by the Landlady for either damage or loss, and the Landlady assumes no liability for any such loss.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Governing Law</h4>
          <ol start={23} className="list-decimal pl-5 space-y-2">
            <li>This Lease will be construed in accordance with and exclusively governed by the laws of Lagos State.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Assignment and Subletting</h4>
          <ol start={24} className="list-decimal pl-5 space-y-2">
            <li>Without the prior, express, and written consent of the Landlady, the Tenant will not assign this Lease or sublet or grant any concession or license to use the Property or any part of the Property. A consent by Landlady to one assignment, subletting, concession, or license will not be deemed to be a consent to any subsequent assignment, subletting, concession, or license. Any assignment, subletting, concession, or license without the prior written consent of Landlady, or an assignment or subletting by operation of law, will be void and will, at Landlady's option, terminate this Lease. The Tenant will pay any fees or other charges from solicitors or letting agents as a result of the assignment, subletting, concession, or license.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Damage to Property</h4>
          <ol start={25} className="list-decimal pl-5 space-y-2">
            <li>If the Property should be damaged other than by the Tenant's negligence or willful act or that of the Tenant's employee, family, agent, or visitor and the Landlady decides not to rebuild or repair the Property, the Landlady may end this Lease by giving appropriate notice.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Maintenance</h4>
          <ol start={26} className="list-decimal pl-5 space-y-2">
            <li>The Tenant will, at its sole expense, keep and maintain the Property and appurtenances in good and sanitary condition and repair during the Term and any renewal of this Lease.</li>
            <li>Major maintenance and repair of the Property not due to the Tenant's misuse, waste, or neglect or that of the Tenant's employee, family, agent, or visitor, will be the responsibility of the Landlady or the Landlady's assigns.</li>
            <li>In particular, the Tenant will keep the fixtures in the Property in good order and repair. The Tenant will, at Tenant's sole expense, make all required repairs to the plumbing, and electric fixtures whenever damage to such items will have resulted from the Tenant's misuse, waste, wear and tear or neglect or that of the Tenant's employee, family, agent, or visitor.</li>
            <li>Where the Property has its own sidewalk, entrance, driveway, or car park space which is for the exclusive use of the Tenant and its guests, the Tenant will keep the sidewalk, entrance, driveway, or car park space clean, tidy and free of objectionable material including dirt and debris.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Care and Use of Property</h4>
          <ol start={30} className="list-decimal pl-5 space-y-2">
            <li>The Tenant will promptly notify the Landlady of any damage, or of any situation that may significantly interfere with the normal use of the Property or to any furnishings supplied by the Landlady.</li>
            <li>The Tenant will not engage in any illegal trade or activity on or about the Property.</li>
            <li>At the expiration of the Term, the Tenant will quit and surrender the Property in as good a state and condition as at the commencement of this Lease, reasonable use and wear and tear excepted.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Prohibited Activities and Materials</h4>
          <ol start={33} className="list-decimal pl-5 space-y-2">
            <li>The Tenant will not keep or have on the property any article or thing of a dangerous, flammable, or explosive character that might unreasonably increase the danger of fire on the Property or that might be considered hazardous.</li>
            <li>The Tenant will not perform any activity on the Property that the Landlady feels significantly increases the use of electricity, water, sewer, or other services on the Property.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Rules and Regulations</h4>
          <ol start={35} className="list-decimal pl-5 space-y-2">
            <li>The Tenant will obey all rules and regulations of the Landlady regarding the Property.</li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">Address for Notice</h4>
          <ol start={36} className="list-decimal pl-5 space-y-2">
            <li>For any matter relating to this tenancy, the Tenant may be contacted at the Property or through the phone number below.
              <div className="mt-2 ml-4">
                <p>Name: <span className="border-b border-white/20 inline-block min-w-[200px]">{tenant.fullName}</span></p>
                <p className="mt-1">Phone: <span className="border-b border-white/20 inline-block min-w-[200px]">{tenant.phone}</span></p>
              </div>
            </li>
            <li>For any matter relating to this tenancy, whether during or after this tenancy has been terminated, the Landlady's address for notice is:
              <div className="mt-2 ml-4">
                <p>Name: <strong>{settings.landladyName}</strong></p>
                <p>Address: {settings.propertyAddress}</p>
                <p className="mt-2 text-xs text-slate-400">The contact information for the Landlady is:</p>
                <p>Phone: {settings.propertyPhone}</p>
                {settings.propertyPhone2 && <p>Phone: {settings.propertyPhone2}</p>}
                <p>Email: {settings.propertyEmail}</p>
              </div>
            </li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-bold mt-4 mb-2 uppercase border-b border-white/10 pb-1 w-full">General Provisions</h4>
          <ol start={39} className="list-decimal pl-5 space-y-2 mb-6">
            <li>All monetary amounts stated or referred to in this Lease are based in the Nigerian Naira.</li>
            <li>This Lease may only be amended or modified by a written document executed by the Parties.</li>
            <li>This Lease may be executed in counterparts. Electronic signatures are binding and are considered to be original signatures.</li>
            <li>This Lease constitutes the entire agreement between the Parties. Any prior understanding or representation of any kind preceding the date of this Lease will not be binding on either Party except to the extent incorporated in this Lease.</li>
            <li>During the last 30 days of this Lease, the Landlady or the Landlady's agents will have the privilege of displaying the usual 'For Sale' or 'For Rent' or 'Vacancy' signs on the Property.</li>
            <li>Time is of the essence in this Lease.</li>
          </ol>
        </div>
      </div>

      <p className={`mb-8 font-bold text-center border-t border-white/20 pt-4 mt-8`}>IN WITNESS WHEREOF the Parties have duly affixed their signatures.</p>

      <div className="flex justify-around items-end mt-12 mb-12">
        <div className="text-center">
          <div className="mb-2 h-16 flex items-end justify-center">
            <p className="font-serif italic text-black/80 text-2xl" style={{ fontFamily: "'Brush Script MT', cursive" }}>
              {settings.landladyName}
            </p>
          </div>
          <p className={`border-t border-white/20 pt-2 w-48 mx-auto`}>Landlady Signature</p>
        </div>
        <div className="text-center">
          <div className="mb-2 h-16 flex items-end justify-center">
            <p className="font-serif italic text-white/80 text-2xl" style={{ fontFamily: "'Brush Script MT', cursive" }}>
              {tenant.fullName}
            </p>
          </div>
          <p className={`border-t border-white/20 pt-2 w-48 mx-auto`}>Tenant Signature</p>
        </div>
      </div>

      <div className="space-y-4 text-center">
        <p>The Tenant acknowledges receiving a duplicate of this Lease signed by the Tenant, the Landlady, and the Guarantor on the <strong>{formatDay(today)}</strong> day of <strong>{formatMonth(today)}</strong>, 20<strong>{formatYear(today).toString().slice(-2)}</strong>.</p>
        <p>The Guarantor acknowledges receiving a duplicate of this Lease signed by the Tenant, the Landlady, and the Guarantor on the <strong>{formatDay(today)}</strong> day of <strong>{formatMonth(today)}</strong>, 20<strong>{formatYear(today).toString().slice(-2)}</strong>.</p>

        {mode !== 'print' && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-2">Have questions about this agreement?</p>
            <a
              href={`https://wa.me/${settings.propertyPhone}?text=Hello, I have a question regarding my lease agreement for ${tenant.fullName}.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
            >
              Message Property Management <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};