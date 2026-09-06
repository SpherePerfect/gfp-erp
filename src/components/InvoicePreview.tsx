import React, { useState, useEffect } from 'react';
import { EngagementRecord, FirmProfile, ServiceTemplate } from '../types';
import { formatIndianCurrency, numberToIndianWords } from '../utils/numberToIndianWords';
import { Copy, Check, QrCode } from 'lucide-react';
import { generateQrCodeDataUrl } from '../utils/qrImageHelper';

interface InvoicePreviewProps {
  record: EngagementRecord;
  firm: FirmProfile;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ record, firm }) => {
  const { client } = record;
  const activeServices: ServiceTemplate[] =
    record.services && record.services.length > 0 ? record.services : [record.service];
  const primaryService = activeServices[0] || record.service;
  const [copiedUpi, setCopiedUpi] = useState(false);

  const isPersonalNonGst =
    record.invoiceIssuerType === 'personal' || record.isNonGstInvoice === true;

  // Resolve signatory or personal issuer
  const activeSignatory =
    record.signatory ||
    firm.signatories?.find((s) => s.isDefault) ||
    firm.signatories?.[0] || {
      id: 'default',
      name: firm.signatoryName || 'CA Yogesh Kulkarni',
      designation: firm.signatoryDesignation || 'Director / Authorised Signatory',
      email: firm.signatoryEmail || firm.firmEmail,
      phone: firm.signatoryPhone,
    };

  const personalIssuer = isPersonalNonGst
    ? record.personalIssuer || {
        name: activeSignatory.name || 'CA Yogesh Kulkarni',
        designation: 'Strategic & Financial Advisory Consultant',
        pan: firm.pan,
        email: activeSignatory.email || firm.firmEmail,
        phone: activeSignatory.phone || firm.firmPhone,
        address: firm.officeLocations,
      }
    : undefined;

  const totalBaseFee = activeServices.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0);

  // All defined milestones from schedule or paymentSplit
  const allMilestones =
    record.billingScheduleMilestones && record.billingScheduleMilestones.length > 0
      ? record.billingScheduleMilestones.map((m) => ({
          label: m.name,
          percent: m.percent,
          amount: m.amount || Math.round((totalBaseFee * m.percent) / 100),
          trigger: m.trigger,
          applyGst: m.applyGst !== false,
        }))
      : (primaryService.pricing.paymentSplit || []).map((s) => ({
          label: s.milestone,
          percent: s.percent,
          amount: Math.round((totalBaseFee * s.percent) / 100),
          trigger: s.stageNote || '',
          applyGst: s.applyGst !== false,
        }));

  let multiplier = 1.0;
  let milestoneDescription = 'Full Professional Fee';
  let milestoneApplyGst = true;

  if (
    record.selectedMilestoneIndex !== undefined &&
    record.selectedMilestoneIndex !== null &&
    record.selectedMilestoneIndex >= 0 &&
    record.selectedMilestoneIndex < allMilestones.length
  ) {
    const selected = allMilestones[record.selectedMilestoneIndex];
    multiplier = selected.percent / 100;
    milestoneDescription = `${selected.label} (${selected.percent}%)`;
    milestoneApplyGst = selected.applyGst !== false;
  } else if (record.invoiceMilestoneType === 'advance') {
    const adv =
      record.customAdvancePercent && record.customAdvancePercent > 0
        ? record.customAdvancePercent
        : primaryService.pricing.customAdvancePercent || (primaryService.pricing.paymentSplit?.[0]?.percent ?? 50);
    multiplier = adv / 100;
    milestoneDescription = `${adv}% Mobilization Advance`;
    milestoneApplyGst = allMilestones[0]?.applyGst !== false;
  } else if (record.invoiceMilestoneType === 'balance') {
    const adv =
      record.customAdvancePercent && record.customAdvancePercent > 0
        ? record.customAdvancePercent
        : primaryService.pricing.customAdvancePercent || (primaryService.pricing.paymentSplit?.[0]?.percent ?? 50);
    multiplier = (100 - adv) / 100;
    milestoneDescription = `${100 - adv}% Balance Completion Milestone`;
    milestoneApplyGst = allMilestones[allMilestones.length - 1]?.applyGst !== false;
  } else if (record.invoiceMilestoneType === 'custom') {
    if (record.customInvoicePercent && record.customInvoicePercent > 0) {
      multiplier = record.customInvoicePercent / 100;
      milestoneDescription = record.customMilestoneLabel || `${record.customInvoicePercent}% Custom Milestone`;
    } else if (record.customInvoiceAmount && record.customInvoiceAmount > 0) {
      multiplier = record.customInvoiceAmount / (totalBaseFee || 1);
      milestoneDescription = record.customMilestoneLabel || 'Agreed Custom Milestone';
    }
  }

  const baseAmount = totalBaseFee * multiplier;
  const isInterState =
    client.state &&
    firm.registeredState &&
    client.state.trim().toLowerCase() !== firm.registeredState.trim().toLowerCase();

  // Support per-milestone GST & advance exempt GST: if personal non-GST OR milestone has applyGst === false OR (record.advanceExemptGst for advance), GST is 0%
  const isAdvanceInvoice = record.invoiceMilestoneType === 'advance' || !record.invoiceMilestoneType;
  const isAdvanceGstExempt = Boolean(record.advanceExemptGst) && isAdvanceInvoice;
  const shouldChargeGst = !isPersonalNonGst && milestoneApplyGst && !isAdvanceGstExempt;
  const gstPercent = shouldChargeGst ? 18 : 0;
  const totalGstAmount = shouldChargeGst ? Math.round((baseAmount * gstPercent) / 100) : 0;
  const cgstAmount = shouldChargeGst && !isInterState ? Math.round(totalGstAmount / 2) : 0;
  const sgstAmount = shouldChargeGst && !isInterState ? Math.round(totalGstAmount / 2) : 0;
  const igstAmount = shouldChargeGst && isInterState ? totalGstAmount : 0;
  const grossTotal = baseAmount + totalGstAmount;

  // TDS under Section 194J
  let tdsAmount = 0;
  if (record.tdsConfig?.enabled && record.tdsConfig.ratePercent > 0) {
    tdsAmount = Math.round((baseAmount * record.tdsConfig.ratePercent) / 100);
  }
  const netPayable = grossTotal - tdsAmount;

  const logoPosition = firm.logoPosition || firm.themeSettings?.logoPosition || 'left';
  const upiId = firm.bankDetails.upiId || 'audit@gfpconsulting.in';
  const upiPayLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(firm.bankDetails.accountHolderName)}&am=${Math.round(grossTotal)}&cu=INR&tn=${encodeURIComponent(record.invoiceNo)}`;

  // Priority: record.qrCodeDataUrl > firm.qrCodeDataUrl > firm.bankDetails.qrCodeDataUrl
  const customQrImage = record.qrCodeDataUrl || firm.qrCodeDataUrl || firm.bankDetails.qrCodeDataUrl;
  const [offlineQrUrl, setOfflineQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!customQrImage && upiPayLink) {
      generateQrCodeDataUrl(upiPayLink, { width: 220, margin: 1 }).then((dataUrl) => {
        if (isMounted && dataUrl) {
          setOfflineQrUrl(dataUrl);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [customQrImage, upiPayLink]);

  const activeQrSrc =
    customQrImage ||
    offlineQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiPayLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div
      id="printable-proforma-invoice"
      className="bg-white text-slate-900 shadow-xl border border-blue-100 rounded-none p-8 sm:p-12 font-sans text-xs sm:text-[13px] leading-relaxed max-w-[860px] mx-auto print:shadow-none print:border-none print:p-0 print:m-0"
    >
      {/* Executive Letterhead - Left Text & Right Logo */}
      <div className="pb-4 border-b-2 border-[#0B2545] mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Firm or Personal Details */}
        <div className="text-left flex-1 min-w-0">
          {isPersonalNonGst && personalIssuer ? (
            <>
              <div className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider mb-1">
                Non-GST / Personal Advisory Invoice
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0B2545] uppercase">
                {personalIssuer.name}
              </h1>
              <p className="text-xs sm:text-sm italic text-blue-900 font-serif mt-0.5">
                {personalIssuer.designation || 'Strategic Management Advisory Consultant'}
              </p>
              <p className="text-xs text-slate-600 tracking-wide mt-1 font-medium">
                {personalIssuer.address || firm.officeLocations}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-600 mt-1">
                {personalIssuer.pan && (
                  <>
                    <span>
                      PAN: <strong className="text-[#0B2545] font-semibold">{personalIssuer.pan}</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                  </>
                )}
                <span className="text-slate-600">
                  Status: <strong className="text-[#0B2545] font-semibold">Individual Advisory Consultant / Non-GST</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-600 mt-0.5">
                {personalIssuer.email && (
                  <span>
                    Email: <strong className="text-[#0B2545] font-semibold">{personalIssuer.email}</strong>
                  </span>
                )}
                {personalIssuer.phone && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>
                      Phone: <strong className="text-[#0B2545] font-semibold">{personalIssuer.phone}</strong>
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0B2545] uppercase">
                {firm.firmName}
              </h1>
              {firm.tagline && !firm.tagline.toLowerCase().includes('financial services') && (
                <p className="text-xs sm:text-sm italic text-blue-900 font-serif mt-0.5">
                  {firm.tagline}
                </p>
              )}
              <p className="text-xs text-slate-600 tracking-wide mt-1 font-medium">{firm.officeLocations}</p>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-600 mt-1">
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
              </div>
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
            </>
          )}
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

      {/* Invoice Title */}
      <div className="text-center my-4">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#0B2545]">
          {isPersonalNonGst ? 'BILL OF SUPPLY / PRO-FORMA INVOICE' : 'PRO-FORMA INVOICE'}
        </h2>
        <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-0.5">
          {isPersonalNonGst
            ? '(Issued in Personal/Professional Capacity – Non-GST Exempt)'
            : '(For Milestone / Mobilization Advance Payment)'}
        </p>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/60 p-3.5 rounded-none border border-blue-200 mb-5">
        <div className="space-y-1">
          <p>
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Invoice No:</span>{' '}
            <span className="font-mono font-black text-[#0B2545] text-sm ml-1">{record.invoiceNo}</span>
          </p>
          <p>
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Engagement Ref:</span>{' '}
            <span className="font-mono font-bold text-slate-900 ml-1">{record.refNo}</span>
          </p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p>
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Invoice Date:</span>{' '}
            <span className="font-bold text-slate-900 ml-1">{record.date}</span>
          </p>
          <p>
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Place of Supply:</span>{' '}
            <span className="font-bold text-[#0B2545] ml-1">
              {isPersonalNonGst
                ? `${client.state || 'Maharashtra'} (Non-GST Supply)`
                : `${client.state || firm.registeredState} (${isInterState ? 'Inter-State IGST' : 'Intra-State CGST+SGST'})`}
            </span>
          </p>
        </div>
      </div>

      {/* Bill To Block */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-none mb-5">
        <h3 className="font-black text-[#0B2545] text-[11px] uppercase tracking-wider mb-2">
          BILL TO (CLIENT DETAILS):
        </h3>
        <div className="text-slate-800 space-y-0.5">
          <p className="font-black text-sm text-slate-950">
            {client.addresseeName}
            {client.companyName ? ` (${client.companyName})` : ''}
          </p>
          {client.designation && <p className="text-xs text-slate-600 font-medium">{client.designation}</p>}
          {client.billingAddress && (
            <p className="whitespace-pre-line text-slate-700 text-xs font-medium">{client.billingAddress}</p>
          )}
          <div className="flex flex-wrap gap-x-4 pt-1 font-mono text-xs text-slate-700">
            {client.state && (
              <span>
                State: <strong className="text-slate-900">{client.state}</strong>
              </span>
            )}
            {client.gstin && (
              <span>
                GSTIN: <strong className="text-[#0B2545] font-bold">{client.gstin}</strong>
              </span>
            )}
            {client.pan && (
              <span>
                PAN: <strong className="text-slate-900">{client.pan}</strong>
              </span>
            )}
            {client.email && (
              <span>
                Email: <strong className="text-slate-900">{client.email}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Line Item Table */}
      <div className="overflow-x-auto mb-5 border border-slate-200 rounded-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0B2545] text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 border-r border-blue-900 w-10 text-center">#</th>
              <th className="py-2.5 px-3 border-r border-blue-900">Description of Service & Milestone</th>
              <th className="py-2.5 px-3 border-r border-blue-900 text-center w-24">
                {isPersonalNonGst ? 'Type' : 'SAC Code'}
              </th>
              <th className="py-2.5 px-3 text-right w-36">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {activeServices.map((srv, sIdx) => {
              const itemFee = (srv.pricing?.feeAmount || 0) * multiplier;
              return (
                <tr key={srv.id || sIdx} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-center font-bold text-slate-600 border-r border-slate-200">
                    {sIdx + 1}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200">
                    <p className="font-bold text-slate-950">{srv.serviceTitle}</p>
                    <p className="text-xs text-blue-900 mt-0.5 font-medium">Milestone: {milestoneDescription}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">As per Engagement Charter Ref: {record.refNo}</p>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700 border-r border-slate-200">
                    {isPersonalNonGst ? 'Advisory' : (firm.sacCode || '998311')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                    {formatIndianCurrency(itemFee)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Totals & Calculations */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5 items-start">
        {/* Left: Amount in words */}
        <div className="sm:col-span-7 bg-blue-50/50 p-3.5 rounded-none border border-blue-200 text-xs">
          <p className="font-bold text-[#0B2545] uppercase text-[10px] tracking-wider mb-1">
            Total In Words:
          </p>
          <p className="font-serif italic text-slate-900 font-semibold leading-normal">
            INR {numberToIndianWords(Math.round(grossTotal))} Only
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            {isPersonalNonGst
              ? 'Non-GST Supply: Issued in personal professional capacity under composition/threshold exemption.'
              : isInterState
              ? 'Tax Category: Inter-State Supply subject to Integrated Goods and Services Tax (IGST @ 18%)'
              : 'Tax Category: Intra-State Supply subject to Central GST (CGST @ 9%) and State GST (SGST @ 9%)'}
          </p>
        </div>

        {/* Right: Calculations breakdown */}
        <div className="sm:col-span-5 bg-slate-50 p-3.5 rounded-none border border-slate-200 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-700">
            <span>Taxable Amount:</span>
            <span className="font-bold">{formatIndianCurrency(baseAmount)}</span>
          </div>

          {isPersonalNonGst ? (
            <div className="flex justify-between text-slate-500 italic">
              <span>GST Rate (0% - Non-GST):</span>
              <span>₹0.00</span>
            </div>
          ) : isInterState ? (
            <div className="flex justify-between text-slate-700">
              <span>IGST ({gstPercent}%):</span>
              <span className="font-bold">{formatIndianCurrency(igstAmount)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-700">
                <span>CGST ({gstPercent / 2}%):</span>
                <span className="font-bold">{formatIndianCurrency(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>SGST ({gstPercent / 2}%):</span>
                <span className="font-bold">{formatIndianCurrency(sgstAmount)}</span>
              </div>
            </>
          )}

          <div className="border-t border-slate-300 pt-1.5 flex justify-between text-xs font-bold text-slate-800">
            <span>Gross Total:</span>
            <span>{formatIndianCurrency(grossTotal)}</span>
          </div>

          {/* TDS deduction note if applicable */}
          {tdsAmount > 0 && (
            <div className="flex justify-between text-amber-900 font-semibold text-xs">
              <span>Less: TDS Sec {record.tdsConfig?.section || '194J'} ({record.tdsConfig?.ratePercent}%):</span>
              <span>- {formatIndianCurrency(tdsAmount)}</span>
            </div>
          )}

          <div className="border-t-2 border-[#0B2545] pt-1.5 flex justify-between text-sm font-black text-[#0B2545]">
            <span>Net Amount Payable:</span>
            <span className="text-emerald-900">{formatIndianCurrency(netPayable)}</span>
          </div>
        </div>
      </div>

      {/* Banking & Instant UPI QR Remittance Block */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-none mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs flex-1">
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px] tracking-widest mb-1.5">
              OFFICIAL BANK DETAILS FOR REMITTANCE
            </h4>
            <p>
              <span className="font-bold text-slate-500">Beneficiary:</span>{' '}
              <span className="font-medium text-slate-900">
                {isPersonalNonGst ? personalIssuer?.name || firm.bankDetails.accountHolderName : firm.bankDetails.accountHolderName}
              </span>
            </p>
            <p>
              <span className="font-bold text-slate-500">Bank & Branch:</span>{' '}
              <span className="font-medium text-slate-900">{firm.bankDetails.bankNameBranch}</span>
            </p>
            <p>
              <span className="font-bold text-slate-500">Account Number:</span>{' '}
              <span className="font-mono font-black text-[#0B2545]">{firm.bankDetails.accountNumber}</span>
            </p>
            <p>
              <span className="font-bold text-slate-500">IFSC Code:</span>{' '}
              <span className="font-mono font-black text-[#0B2545]">{firm.bankDetails.ifscCode}</span>
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-bold text-slate-500">UPI ID:</span>{' '}
              <span className="font-mono font-medium text-blue-900">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-none transition font-sans print:hidden"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedUpi ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Payment QR Code (Custom Uploaded Photo or Dynamic UPI QR) */}
          <div className="bg-white p-2 rounded-none border border-blue-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <img
              src={activeQrSrc}
              alt="Scan to Pay via UPI or Bank QR"
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-bold text-[#0B2545] mt-1.5 flex items-center gap-1 text-center">
              <QrCode className="w-3.5 h-3.5" />
              <span>{customQrImage ? 'Scan & Pay QR' : 'Scan & Pay via UPI'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Signature & Auth Box with optional stamp */}
      <div className="flex justify-between items-end pt-4 border-t border-slate-200">
        <div className="text-[11px] text-slate-500 font-sans space-y-0.5 max-w-sm">
          <p>
            • {isPersonalNonGst
              ? 'This is a Bill of Supply / Pro-Forma Invoice issued in individual capacity.'
              : 'This is a computer-generated Pro-Forma Invoice for advance mobilization payment.'}
          </p>
          <p>
            • {isPersonalNonGst
              ? 'No Goods & Services Tax (GST) is charged under applicable threshold exemptions.'
              : 'A final Tax Invoice with GST acknowledgment will be issued upon receipt of payment.'}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider mb-8">
            {isPersonalNonGst
              ? 'For INDIVIDUAL ADVISORY PRACTICE'
              : `For ${firm.firmName}`}
          </p>
          <div className="border-t border-slate-300 pt-1">
            <p className="font-black text-xs text-[#0B2545]">
              {isPersonalNonGst ? (personalIssuer?.name || activeSignatory.name) : activeSignatory.name}
            </p>
            <p className="text-[11px] text-slate-600">
              {isPersonalNonGst
                ? (personalIssuer?.designation || 'Strategic & Financial Consultant')
                : activeSignatory.designation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
