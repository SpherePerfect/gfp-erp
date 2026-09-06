export interface ServiceObjective {
  id: string;
  text: string;
  include: boolean;
}

export interface SubDeliverable {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
}

export interface ServiceDeliverable {
  id: string;
  heading: string;
  body: string;
  include: boolean;
  section?: string; // Optional section grouping e.g. "Section 1", "Diagnostic", etc.
  sectionNumber?: number; // 1, 2, 3...
  individualFee?: number; // Custom fee if priced separately
  advancePercent?: number; // Custom advance % for this deliverable
  paymentTerms?: string; // Custom payment terms for this deliverable
  subDeliverables?: SubDeliverable[];
}

export interface ServiceInformationRequired {
  id: string;
  text: string;
  include: boolean;
}

export interface PaymentMilestone {
  id: string;
  milestone: string;
  label?: string;
  percent: number;
  stageNote?: string;
  applyGst?: boolean; // Can toggle GST on/off per milestone (e.g. GST charged on final milestones, not advance)
}

export interface FeeLineItem {
  id: string;
  description: string;
  amount: number;
  unit?: string; // e.g. "Lumpsum", "Per Month", "Per Manday"
  notes?: string;
}

export interface ServiceTemplate {
  id: string;
  serviceCode: string;
  serviceTitle: string;
  subjectLine: string;
  openingParagraphs: string[];
  objectives: ServiceObjective[];
  deliverables: ServiceDeliverable[];
  informationRequired: ServiceInformationRequired[];
  projectTimeline?: string; // e.g. "3 to 4 Weeks"
  clientEnablersClause?: string;
  lineItems?: FeeLineItem[]; // Itemized fee line items
  pricing: {
    feeLabel: string;
    feeAmount: number;
    currency: string;
    gstPercent: number;
    paymentSplit: PaymentMilestone[];
    validityDays: number;
    advanceBillingMode?: 'bundle' | 'per_service';
    customAdvancePercent?: number;
    customPaymentTermsClause?: string;
    lineItems?: FeeLineItem[]; // Itemized fee line items under pricing
  };
  additionalConditions?: string[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientDetails {
  addresseeName: string;
  salutation: string; // 'Dear Sir' | 'Dear Madam' | 'Dear Sir/Madam' | 'Dear Dr.'
  companyName: string;
  designation?: string;
  businessEntityType: string; // 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited' | 'Public Limited' | 'Other'
  billingAddress: string;
  state: string;
  cin?: string; // Corporate Identification Number (CIN)
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankNameBranch: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  qrCodeDataUrl?: string;
}

export interface ContactPerson {
  name: string;
  phone: string;
  email?: string;
}

export interface SignatoryDetails {
  id: string;
  name: string;
  designation: string;
  email?: string;
  phone?: string;
  isDefault?: boolean;
}

export type SignatoryProfile = SignatoryDetails;

export interface ThemeSettings {
  colorTheme: 'royal_navy' | 'sapphire' | 'slate_navy' | 'oxford';
  fontFamily: 'serif' | 'sans' | 'garamond';
  logoPosition: 'left' | 'right';
  letterheadStyle: 'two_column' | 'band' | 'classic';
}

export interface FirmProfile {
  firmName: string;
  tagline: string;
  officeLocations: string;
  registeredState: string;
  cin?: string; // Corporate Identification Number (CIN)
  gstin: string;
  pan: string;
  sacCode: string;
  firmEmail?: string;
  firmPhone?: string;
  firmWebsite?: string;
  bankDetails: BankDetails;
  contactPersons: ContactPerson[];
  signatoryName: string;
  signatoryDesignation: string;
  signatoryEmail?: string;
  signatoryPhone?: string;
  signatories?: SignatoryDetails[];
  logoDataUrl?: string;
  logoDimensions?: { width: number; height: number };
  logoWidthPx?: number; // Configurable logo width in pixels for constant size across preview & export
  qrCodeDataUrl?: string;
  logoPosition?: 'left' | 'right';
  themeSettings?: ThemeSettings;
  wordDocConfig?: WordDocConfig;
}

export interface WordDocConfig {
  fontFamily: 'Segoe UI' | 'Calibri' | 'Aptos' | 'Georgia' | 'Arial' | 'Times New Roman';
  fontSizeScale: 'compact' | 'standard' | 'spacious';
  colorTheme: 'navy' | 'indigo' | 'cobalt' | 'charcoal' | 'emerald' | 'burgundy';
  margins: 'compact' | 'standard' | 'spacious';
  headerLayout: 'two_column' | 'logo_right' | 'minimal_band';
  tableStyle: 'executive' | 'corporate_navy' | 'minimal_clean';
  signatureLayout: 'dual_column' | 'acceptance_box' | 'stacked';
  includeWatermark: boolean;
  watermarkText?: string;
  includeConfidentiality: boolean;
  includeNonSolicitation: boolean;
  includeClientEnablers: boolean;
  includeJurisdiction: boolean;
  showStampBox: boolean;
}

export interface ActionLogEntry {
  timestamp: string;
  user: string;
  action: string;
}

export type EngagementStatus = 'draft' | 'letter_sent' | 'approved' | 'invoiced' | 'completed';

export interface PersonalIssuerDetails {
  name: string;
  designation?: string;
  pan?: string;
  address?: string;
  email?: string;
  phone?: string;
  bankDetails?: BankDetails;
  qrCodeDataUrl?: string;
  nonGstDeclaration?: string;
}

export interface TdsConfig {
  enabled: boolean;
  ratePercent: number; // e.g. 10 for Sec 194J (Professional) or 2 for Technical Services
  section: string; // '194J (10%)' | '194J (2%)' | '194C (2%)'
}

export interface DiscountConfig {
  enabled: boolean;
  type: 'percent' | 'amount';
  value: number; // e.g. 10 for 10% or 5000 for ₹5,000
}

export interface ClientPreset extends ClientDetails {
  id: string;
  industry?: string;
  notes?: string;
}

export interface EngagementRecord {
  id: string;
  refNo: string;
  invoiceNo: string;
  sequenceCount?: number; // e.g. 3 for "803" or "903"
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  validityDays: number;
  projectTimeline?: string; // e.g. "3 to 4 Weeks"
  clientEnablersClause?: string;
  client: ClientDetails;
  service: ServiceTemplate; // Primary / fallback service
  services?: ServiceTemplate[]; // Multi-service offerings bundled into one engagement!
  signatory?: SignatoryDetails;
  advanceBillingMode?: 'bundle' | 'per_service';
  customAdvancePercent?: number;
  customPaymentTermsClause?: string;
  invoiceMilestoneType: 'advance' | 'balance' | 'full' | 'custom' | 'service_item'; // Milestone invoiced
  customInvoicePercent?: number;
  customInvoiceAmount?: number;
  customMilestoneLabel?: string;
  selectedMilestoneIndex?: number; // Index in paymentSplit for pro-forma invoicing (e.g. 0 for Advance, 1 for Phase 2, etc.)
  selectedServiceItemId?: string; // When billing a specific service item separately

  // Personal / Non-GST Invoice Options
  invoiceIssuerType?: 'firm' | 'personal'; // 'firm' or 'personal'
  isNonGstInvoice?: boolean; // If true: Bill of Supply / Non-GST Pro-Forma Invoice (0% GST)
  personalIssuer?: PersonalIssuerDetails;

  // Commercial & Scope Customization
  currency?: string; // 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'
  tdsConfig?: TdsConfig;
  discountConfig?: DiscountConfig;
  assumptions?: string[];
  outOfScope?: string[];
  includeStamp?: boolean;
  includeDigitalSign?: boolean;
  watermarkConfig?: {
    enabled: boolean;
    text: string;
    opacity: number; // e.g. 0.15
    diagonal: boolean;
  };
  digitalSealConfig?: {
    enabled: boolean;
    sealTitle?: string;
    membershipNumber?: string;
    firmFrn?: string;
  };
  billingScheduleMilestones?: {
    name: string;
    percent: number;
    amount: number;
    trigger: string;
    applyGst?: boolean; // Can toggle GST on/off per milestone (e.g. advance without GST, balance with GST)
  }[];
  advanceExemptGst?: boolean; // When true, advance invoice is issued without GST (GST deferred to completion)
  collectFullAtEnd?: boolean; // When true, client collects advance + balance together at the end
  qrCodeDataUrl?: string; // Custom uploaded payment QR code photo for invoice & export
  wordDocConfig?: WordDocConfig;

  notes?: string;
  status: EngagementStatus;
  createdBy: string;
  createdAt: string;
  lastEditedAt: string;
  actionLog: ActionLogEntry[];
}

export type CrmAssignmentStatus =
  | 'Lead Identified'
  | 'In Discussion'
  | 'Proposal / EL Sent'
  | 'EL Signed & Active'
  | 'Data Collection'
  | 'Execution & Modeling'
  | 'Draft Delivered'
  | 'Final Report Delivered'
  | 'Closed / Billed'
  | 'On Hold'
  | 'Dropped / Lost';

export type CrmPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type CrmElStatus = 'Draft' | 'Sent' | 'Signed' | 'Not Required';
export type CrmAdvanceStatus = 'Received' | 'Partially Received' | 'Pending' | 'Overdue' | 'Waived';
export type CrmPostDeliveryStatus = 'Pending' | 'Invoiced' | 'Partially Received' | 'Fully Received' | 'Not Due Yet';
export type CrmPostCompletionStatus = 'Pitched' | 'In Discussion' | 'Closed Won' | 'Not Interested' | 'Pending Completion';
export type CrmFinalStatus = 'Active / In Progress' | 'Successfully Completed' | 'Converted to Retainer' | 'Delayed' | 'Terminated';
export type CrmWhatsappGroupStatus = 'Yes' | 'No' | 'Pending';

export interface CrmClientRecord {
  id: string;
  srNo: number; // 1. Sr. No
  clientName: string; // 2. Lead / Client Name
  contactPerson: string; // 3. Contact Person
  cellNumber: string; // 4. Cell Number
  email: string; // 5. Email Address
  location: string; // 6. Client Location
  businessDetails: string; // 7. Business Details
  leadGeneratedBy: string; // 8. Lead Generated By
  leadGenerationDate: string; // 9. Lead Generation Date
  natureOfDeliverable: string; // 10. Nature of Deliverable
  natureOfSubDeliverable: string; // 11. Nature of Sub-Deliverable
  assignmentStatus: CrmAssignmentStatus; // 12. Current Status of Assignment
  priority: CrmPriority; // 13. Priority
  owner: string; // 14. Owner (Responsible)
  whatsappGroupCreated: CrmWhatsappGroupStatus; // 15. WhatsApp Group Created
  elNumber: string; // 16. EL Number
  elStatus: CrmElStatus; // 17. EL Status
  elStartDate: string; // 18. EL Date (Start Date)
  reportDeliveryDate: string; // 19. Report Delivery Date
  consultingDate: string; // 20. Consulting Date
  tatDays: number; // 21. TAT (Days) [Automated]
  nextAction: string; // 22. Next Action
  totalCommercial: number; // 23. Total Commercial Value (Rs., excl. taxes)
  advanceAmount: number; // 24. Advance Amount (Rs.)
  advanceReceiptStatus: CrmAdvanceStatus; // 25. Advance Receipt Status
  postDeliveryCommercial: number; // 26. Post-Delivery Commercial (Rs.) [Automated: Total - Advance]
  postDeliveryReceiptStatus: CrmPostDeliveryStatus; // 27. Post-Delivery Receipt Status
  invoiceValue: number; // 28. Invoice Value (Rs., excl. taxes)
  invoiceDate: string; // 29. Invoice Date
  postCompletionPotential: string; // 30. Post-Completion Engagement Potential
  postCompletionStatus: CrmPostCompletionStatus; // 31. Post-Completion Engagement Status
  remarks: string; // 32. Remarks
  finalStatus: CrmFinalStatus; // 33. Final Status
  updatedAt: string; // 34. Date & Time of Update [Automated timestamp]

  // Direct integration fields
  engagementId?: string; // Linked EngagementRecord ID
  whatsappLink?: string; // Auto-generated direct WhatsApp chat URL
  subDeliverablesList?: SubDeliverable[]; // Structured interactive sub-deliverables checklist
  activities?: CrmActivity[]; // Client interaction history: Calls, Meetings, WhatsApp, Proposals, Tasks
}

export interface CrmActivity {
  id: string;
  type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'proposal' | 'note' | 'task';
  title: string;
  notes?: string;
  timestamp: string; // ISO
  user: string;
  outcome?: string;
  followUpDate?: string;
}

export interface TrashItem {
  id: string;
  itemType: 'crm_lead' | 'engagement' | 'template';
  title: string;
  subtitle?: string;
  deletedAtIso: string; // ISO string with millisecond precision
  deletedAtFormatted: string; // Human-readable with milliseconds, e.g. "05/09/2026 07:44:12.384 AM"
  deletedBy: string;
  data: any; // Complete snapshot for flawless restoration
}

export interface CustomTaxonomyConfig {
  assignmentStatuses: string[];
  priorities: string[];
  advanceStatuses: string[];
  postDeliveryStatuses: string[];
  finalStatuses: string[];
  postCompletionStatuses: string[];
  whatsappGroupStatuses: string[];
  elStatuses: string[];
}

// LCE (Leaders Club of Entrepreneurs) Referral & Commission Record
export interface LceRecord {
  id: string;
  month: string; // e.g. "September 2026", "August 2026"
  sNo: number; // Row sequence: 1, 2, 3...
  businessName: string; // Business Name
  ownerName: string; // Owner Name
  city: string; // City
  gstApplicable: boolean; // Yes / No
  taxableFee: number; // Taxable / Consultation Fee (₹) [col F]
  gstAmount: number; // GST @18% (₹) [if applicable] [col G]
  totalInvoiceAmount: number; // Total Invoice Amount (₹) [F + G] [col H]
  paymentStatus: 'Received' | 'Partially Received' | 'Pending' | 'Overdue';
  totalAmountReceived: number; // Total Amount Received (₹) (Basic + Tax) [col J]
  taxableAmountReceived: number; // Taxable Amount Received (₹) [if paid: col F] ← Dr. Ajay's Inv. Basis [col K]
  gstAmountReceived: number; // GST Amount Received (₹) [col L]
  commissionRatePercent: number; // Commission Rate, default 20%
  commissionPayable: number; // Commission Payable (₹)
  beneficiaryId?: string; // ID of the beneficiary person/partner
  beneficiaryName?: string; // Person/Partner for whom commission is payable (e.g. Dr. Ajay, Rahul Sharma)
  beneficiaryRole?: string; // Role or designation (e.g. LCE Partner, Channel Partner)
  beneficiaryPhone?: string;
  beneficiaryPan?: string;
  remarks: string; // Remarks / Notes
  crmRecordId?: string; // Optional linked CRM Lead ID
  engagementId?: string; // Optional linked Engagement Proposal ID
  createdAt: string;
  updatedAt: string;
}

export interface CommissionBeneficiary {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  pan?: string;
  bankDetails?: string | {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
  };
  defaultRatePercent?: number;
  defaultCommissionRate?: number;
}

export interface KanbanColumnConfig {
  id: string;
  title: string;
  statuses: CrmAssignmentStatus[];
  colorTheme: 'blue' | 'indigo' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate' | 'teal';
  bg: string;
  border: string;
  badge: string;
}


