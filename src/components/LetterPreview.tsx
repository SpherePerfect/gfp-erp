import React from 'react';
import { EngagementRecord, FirmProfile, ServiceTemplate } from '../types';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToIndianWords';
import { getNumberedDeliverables } from '../utils/numberingHelpers';

interface LetterPreviewProps {
  record: EngagementRecord;
  firm: FirmProfile;
}

export const LetterPreview: React.FC<LetterPreviewProps> = ({ record, firm }) => {
  const { client } = record;
  const activeServices: ServiceTemplate[] =
    record.services && record.services.length > 0 ? record.services : [record.service];
  const primaryService = activeServices[0] || record.service;
  const isMultiService = activeServices.length > 1;

  // Commercial totals across all selected services
  const totalBaseFee = activeServices.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0);

  // Discount / Professional Concession calculation
  let discountAmount = 0;
  if (record.discountConfig?.enabled && record.discountConfig.value > 0) {
    if (record.discountConfig.type === 'percent') {
      discountAmount = Math.round((totalBaseFee * record.discountConfig.value) / 100);
    } else {
      discountAmount = Math.min(record.discountConfig.value, totalBaseFee);
    }
  }
  const taxableSubtotal = Math.max(0, totalBaseFee - discountAmount);

  // Non-GST or Personal Issuer
  const isPersonalNonGst =
    record.invoiceIssuerType === 'personal' || record.isNonGstInvoice === true;

  // Inter-state GST check
  const isInterState =
    client.state &&
    firm.registeredState &&
    client.state.trim().toLowerCase() !== firm.registeredState.trim().toLowerCase();

  const gstRate = isPersonalNonGst ? 0 : 18;
  const gstAmount = isPersonalNonGst ? 0 : Math.round((taxableSubtotal * gstRate) / 100);
  const cgstAmount = !isPersonalNonGst && !isInterState ? Math.round(gstAmount / 2) : 0;
  const sgstAmount = !isPersonalNonGst && !isInterState ? Math.round(gstAmount / 2) : 0;
  const igstAmount = !isPersonalNonGst && isInterState ? gstAmount : 0;
  const grandTotal = taxableSubtotal + gstAmount;

  // Advance payment & GST logic
  const isAdvanceGstExempt = Boolean(record.advanceExemptGst);
  const isCollectFullAtEnd = Boolean(record.collectFullAtEnd);

  const advancePercent = isCollectFullAtEnd
    ? 0
    : (record.customAdvancePercent || primaryService.pricing?.customAdvancePercent || 50);
  const advanceTaxable = isCollectFullAtEnd
    ? 0
    : Math.round((taxableSubtotal * advancePercent) / 100);
  const advanceGst = (isPersonalNonGst || isAdvanceGstExempt || isCollectFullAtEnd)
    ? 0
    : Math.round((advanceTaxable * gstRate) / 100);
  const advanceTotal = advanceTaxable + advanceGst;

  const balanceTaxable = taxableSubtotal - advanceTaxable;
  const balanceGst = isPersonalNonGst ? 0 : (gstAmount - advanceGst);
  const balanceTotal = balanceTaxable + balanceGst;

  // Specific Conditions resolution from record, services, or stored templates fallback
  let fallbackConditions: string[] = [];
  try {
    const rawTemplates = localStorage.getItem('gfp_service_templates');
    if (rawTemplates) {
      const storedTemplates = JSON.parse(rawTemplates);
      if (Array.isArray(storedTemplates)) {
        const matching = storedTemplates.filter(
          (t: any) =>
            t &&
            activeServices.some(
              (s) =>
                s.id === t.id ||
                s.serviceCode === t.serviceCode ||
                s.serviceTitle?.toLowerCase() === t.serviceTitle?.toLowerCase()
            )
        );
        fallbackConditions = matching.flatMap((t: any) => t.additionalConditions || []);
      }
    }
  } catch {
    // Ignore fallback parse error
  }

  const specificConditions: string[] = [
    ...(record.assumptions && record.assumptions.length > 0 ? record.assumptions : []),
    ...activeServices.flatMap((s) => s.additionalConditions || []),
    ...fallbackConditions,
  ].filter((c, idx, arr) => c && c.trim() && arr.indexOf(c) === idx);

  const outOfScopeItems: string[] = (record.outOfScope || []).filter((o) => o && o.trim());

  // TDS under Section 194J
  let tdsAmount = 0;
  if (record.tdsConfig?.enabled && record.tdsConfig.ratePercent > 0) {
    tdsAmount = Math.round((taxableSubtotal * record.tdsConfig.ratePercent) / 100);
  }

  // Signatory resolution
  const activeSignatory =
    record.signatory ||
    firm.signatories?.find((s) => s.isDefault) ||
    firm.signatories?.[0] || {
      id: 'default',
      name: firm.signatoryName || 'CA Yogesh Kulkarni',
      designation: firm.signatoryDesignation || 'Director / Authorised Signatory',
      email: firm.signatoryEmail || firm.firmEmail || 'advisory@gfpconsulting.in',
      phone: firm.signatoryPhone || '+91 93708 88819',
    };

  const logoPosition = firm.logoPosition || firm.themeSettings?.logoPosition || 'left';
  const expectedTimeline = record.projectTimeline || primaryService.projectTimeline || '3 to 4 Weeks';
  const clientEnablersNote =
    record.clientEnablersClause ||
    primaryService.clientEnablersClause ||
    'Adherence to this project delivery timeline is strictly subject to the timely provision of requisite documentation, operational data, and scheduled stakeholder interactions by your team.';

  const subjectLine = isMultiService
    ? `Comprehensive Advisory Engagement: ${activeServices.map((s) => s.serviceTitle).join(' and ')}`
    : primaryService.subjectLine || `Engagement for ${primaryService.serviceTitle}`;

  // Sequential Section Numbering to match DOCX export exactly
  const hasObjectives = activeServices.some((s) => s.objectives && s.objectives.some((o) => o.include));
  const hasInfoRequired = activeServices.some((s) => s.informationRequired && s.informationRequired.some((i) => i.include));

  let secCount = 1;
  const objectivesSecNum = hasObjectives ? `${secCount++}` : null;
  const overviewSecNum = isMultiService ? `${secCount++}` : null;
  const scopeSecNum = `${secCount++}`;
  const infoSecNum = hasInfoRequired ? `${secCount++}` : null;
  const timelineSecNum = `${secCount++}`;
  const commercialSecNum = `${secCount++}`;
  const assumptionsSecNum = `${secCount++}`;

  // QR Code fallback
  const activeQrCodeUrl =
    record.qrCodeDataUrl ||
    firm.qrCodeDataUrl ||
    firm.bankDetails?.qrCodeDataUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `upi://pay?pa=${firm.bankDetails.upiId || 'audit@gfpconsulting.in'}&pn=${encodeURIComponent(
        firm.bankDetails.accountHolderName
      )}&cu=INR&tn=${encodeURIComponent(record.refNo)}`
    )}`;

  return (
    <div
      id="printable-engagement-letter"
      className="relative bg-white text-slate-900 shadow-xl border border-blue-100 rounded-none p-8 sm:p-14 font-serif text-[13.5px] leading-relaxed max-w-[860px] mx-auto print:shadow-none print:border-none print:p-0 print:m-0 overflow-hidden"
      style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
    >
      {/* Live Watermark Overlay (if enabled) */}
      {record.watermarkConfig?.enabled && record.watermarkConfig.text && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none z-0 overflow-hidden"
          style={{ opacity: record.watermarkConfig.opacity || 0.14 }}
        >
          <div
            className={`font-black font-sans text-slate-900 text-5xl sm:text-7xl md:text-8xl tracking-widest uppercase border-4 sm:border-8 border-slate-900 px-8 py-4 ${
              record.watermarkConfig.diagonal !== false ? '-rotate-35' : ''
            }`}
          >
            {record.watermarkConfig.text}
          </div>
        </div>
      )}

      {/* Executive Letterhead - Left Text & Right Big Logo */}
      <div className="pb-4 border-b-2 border-[#0B2545] mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        {/* Left Side: Firm / Personal Identity and Credentials */}
        <div className="text-left flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0B2545] uppercase font-sans">
            {isPersonalNonGst && record.personalIssuer ? record.personalIssuer.name : firm.firmName}
          </h1>
          {((isPersonalNonGst && record.personalIssuer?.designation) || (firm.tagline && !firm.tagline.toLowerCase().includes('financial services'))) && (
            <p className="text-xs sm:text-sm italic text-blue-900 font-serif mt-0.5">
              {isPersonalNonGst && record.personalIssuer
                ? record.personalIssuer.designation
                : firm.tagline}
            </p>
          )}

          {/* Office Locations / Address */}
          <p className="text-xs text-slate-600 tracking-wide font-sans mt-1 font-medium">
            {isPersonalNonGst && record.personalIssuer
              ? record.personalIssuer.address || firm.officeLocations
              : firm.officeLocations}
          </p>

          {/* Statutory & Tax Details with Pipes including CIN */}
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-600 mt-1">
            {isPersonalNonGst && record.personalIssuer ? (
              <>
                {record.personalIssuer.pan && (
                  <>
                    <span>
                      PAN: <strong className="text-[#0B2545] font-semibold">{record.personalIssuer.pan}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                  </>
                )}
                <span className="text-slate-600">
                  Status: <strong className="text-[#0B2545] font-semibold">Individual Advisory Consultant / Non-GST</strong>
                </span>
              </>
            ) : (
              <>
                <span>
                  GSTIN: <strong className="text-[#0B2545] font-semibold">{firm.gstin}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  PAN: <strong className="text-[#0B2545] font-semibold">{firm.pan}</strong>
                </span>
                {firm.cin && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>
                      CIN: <strong className="text-[#0B2545] font-semibold">{firm.cin}</strong>
                    </span>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <span>
                  SAC: <strong className="text-[#0B2545] font-semibold">{firm.sacCode || '998311'}</strong>
                </span>
              </>
            )}
          </div>

          {/* Contact & Web Info with Pipes */}
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-600 mt-0.5">
            <span>
              Email: <strong className="text-[#0B2545] font-semibold">{firm.firmEmail || 'contact@gfpconsulting.in'}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Phone: <strong className="text-[#0B2545] font-semibold">{firm.firmPhone || '+91 93708 88819'}</strong>
            </span>
            {firm.firmWebsite && (
              <>
                <span className="text-slate-300">|</span>
                <span>
                  Web: <strong className="text-[#0B2545] font-semibold">{firm.firmWebsite}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Prominent Logo with user-controlled constant size */}
        <div className="shrink-0 flex sm:justify-end items-start pt-0.5">
          {firm.logoDataUrl ? (
            <img
              src={firm.logoDataUrl}
              alt={firm.firmName}
              style={{
                width: `${firm.logoWidthPx || 180}px`,
                maxWidth: '100%',
                height: 'auto',
              }}
              className="object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{ width: `${firm.logoWidthPx || 180}px` }}
              className="py-3 px-4 rounded-none bg-blue-50/80 border-2 border-[#0B2545]/25 flex flex-col items-center justify-center font-black text-[#0B2545] shadow-xs text-center"
            >
              <span className="text-xl sm:text-2xl tracking-tight font-sans font-black text-[#0B2545]">GFP ADVISORY</span>
              <span className="text-[10px] font-sans font-extrabold tracking-widest uppercase text-blue-800 mt-1">
                Strategic Management Advisory
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Letter Title Banner */}
      <div className="text-center my-6">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-widest text-[#0B2545] font-sans">
          ENGAGEMENT LETTER
        </h2>
        <h3 className="text-sm sm:text-base font-bold text-blue-950 mt-1 font-serif">
          {isMultiService
            ? `Multi-Service Strategic Engagement (${activeServices.length} Advisory Streams)`
            : primaryService.serviceTitle}
        </h3>
      </div>

      {/* Metadata Bar */}
      <div className="flex justify-between items-center text-xs sm:text-sm bg-blue-50/60 border-y border-blue-200/80 px-4 py-2.5 mb-6 font-sans">
        <div>
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Ref: </span>
          <span className="font-mono text-[#0B2545] font-bold">{record.refNo}</span>
        </div>
        <div>
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Date: </span>
          <span className="text-[#0B2545] font-bold">{record.date}</span>
        </div>
      </div>

      {/* Addressee */}
      <div className="mb-6 leading-normal text-slate-800">
        <p className="font-semibold text-slate-600">To,</p>
        <p className="font-black text-slate-950 text-base">{client.addresseeName}</p>
        {client.designation && <p className="text-slate-700 font-medium">{client.designation}</p>}
        {client.companyName && <p className="text-[#0B2545] font-bold">{client.companyName}</p>}
        {client.billingAddress && (
          <div className="text-slate-700 whitespace-pre-line text-xs sm:text-[13px] mt-0.5">
            {client.billingAddress}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 text-xs mt-1 text-slate-600 font-mono">
          {client.state && <span>State: <strong className="text-slate-900">{client.state}</strong></span>}
          {client.gstin && <span>GSTIN: <strong className="text-slate-900">{client.gstin}</strong></span>}
          {client.email && <span>Email: <strong className="text-slate-900">{client.email}</strong></span>}
        </div>
      </div>

      {/* Salutation & Subject */}
      <div className="mb-5">
        <p className="font-medium text-slate-800">{client.salutation || 'Dear Sir'},</p>
        <div className="mt-3 p-3.5 bg-blue-50/80 border-l-4 border-[#0B2545] rounded-r text-[#0B2545] font-bold text-sm font-sans tracking-tight shadow-xs">
          Subject: {subjectLine}
        </div>
      </div>

      {/* Opening Paragraphs */}
      <div className="space-y-3 mb-6 text-justify text-slate-800 leading-relaxed">
        {primaryService.openingParagraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>

      {/* Section: Key Engagement Objectives (Rendered when objectives exist) */}
      {hasObjectives && objectivesSecNum && (
        <div className="mb-6">
          <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-3">
            {objectivesSecNum}. Key Engagement Objectives & Strategic Focus
          </h3>
          <div className="space-y-3">
            {activeServices.map((srv, sIdx) => {
              const includedObjs = (srv.objectives || []).filter((o) => o.include);
              if (includedObjs.length === 0) return null;
              return (
                <div key={srv.id || sIdx} className="space-y-1.5">
                  {isMultiService && (
                    <p className="font-bold text-[#0B2545] text-xs uppercase tracking-wider">
                      Module {sIdx + 1}: {srv.serviceTitle}
                    </p>
                  )}
                  <ul className="space-y-1.5 text-slate-800 text-xs sm:text-[13px]">
                    {includedObjs.map((obj) => (
                      <li key={obj.id} className="flex items-start gap-2">
                        <span className="text-blue-900 font-bold text-sm leading-none mt-0.5">•</span>
                        <span>{obj.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Service Overview Table (if multiple services selected) */}
      {isMultiService && overviewSecNum && (
        <div className="mb-6">
          <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-3">
            {overviewSecNum}. Executive Overview of Engaged Service Offerings
          </h3>
          <div className="overflow-x-auto border border-blue-200 rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B2545] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-blue-900 w-12 text-center">Ref</th>
                  <th className="py-2.5 px-3 border-r border-blue-900">Service Offering & Focus</th>
                  <th className="py-2.5 px-3 border-r border-blue-900 text-center w-28">Timeline</th>
                  <th className="py-2.5 px-3 text-right w-36">Investment (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 bg-white">
                {activeServices.map((srv, sIdx) => (
                  <tr key={srv.id || sIdx} className="hover:bg-blue-50/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-center border-r border-blue-100 text-[#0B2545]">
                      S-{sIdx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-blue-100">
                      <p className="font-bold text-slate-900">{srv.serviceTitle}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {srv.deliverables.filter((d) => d.include).length} key deliverables included
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-mono border-r border-blue-100">
                      {srv.projectTimeline || '3 to 4 Weeks'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0B2545]">
                      {formatIndianCurrency(srv.pricing.feeAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section: Engagement Deliverables & Workstreams */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-3">
          {scopeSecNum}. {isMultiService ? 'Itemized Scope of Work & Deliverables by Service Line' : 'Scope of Work & Deliverables'}
        </h3>
        
        <div className="space-y-5">
          {activeServices.map((srv, sIdx) => {
            const prefix = isMultiService ? `${scopeSecNum}.${sIdx + 1}` : scopeSecNum;
            // Dynamically number ONLY the selected/included deliverables
            const numberedDels = getNumberedDeliverables(
              srv.deliverables.filter((d) => d.include),
              prefix
            );

            return (
              <div key={srv.id || sIdx} className={isMultiService ? 'bg-slate-50/50 p-3.5 rounded-none border border-slate-200' : ''}>
                {isMultiService && (
                  <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                    <span className="bg-[#0B2545] text-white text-[10px] font-mono px-2 py-0.5 rounded-none font-bold">
                      Module {sIdx + 1}
                    </span>
                    <h4 className="font-black text-[#0B2545] text-sm font-sans">
                      {srv.serviceTitle}
                    </h4>
                  </div>
                )}
                
                <div className="space-y-3">
                  {numberedDels.map((d) => (
                    <div key={d.id} className="pl-3.5 border-l-2 border-blue-400 bg-white py-1">
                      <h5 className="font-bold text-[#0B2545] text-[13px] font-sans">
                        {d.formattedHeading}
                      </h5>
                      <p className="text-slate-700 mt-1 text-justify text-xs sm:text-[13px] leading-relaxed">
                        {d.body}
                      </p>
                      {d.subDeliverables && d.subDeliverables.length > 0 && (
                        <div className="mt-2 pl-3 border-l border-blue-200 space-y-1">
                          <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                            Key Sub-Deliverables & Milestones:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700">
                            {d.subDeliverables.map((sub) => (
                              <li key={sub.id}>
                                <span className="font-semibold text-slate-900">{sub.title}</span>
                                {sub.description && (
                                  <span className="text-slate-600"> — {sub.description}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Documentation & Information Required from Client */}
      {hasInfoRequired && infoSecNum && (
        <div className="mb-6">
          <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-3">
            {infoSecNum}. Information & Documentation Required from Client
          </h3>
          <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs sm:text-[13px]">
            <p className="text-slate-600 font-medium">
              To facilitate timely commencement and rigorous advisory assessment, the client is requested to make available the following operational and statutory records:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">
              {activeServices.flatMap((srv) => (srv.informationRequired || []).filter((i) => i.include)).map((info, idx) => (
                <li key={info.id || idx}>{info.text}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section: Project Timeline & Client Enablers */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-2.5">
          {timelineSecNum}. Project Delivery Timeline & Client Enablers
        </h3>
        <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-none text-xs sm:text-[13px] space-y-2">
          <p className="text-slate-900 font-medium">
            <span className="font-bold text-[#0B2545]">Expected Project Timeline: </span>
            The estimated duration for delivery of the engagement deliverables is{' '}
            <strong className="text-[#0B2545] font-bold underline decoration-blue-300">
              {expectedTimeline}
            </strong>{' '}
            from the date of realization of the mobilization advance and receipt of initial baseline documentation.
          </p>
          <p className="text-slate-700 leading-relaxed italic">
            <span className="font-bold text-slate-900 font-sans not-italic">Client Dependencies & Enablers: </span>
            {clientEnablersNote} Any delay in providing necessary operational records, statutory certifications, or management clarifications will result in a corresponding extension of the delivery schedule.
          </p>
        </div>
      </div>

      {/* Section: Commercial Proposal */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-2.5">
          {commercialSecNum}. Professional Investment & Commercial Schedule
        </h3>

        {/* Commercial breakdown table */}
        <div className="overflow-x-auto mb-3 border border-blue-200 rounded-none">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0B2545] text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3 border-r border-blue-900 w-10 text-center">#</th>
                <th className="py-2 px-3 border-r border-blue-900">Service Line / Description</th>
                <th className="py-2 px-3 border-r border-blue-900 text-center w-24">SAC Code</th>
                <th className="py-2 px-3 text-right w-36">Base Fee (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100 bg-white">
              {activeServices.map((srv, sIdx) => {
                const srvLineItems = srv.lineItems || srv.pricing?.lineItems || [];
                return (
                  <React.Fragment key={srv.id || sIdx}>
                    <tr className="hover:bg-blue-50/40">
                      <td className="py-2 px-3 font-mono font-bold text-center border-r border-blue-100 text-slate-600">
                        {sIdx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-blue-100">
                        <p className="font-bold text-slate-950">{srv.serviceTitle}</p>
                        <p className="text-[11px] text-slate-500">
                          {srvLineItems.length > 0
                            ? `Itemized Fee Structure (${srvLineItems.length} components)`
                            : 'Comprehensive advisory deliverable bundle'}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-700 border-r border-blue-100">
                        {isPersonalNonGst ? 'Non-GST' : (firm.sacCode || '998311')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                        {formatIndianCurrency(srv.pricing.feeAmount)}
                      </td>
                    </tr>
                    {/* Itemized Price Breakdown if present in template/service */}
                    {srvLineItems.length > 0 &&
                      srvLineItems.map((item, iIdx) => (
                        <tr key={item.id || iIdx} className="bg-slate-50/80 text-[11.5px] border-b border-slate-100">
                          <td className="py-1 px-3 border-r border-blue-100 text-center text-slate-400 font-mono text-[10px]">
                            {sIdx + 1}.{iIdx + 1}
                          </td>
                          <td className="py-1.5 px-3 border-r border-blue-100 pl-6">
                            <span className="font-semibold text-slate-800">{item.description}</span>
                            {item.unit && (
                              <span className="ml-2 text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                                {item.unit}
                              </span>
                            )}
                            {item.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[10px] border-r border-blue-100">
                            Breakup
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                            {formatIndianCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

              {/* Discount line (if applied) */}
              {discountAmount > 0 && (
                <tr className="bg-red-50/40 text-red-700">
                  <td colSpan={3} className="py-1.5 px-3 text-right font-medium italic border-r border-blue-100">
                    Less: Agreed Professional Fee Concession ({record.discountConfig?.type === 'percent' ? `${record.discountConfig.value}%` : 'Special Concession'}):
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-red-700">
                    - {formatIndianCurrency(discountAmount)}
                  </td>
                </tr>
              )}

              {/* Subtotal */}
              <tr className="bg-blue-50/40 font-bold">
                <td colSpan={3} className="py-2 px-3 text-right text-[#0B2545] border-r border-blue-100">
                  Taxable Base Professional Investment:
                </td>
                <td className="py-2 px-3 text-right font-mono text-[#0B2545]">
                  {formatIndianCurrency(taxableSubtotal)}
                </td>
              </tr>

              {/* GST lines */}
              {!isPersonalNonGst ? (
                isInterState ? (
                  <tr>
                    <td colSpan={3} className="py-1.5 px-3 text-right text-slate-600 border-r border-blue-100">
                      Add: Integrated GST (IGST) @ 18%:
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                      {formatIndianCurrency(igstAmount)}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-right text-slate-600 border-r border-blue-100">
                        Add: Central GST (CGST) @ 9%:
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                        {formatIndianCurrency(cgstAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-right text-slate-600 border-r border-blue-100">
                        Add: State GST (SGST) @ 9%:
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                        {formatIndianCurrency(sgstAmount)}
                      </td>
                    </tr>
                  </>
                )
              ) : (
                <tr>
                  <td colSpan={3} className="py-1.5 px-3 text-right text-slate-600 border-r border-blue-100">
                    GST Liability:
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800">
                    Nil (Non-GST Supply)
                  </td>
                </tr>
              )}

              {/* TDS Deduction Line (if enabled) */}
              {tdsAmount > 0 && (
                <tr className="bg-amber-50/40 text-amber-900">
                  <td colSpan={3} className="py-1.5 px-3 text-right font-medium italic border-r border-blue-100">
                    Less: Anticipated TDS under Section {record.tdsConfig?.section || '194J'} ({record.tdsConfig?.ratePercent}%):
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-900">
                    - {formatIndianCurrency(tdsAmount)}
                  </td>
                </tr>
              )}

              {/* Grand Total */}
              <tr className="bg-[#0B2545] text-white font-bold text-sm">
                <td colSpan={3} className="py-2.5 px-3 text-right tracking-wide uppercase">
                  TOTAL COMMERCIAL INVESTMENT (INCL. TAX):
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-amber-300">
                  {formatIndianCurrency(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-serif italic text-xs text-slate-700 mb-3">
          <strong>Amount in Words: </strong> {numberToIndianWords(grandTotal)}
        </p>

        {/* Milestone payment terms */}
        <div className="p-3 bg-blue-50/40 rounded-none border border-blue-200 text-xs mb-3">
          <p className="font-bold text-[#0B2545] uppercase text-[11px] tracking-wider mb-1">
            Milestone Remittance Structure:
          </p>
          {record.billingScheduleMilestones && record.billingScheduleMilestones.length > 0 ? (
            <div className="overflow-x-auto my-1.5">
              <table className="w-full text-[11.5px] border border-blue-200 bg-white">
                <thead className="bg-blue-100/60 text-[#0B2545] font-sans font-bold">
                  <tr>
                    <th className="py-1 px-2 text-left">Stage / Milestone</th>
                    <th className="py-1 px-2 text-center">Share</th>
                    <th className="py-1 px-2 text-right">Fee (Excl. Tax)</th>
                    <th className="py-1 px-2 text-left">Trigger Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {record.billingScheduleMilestones.map((m, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
                      <td className="py-1 px-2 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-1 px-2 text-center font-mono font-bold text-blue-900">{m.percent}%</td>
                      <td className="py-1 px-2 text-right font-mono font-semibold text-[#0B2545]">
                        {formatIndianCurrency(m.amount || Math.round((taxableSubtotal * m.percent) / 100))}
                      </td>
                      <td className="py-1 px-2 text-slate-600 italic text-[11px]">{m.trigger}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="list-disc pl-5 space-y-1.5 text-slate-800">
              {isCollectFullAtEnd ? (
                <li>
                  <span className="font-bold text-[#0B2545]">100% Full Professional Investment at Project Completion: </span>
                  {formatIndianCurrency(grandTotal)} ({isPersonalNonGst ? 'Non-GST' : 'incl. statutory GST'}) payable upon final deliverable completion and client walkthrough. Mobilization advance is waived (₹0 Advance).
                </li>
              ) : (
                <>
                  <li>
                    <span className="font-bold text-[#0B2545]">{advancePercent}% Mobilization Advance: </span>
                    {formatIndianCurrency(advanceTotal)} {isAdvanceGstExempt ? '(Exempt from GST on Advance)' : isPersonalNonGst ? '(Non-GST)' : '(incl. 18% GST)'} payable upon signing of this engagement charter.
                  </li>
                  <li>
                    <span className="font-bold text-[#0B2545]">{100 - advancePercent}% Balance Settlement: </span>
                    {formatIndianCurrency(balanceTotal)} {isAdvanceGstExempt ? `(incl. full statutory GST ₹${formatIndianCurrency(gstAmount).replace('₹', '')})` : isPersonalNonGst ? '(Non-GST)' : '(incl. tax)'} payable upon final delivery and client walkthrough.
                  </li>
                </>
              )}
            </ul>
          )}
        </div>

        {/* Bank Details & Remittance Box */}
        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-none font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2.5">
            <p className="font-bold text-[#0B2545] uppercase text-[10px] tracking-widest">
              Official Bank Remittance & Instant UPI Details
            </p>
            <span className="text-[10px] font-mono text-slate-500">Scan QR to pay instantly</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full space-y-1.5 text-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-bold text-slate-500 w-32 shrink-0">Account Holder:</span>
                <span className="font-semibold text-slate-900">{firm.bankDetails.accountHolderName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-bold text-slate-500 w-32 shrink-0">Bank & Branch:</span>
                <span className="font-semibold text-slate-900">{firm.bankDetails.bankNameBranch}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-bold text-slate-500 w-32 shrink-0">Account Number:</span>
                <span className="font-mono font-bold text-[#0B2545] text-sm">{firm.bankDetails.accountNumber}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-bold text-slate-500 w-32 shrink-0">IFSC Code:</span>
                <span className="font-mono font-bold text-[#0B2545] text-sm">{firm.bankDetails.ifscCode}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-bold text-slate-500 w-32 shrink-0">UPI ID:</span>
                <span className="font-mono font-semibold text-blue-900">{firm.bankDetails.upiId}</span>
              </div>
            </div>

            {/* Prominent Large QR Code */}
            <div className="shrink-0 flex flex-col items-center justify-center p-2 bg-white border border-slate-200 shadow-xs">
              <img
                src={activeQrCodeUrl}
                alt="Payment QR Code"
                className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] font-mono font-bold text-slate-600 mt-1 uppercase tracking-wider">
                Scan to Pay via UPI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Specific Conditions, Assumptions & Scope Boundaries */}
      <div className="mb-6">
        <h3 className="text-sm sm:text-base font-black text-[#0B2545] font-sans uppercase tracking-wider border-b border-blue-200 pb-1 mb-2.5">
          {assumptionsSecNum}. Specific Conditions & Scope Boundaries
        </h3>

        {/* Specific Conditions List */}
        {specificConditions.length > 0 ? (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-bold text-[#0B2545] uppercase tracking-wide">
              Specific Conditions & Operational Assumptions:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
              {specificConditions.map((cond, cIdx) => (
                <li key={cIdx} className="pl-1">
                  {cond}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="space-y-2 mb-3 text-justify text-xs sm:text-[13px] text-slate-700 leading-relaxed">
            <p>
              Our recommendations and strategic roadmaps are formulated based upon management representations, documented business records furnished by your team, and statutory notifications current as of the date of this engagement. Where government incentives, MSME schemes, or bank approvals are involved, final sanction and disbursement remain at the sole discretion of the respective sovereign committees.
            </p>
          </div>
        )}

        {/* Out of Scope / Exclusions (if any) */}
        {outOfScopeItems.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 text-xs sm:text-[13px] text-slate-800">
            <p className="font-bold text-amber-900 mb-1 uppercase text-[11px] tracking-wider">
              Specific Scope Exclusions (Out of Scope):
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {outOfScopeItems.map((ex, exIdx) => (
                <li key={exIdx}>{ex}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Standard Strategic Advisory Disclaimer */}
        <p className="text-slate-600 text-xs sm:text-[12px] mt-2.5 italic border-t border-slate-100 pt-2 leading-relaxed">
          Unless explicitly contracted under a separate statutory mandate, our work is strictly strategic management advisory, and does not constitute a statutory audit, legal advocacy, or litigation representation before appellate tribunals.
        </p>
      </div>

      {/* Counter-Signatory Block & Digital Verification */}
      <div className="mt-8 pt-5 border-t border-slate-200 text-xs sm:text-[13px]">
        <p className="text-slate-700 mb-5 leading-relaxed">
          We appreciate the opportunity to partner with your leadership team and look forward to delivering measurable strategic value to your enterprise.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
          {/* Firm Signatory */}
          <div className="relative">
            {/* Digital CA Seal / Stamp (when enabled) */}
            {(record.digitalSealConfig?.enabled || record.includeStamp) && (
              <div className="absolute -top-10 right-2 w-28 h-28 pointer-events-none select-none opacity-85 print:opacity-100 z-10">
                <svg viewBox="0 0 160 160" className="w-full h-full text-blue-900">
                  <circle cx="80" cy="80" r="74" fill="none" stroke="#0B2545" strokeWidth="2.5" />
                  <circle cx="80" cy="80" r="68" fill="none" stroke="#0B2545" strokeWidth="1" strokeDasharray="3 2" />
                  <path id="curveTopPreview" d="M 22,80 A 58,58 0 0,1 138,80" fill="none" />
                  <path id="curveBottomPreview" d="M 138,80 A 58,58 0 0,1 22,80" fill="none" />
                  <text className="text-[9.5px] font-sans font-black fill-[#0B2545] uppercase" letterSpacing="2">
                    <textPath href="#curveTopPreview" startOffset="50%" textAnchor="middle">
                      {firm.firmName.slice(0, 24).toUpperCase()}
                    </textPath>
                  </text>
                  <text className="text-[8px] font-sans font-bold fill-[#0B2545] uppercase" letterSpacing="1.2">
                    <textPath href="#curveBottomPreview" startOffset="50%" textAnchor="middle">
                      {record.digitalSealConfig?.firmFrn ? `FRN: ${record.digitalSealConfig.firmFrn}` : 'STRATEGIC ADVISORY'}
                    </textPath>
                  </text>
                  <circle cx="80" cy="80" r="32" fill="#EFF6FF" stroke="#0B2545" strokeWidth="1.2" />
                  <text x="80" y="76" textAnchor="middle" className="text-[11px] font-sans font-black fill-[#0B2545]">
                    SEAL
                  </text>
                  <text x="80" y="89" textAnchor="middle" className="text-[7.5px] font-sans font-bold fill-blue-800">
                    {record.digitalSealConfig?.membershipNumber ? `M.NO ${record.digitalSealConfig.membershipNumber}` : 'AUTHORIZED'}
                  </text>
                </svg>
              </div>
            )}

            <p className="text-slate-700 font-semibold mb-6">For {firm.firmName.toUpperCase()}</p>

            <div className="font-sans border-t border-slate-300 pt-2">
              <p className="font-black text-sm text-[#0B2545]">{activeSignatory.name}</p>
              <p className="text-slate-700 font-semibold text-xs">{activeSignatory.designation}</p>
              {activeSignatory.email && (
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">Email: {activeSignatory.email}</p>
              )}
              {activeSignatory.phone && (
                <p className="text-slate-500 font-mono text-[11px]">Phone: {activeSignatory.phone}</p>
              )}
            </div>
          </div>

          {/* Client Acceptance Block */}
          <div>
            <p className="text-slate-700 font-semibold mb-6">CONFIRMED & ACCEPTED FOR CLIENT:</p>
            <div className="font-sans border-t border-slate-300 pt-2">
              <p className="font-black text-sm text-[#0B2545]">{client.addresseeName}</p>
              <p className="text-slate-700 font-semibold text-xs">
                {client.companyName ? `${client.designation || 'Authorized Signatory'}, ${client.companyName}` : client.designation || 'Authorized Signatory'}
              </p>
              <p className="text-slate-400 text-[11px] mt-1 font-sans">Date: __________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
