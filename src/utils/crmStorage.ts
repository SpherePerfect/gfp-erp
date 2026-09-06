import { CrmClientRecord, EngagementRecord, SubDeliverable } from '../types';

const CRM_STORAGE_KEY = 'gfp_marketing_crm_records_v1';

// Format Indian phone number into clean WhatsApp link
export function formatCleanWhatsAppLink(phone: string, clientName: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Standard Indian 10 digits or 91 prefixed
  let cleanNumber = digits;
  if (digits.length === 10) {
    cleanNumber = '91' + digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    cleanNumber = digits;
  }
  if (!cleanNumber) return '';
  const message = encodeURIComponent(`Hello ${clientName}, following up regarding your advisory assignment with GFP Advisory.`);
  return `https://wa.me/${cleanNumber}?text=${message}`;
}

// Parse string date formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[/-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

// Automatically calculate Turnaround Time (TAT in Days)
export function autoCalculateTatDays(startDateStr: string, deliveryDateStr: string): number {
  const start = parseDate(startDateStr);
  const delivery = parseDate(deliveryDateStr);
  if (!start || !delivery) return 0;
  
  const diffMs = delivery.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Auto-calculate post delivery commercial
export function autoCalculatePostDelivery(total: number, advance: number): number {
  const t = Number(total) || 0;
  const a = Number(advance) || 0;
  return Math.max(0, t - a);
}

// Get standard timestamp e.g. "05/09/2026, 04:30 PM"
export function getFormattedNow(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
}

// Default rich sample dataset matching all 34 columns from the uploaded spreadsheet
export const initialSampleCrmRecords: CrmClientRecord[] = [
  {
    id: 'crm-001',
    srNo: 1,
    clientName: 'TechVision AI Solutions Pvt Ltd',
    contactPerson: 'Mr. Rajesh Mehta',
    cellNumber: '+91 98230 45678',
    email: 'rajesh.mehta@techvisionai.in',
    location: 'Pune, Maharashtra',
    businessDetails: 'B2B Enterprise AI Workflow SaaS (Seed funded, raising Series A)',
    leadGeneratedBy: 'Referral - CA Kulkarni',
    leadGenerationDate: '15/08/2026',
    natureOfDeliverable: 'Financial Modeling & Valuation',
    natureOfSubDeliverable: '5-Year Dynamic Projections, DCF Valuation & Cap Table Modeling',
    assignmentStatus: 'Execution & Modeling',
    priority: 'Urgent',
    owner: 'CA Yogesh Kulkarni',
    whatsappGroupCreated: 'Yes',
    elNumber: 'GFP/FM-EL/816/2026',
    elStatus: 'Signed',
    elStartDate: '02/09/2026',
    reportDeliveryDate: '23/09/2026',
    consultingDate: '25/09/2026',
    tatDays: 21,
    nextAction: 'Reconcile FY26 customer ARR cohorts with founders on Zoom',
    totalCommercial: 125000,
    advanceAmount: 62500,
    advanceReceiptStatus: 'Received',
    postDeliveryCommercial: 62500,
    postDeliveryReceiptStatus: 'Not Due Yet',
    invoiceValue: 62500,
    invoiceDate: '02/09/2026',
    postCompletionPotential: 'Virtual CFO Retainer (₹1.25L / month)',
    postCompletionStatus: 'In Discussion',
    remarks: 'High quality founder team ex-IIT/IIM; term sheet expected in Q3',
    finalStatus: 'Active / In Progress',
    updatedAt: '05/09/2026, 11:30 AM',
    engagementId: 'eng-techvision-2026',
  },
  {
    id: 'crm-002',
    srNo: 2,
    clientName: 'Apex Health Diagnostics LLP',
    contactPerson: 'Dr. Ananya Sen',
    cellNumber: '+91 98811 77654',
    email: 'ananya.sen@apexhealth.in',
    location: 'Kalyani Nagar, Pune',
    businessDetails: 'Chain of 14 pathology & diagnostic imaging centers in Western India',
    leadGeneratedBy: 'Website Inbound Lead',
    leadGenerationDate: '20/08/2026',
    natureOfDeliverable: 'Direct Tax Assessment & Advisory',
    natureOfSubDeliverable: 'Section 148 Reassessment Submission & Appellate Representation',
    assignmentStatus: 'Data Collection',
    priority: 'High',
    owner: 'CA Yogesh Kulkarni',
    whatsappGroupCreated: 'Yes',
    elNumber: 'GFP/TAX-EL/817/2026',
    elStatus: 'Signed',
    elStartDate: '01/09/2026',
    reportDeliveryDate: '15/09/2026',
    consultingDate: '18/09/2026',
    tatDays: 14,
    nextAction: 'Collect certified trial balances and vendor ledger confirmations',
    totalCommercial: 60000,
    advanceAmount: 30000,
    advanceReceiptStatus: 'Received',
    postDeliveryCommercial: 30000,
    postDeliveryReceiptStatus: 'Pending',
    invoiceValue: 30000,
    invoiceDate: '01/09/2026',
    postCompletionPotential: 'Quarterly Corporate Tax & GST Compliance Retainer',
    postCompletionStatus: 'Pitched',
    remarks: 'Statutory deadline on 30th Sept; priority filing',
    finalStatus: 'Active / In Progress',
    updatedAt: '04/09/2026, 03:45 PM',
    engagementId: 'eng-apex-consulting-2026',
  },
  {
    id: 'crm-003',
    srNo: 3,
    clientName: 'Bharat Infra Logistics Ltd',
    contactPerson: 'Mr. Vikram Singhania',
    cellNumber: '+91 98190 22345',
    email: 'vikram.singhania@bharatinfra.com',
    location: 'BKC, Mumbai',
    businessDetails: 'Integrated Cold Chain & Warehousing infrastructure (₹120 Cr topline)',
    leadGeneratedBy: 'Direct Partner Pitch',
    leadGenerationDate: '10/08/2026',
    natureOfDeliverable: 'M&A Due Diligence & Valuation',
    natureOfSubDeliverable: 'Buy-side Financial & Tax Due Diligence for acquisition target',
    assignmentStatus: 'Proposal / EL Sent',
    priority: 'Urgent',
    owner: 'CA Yogesh Kulkarni',
    whatsappGroupCreated: 'Pending',
    elNumber: 'GFP/VAL-EL/818/2026',
    elStatus: 'Sent',
    elStartDate: '08/09/2026',
    reportDeliveryDate: '08/10/2026',
    consultingDate: '12/10/2026',
    tatDays: 30,
    nextAction: 'Finalize negotiation on payment terms (50% adv vs 30% adv)',
    totalCommercial: 350000,
    advanceAmount: 175000,
    advanceReceiptStatus: 'Pending',
    postDeliveryCommercial: 175000,
    postDeliveryReceiptStatus: 'Not Due Yet',
    invoiceValue: 0,
    invoiceDate: '',
    postCompletionPotential: 'Transaction Advisory & Integration Audit (₹5L+)',
    postCompletionStatus: 'In Discussion',
    remarks: 'Target company books being audited; closing deal by Diwali',
    finalStatus: 'Active / In Progress',
    updatedAt: '05/09/2026, 09:15 AM',
  },
  {
    id: 'crm-004',
    srNo: 4,
    clientName: 'Zenith D2C Wellness Brands',
    contactPerson: 'Ms. Pooja Deshmukh',
    cellNumber: '+91 97665 11223',
    email: 'pooja@zenithwellness.in',
    location: 'Bengaluru, Karnataka',
    businessDetails: 'Clean-label organic nutraceutical D2C brand on Shopify & QuickCommerce',
    leadGeneratedBy: 'LinkedIn Founder Outreach',
    leadGenerationDate: '25/07/2026',
    natureOfDeliverable: 'Virtual CFO Advisory',
    natureOfSubDeliverable: 'Unit Economics Dashboard, Inventory Working Capital & Cash Runway Model',
    assignmentStatus: 'Final Report Delivered',
    priority: 'Medium',
    owner: 'Pratik Kulkarni',
    whatsappGroupCreated: 'Yes',
    elNumber: 'GFP/CFO-EL/814/2026',
    elStatus: 'Signed',
    elStartDate: '01/08/2026',
    reportDeliveryDate: '21/08/2026',
    consultingDate: '25/08/2026',
    tatDays: 20,
    nextAction: 'Quarterly review presentation scheduled with board on 15th Sep',
    totalCommercial: 95000,
    advanceAmount: 47500,
    advanceReceiptStatus: 'Received',
    postDeliveryCommercial: 47500,
    postDeliveryReceiptStatus: 'Fully Received',
    invoiceValue: 95000,
    invoiceDate: '26/08/2026',
    postCompletionPotential: 'Annual Virtual CFO Retainer (₹75k/mo)',
    postCompletionStatus: 'Closed Won',
    remarks: 'Successfully converted to ongoing retainer agreement starting Oct 2026',
    finalStatus: 'Converted to Retainer',
    updatedAt: '03/09/2026, 05:20 PM',
  },
  {
    id: 'crm-005',
    srNo: 5,
    clientName: 'Sahyadri Agri Biotech Pvt Ltd',
    contactPerson: 'Mr. Rameshwar Patil',
    cellNumber: '+91 94220 88990',
    email: 'rpatil@sahyadriagri.com',
    location: 'Nashik, Maharashtra',
    businessDetails: 'Hybrid bio-fertilizer manufacturing & agricultural export firm',
    leadGeneratedBy: 'Referral - Banking Partner',
    leadGenerationDate: '28/08/2026',
    natureOfDeliverable: 'Business Valuation & Pitch Deck',
    natureOfSubDeliverable: 'Valuation under Rule 11UA (Income Tax) & Fair Market Value for Angel Tax',
    assignmentStatus: 'In Discussion',
    priority: 'High',
    owner: 'CA Yogesh Kulkarni',
    whatsappGroupCreated: 'No',
    elNumber: 'GFP/VAL-EL/819/2026',
    elStatus: 'Draft',
    elStartDate: '10/09/2026',
    reportDeliveryDate: '22/09/2026',
    consultingDate: '24/09/2026',
    tatDays: 12,
    nextAction: 'Send revised draft engagement letter with updated scope by today EOD',
    totalCommercial: 80000,
    advanceAmount: 40000,
    advanceReceiptStatus: 'Pending',
    postDeliveryCommercial: 40000,
    postDeliveryReceiptStatus: 'Not Due Yet',
    invoiceValue: 0,
    invoiceDate: '',
    postCompletionPotential: 'Annual Merchant Banker Certification & MCA Filings',
    postCompletionStatus: 'Pending Completion',
    remarks: 'Client is preparing to issue shares at premium to HNIs',
    finalStatus: 'Active / In Progress',
    updatedAt: '05/09/2026, 01:10 PM',
  },
];

// Load CRM Records from LocalStorage
export function getStoredCrmRecords(): CrmClientRecord[] {
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          ...item,
          srNo: item.srNo || idx + 1,
          whatsappLink: formatCleanWhatsAppLink(item.cellNumber, item.clientName),
        }));
      }
    }
  } catch (e) {
    console.error('Error reading CRM records from storage', e);
  }
  return initialSampleCrmRecords.map((item, idx) => ({
    ...item,
    srNo: idx + 1,
    whatsappLink: formatCleanWhatsAppLink(item.cellNumber, item.clientName),
  }));
}

// Save CRM Records to LocalStorage
export function saveCrmRecords(records: CrmClientRecord[]): void {
  try {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving CRM records to storage', e);
  }
}

// Auto-sync engagements with CRM leads so that any created engagement automatically appears in CRM
export function syncEngagementsWithCrm(
  engagements: EngagementRecord[],
  currentCrmRecords: CrmClientRecord[]
): CrmClientRecord[] {
  const updatedRecords = [...currentCrmRecords];
  let hasChanges = false;

  engagements.forEach((eng) => {
    // Check if matching CRM record exists by engagementId or elNumber
    const existingIndex = updatedRecords.findIndex(
      (c) => c.engagementId === eng.id || (eng.refNo && c.elNumber === eng.refNo)
    );

    // Extract subDeliverables from engagement deliverables across services
    const extractedSubs: SubDeliverable[] = [];
    const servicesList = eng.services && eng.services.length > 0 ? eng.services : [eng.service];
    servicesList.forEach((srv) => {
      (srv?.deliverables || []).forEach((d) => {
        if (d.subDeliverables && d.subDeliverables.length > 0) {
          extractedSubs.push(...d.subDeliverables);
        }
      });
    });

    const feeAmount = eng.service.pricing.feeAmount || 0;
    const advancePercent = eng.service.pricing.customAdvancePercent ?? 50;
    const advanceAmount = Math.round((feeAmount * advancePercent) / 100);
    const postDelivery = autoCalculatePostDelivery(feeAmount, advanceAmount);

    let advanceStatus: CrmClientRecord['advanceReceiptStatus'] = 'Pending';
    if (eng.status === 'approved' || eng.status === 'invoiced' || eng.status === 'completed') {
      advanceStatus = 'Received';
    }

    let elStatusVal: CrmClientRecord['elStatus'] = 'Draft';
    if (eng.status === 'letter_sent') elStatusVal = 'Sent';
    if (eng.status === 'approved' || eng.status === 'invoiced' || eng.status === 'completed') {
      elStatusVal = 'Signed';
    }

    let assignmentStatusVal: CrmClientRecord['assignmentStatus'] = 'Proposal / EL Sent';
    if (eng.status === 'draft') assignmentStatusVal = 'In Discussion';
    if (eng.status === 'approved') assignmentStatusVal = 'Execution & Modeling';
    if (eng.status === 'invoiced') assignmentStatusVal = 'Final Report Delivered';
    if (eng.status === 'completed') assignmentStatusVal = 'Closed / Billed';

    if (existingIndex >= 0) {
      // Update link & relevant synced fields if missing or changed
      const existing = updatedRecords[existingIndex];
      const hasSubDeliverableUpdates =
        extractedSubs.length > 0 &&
        JSON.stringify(existing.subDeliverablesList || []) !== JSON.stringify(extractedSubs);

      const needsUpdate =
        !existing.engagementId ||
        existing.elNumber !== eng.refNo ||
        (existing.totalCommercial === 0 && feeAmount > 0) ||
        hasSubDeliverableUpdates;

      if (needsUpdate) {
        hasChanges = true;
        const mergedSubs = hasSubDeliverableUpdates
          ? extractedSubs
          : existing.subDeliverablesList || [];

        updatedRecords[existingIndex] = {
          ...existing,
          engagementId: eng.id,
          elNumber: eng.refNo || existing.elNumber,
          elStatus: elStatusVal,
          subDeliverablesList: mergedSubs,
          natureOfSubDeliverable:
            existing.natureOfSubDeliverable ||
            (mergedSubs.length > 0 ? mergedSubs.map((s) => s.title).join(', ') : ''),
          totalCommercial: existing.totalCommercial || feeAmount,
          advanceAmount: existing.advanceAmount || advanceAmount,
          postDeliveryCommercial: autoCalculatePostDelivery(
            existing.totalCommercial || feeAmount,
            existing.advanceAmount || advanceAmount
          ),
          updatedAt: getFormattedNow(),
        };
      }
    } else {
      // Create new CRM record from Engagement
      hasChanges = true;
      const newSrNo = updatedRecords.length + 1;
      const clientName = eng.client.companyName || eng.client.addresseeName || 'New Client';
      const cellNumber = eng.client.phone || '';

      const newRecord: CrmClientRecord = {
        id: `crm-synced-${eng.id}`,
        srNo: newSrNo,
        clientName,
        contactPerson: eng.client.addresseeName || '',
        cellNumber,
        email: eng.client.email || '',
        location: eng.client.state || 'Maharashtra',
        businessDetails: `${eng.client.businessEntityType || 'Enterprise'} (${eng.client.state})`,
        leadGeneratedBy: 'Engagement Generator',
        leadGenerationDate: eng.date || getFormattedNow().split(',')[0],
        natureOfDeliverable: eng.service.serviceTitle || 'Strategic Advisory',
        natureOfSubDeliverable:
          extractedSubs.length > 0
            ? extractedSubs.map((s) => s.title).join(', ')
            : eng.service.subjectLine || 'Advisory Deliverables',
        subDeliverablesList: extractedSubs,
        assignmentStatus: assignmentStatusVal,
        priority: 'High',
        owner: eng.createdBy || 'CA Yogesh Kulkarni',
        whatsappGroupCreated: 'Pending',
        elNumber: eng.refNo,
        elStatus: elStatusVal,
        elStartDate: eng.date || '',
        reportDeliveryDate: '',
        consultingDate: '',
        tatDays: 14,
        nextAction: 'Review engagement requirements with client team',
        totalCommercial: feeAmount,
        advanceAmount,
        advanceReceiptStatus: advanceStatus,
        postDeliveryCommercial: postDelivery,
        postDeliveryReceiptStatus: 'Not Due Yet',
        invoiceValue: eng.status === 'invoiced' ? advanceAmount : 0,
        invoiceDate: eng.status === 'invoiced' ? eng.date : '',
        postCompletionPotential: 'Advisory Retainer',
        postCompletionStatus: 'Pending Completion',
        remarks: eng.notes || 'Imported from engagement database',
        finalStatus: eng.status === 'completed' ? 'Successfully Completed' : 'Active / In Progress',
        updatedAt: getFormattedNow(),
        engagementId: eng.id,
        whatsappLink: formatCleanWhatsAppLink(cellNumber, clientName),
      };

      updatedRecords.push(newRecord);
    }
  });

  if (hasChanges) {
    saveCrmRecords(updatedRecords);
  }

  return updatedRecords;
}

// Export CRM Records to clean CSV spreadsheet
export function exportCrmRecordsToCsv(records: CrmClientRecord[]): void {
  const headers = [
    'Sr. No',
    'Lead / Client Name',
    'Contact Person',
    'Cell Number',
    'Email Address',
    'Client Location',
    'Business Details',
    'Lead Generated By',
    'Lead Generation Date',
    'Nature of Deliverable',
    'Nature of Sub-Deliverable',
    'Current Status of Assignment',
    'Priority',
    'Owner (Responsible)',
    'WhatsApp Group Created',
    'EL Number',
    'EL Status',
    'EL Date (Start Date)',
    'Report Delivery Date',
    'Consulting Date',
    'TAT (Days)',
    'Next Action',
    'Total Commercial Value (Rs., excl. taxes)',
    'Advance Amount (Rs.)',
    'Advance Receipt Status',
    'Post-Delivery Commercial (Rs.)',
    'Post-Delivery Receipt Status',
    'Invoice Value (Rs., excl. taxes)',
    'Invoice Date',
    'Post-Completion Engagement Potential',
    'Post-Completion Engagement Status',
    'Remarks',
    'Final Status',
    'Date & Time of Update',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r, index) => [
    index + 1,
    r.clientName,
    r.contactPerson,
    r.cellNumber,
    r.email,
    r.location,
    r.businessDetails,
    r.leadGeneratedBy,
    r.leadGenerationDate,
    r.natureOfDeliverable,
    r.natureOfSubDeliverable,
    r.assignmentStatus,
    r.priority,
    r.owner,
    r.whatsappGroupCreated,
    r.elNumber,
    r.elStatus,
    r.elStartDate,
    r.reportDeliveryDate,
    r.consultingDate,
    r.tatDays,
    r.nextAction,
    r.totalCommercial,
    r.advanceAmount,
    r.advanceReceiptStatus,
    r.postDeliveryCommercial,
    r.postDeliveryReceiptStatus,
    r.invoiceValue,
    r.invoiceDate,
    r.postCompletionPotential,
    r.postCompletionStatus,
    r.remarks,
    r.finalStatus,
    r.updatedAt,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `GFP_Marketing_CRM_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
