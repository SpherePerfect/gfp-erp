import { LceRecord } from '../types';

const LCE_STORAGE_KEY = 'gfp_lce_commission_records';

export function calculateLceFields(data: Partial<LceRecord>): Partial<LceRecord> {
  const taxableFee = Math.max(0, Number(data.taxableFee) || 0);
  const gstApplicable = data.gstApplicable ?? true;
  const gstAmount = gstApplicable ? Math.round(taxableFee * 0.18) : 0;
  const totalInvoiceAmount = taxableFee + gstAmount;

  const paymentStatus = data.paymentStatus || 'Pending';
  let totalAmountReceived = Number(data.totalAmountReceived) || 0;
  let taxableAmountReceived = Number(data.taxableAmountReceived) || 0;
  let gstAmountReceived = Number(data.gstAmountReceived) || 0;

  if (paymentStatus === 'Received') {
    totalAmountReceived = totalInvoiceAmount;
    taxableAmountReceived = taxableFee;
    gstAmountReceived = gstAmount;
  } else if (paymentStatus === 'Pending' || paymentStatus === 'Overdue') {
    totalAmountReceived = 0;
    taxableAmountReceived = 0;
    gstAmountReceived = 0;
  } else if (paymentStatus === 'Partially Received') {
    if (!totalAmountReceived || totalAmountReceived === 0) {
      totalAmountReceived = Math.round(totalInvoiceAmount / 2);
    }
    if (gstApplicable) {
      taxableAmountReceived = Math.round(totalAmountReceived / 1.18);
      gstAmountReceived = totalAmountReceived - taxableAmountReceived;
    } else {
      taxableAmountReceived = totalAmountReceived;
      gstAmountReceived = 0;
    }
  }

  const commissionRatePercent = data.commissionRatePercent ?? 20;
  const commissionPayable = Math.round((taxableAmountReceived * commissionRatePercent) / 100);

  return {
    ...data,
    taxableFee,
    gstApplicable,
    gstAmount,
    totalInvoiceAmount,
    paymentStatus,
    totalAmountReceived,
    taxableAmountReceived,
    gstAmountReceived,
    commissionRatePercent,
    commissionPayable,
  };
}

export const defaultLceRecords: LceRecord[] = [
  {
    id: 'lce-001',
    month: 'September 2026',
    sNo: 1,
    businessName: 'Apex Precision Engineering Pvt Ltd',
    ownerName: 'Mr. Rajeshwar Shinde',
    city: 'Pune',
    gstApplicable: true,
    taxableFee: 150000,
    gstAmount: 27000,
    totalInvoiceAmount: 177000,
    paymentStatus: 'Received',
    totalAmountReceived: 177000,
    taxableAmountReceived: 150000,
    gstAmountReceived: 27000,
    commissionRatePercent: 20,
    commissionPayable: 30000,
    remarks: 'Full payment received via NEFT. Dr. Ajay commission cleared.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lce-002',
    month: 'September 2026',
    sNo: 2,
    businessName: 'Coastal Hospitality & Resorts LLP',
    ownerName: 'Mr. Vivek Deshmukh',
    city: 'Panaji, Goa',
    gstApplicable: true,
    taxableFee: 200000,
    gstAmount: 36000,
    totalInvoiceAmount: 236000,
    paymentStatus: 'Partially Received',
    totalAmountReceived: 118000,
    taxableAmountReceived: 100000,
    gstAmountReceived: 18000,
    commissionRatePercent: 20,
    commissionPayable: 20000,
    remarks: '50% Mobilization advance received; Balance due on final delivery.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lce-003',
    month: 'September 2026',
    sNo: 3,
    businessName: 'BioHealth Nutra Care',
    ownerName: 'Dr. Sunita Kulkarni',
    city: 'Mumbai',
    gstApplicable: true,
    taxableFee: 80000,
    gstAmount: 14400,
    totalInvoiceAmount: 94400,
    paymentStatus: 'Received',
    totalAmountReceived: 94400,
    taxableAmountReceived: 80000,
    gstAmountReceived: 14400,
    commissionRatePercent: 20,
    commissionPayable: 16000,
    remarks: 'Referred directly by Dr. Ajay during September LCE breakfast meet.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lce-004',
    month: 'August 2026',
    sNo: 4,
    businessName: 'Zenith Logistics & Cold Chain Solutions',
    ownerName: 'Mr. Amit Patil',
    city: 'Kolhapur',
    gstApplicable: false,
    taxableFee: 50000,
    gstAmount: 0,
    totalInvoiceAmount: 50000,
    paymentStatus: 'Received',
    totalAmountReceived: 50000,
    taxableAmountReceived: 50000,
    gstAmountReceived: 0,
    commissionRatePercent: 20,
    commissionPayable: 10000,
    remarks: 'MSME Non-GST diagnostic scheme. Commission remitted to Dr. Ajay.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lce-005',
    month: 'September 2026',
    sNo: 5,
    businessName: 'Vanguard Solar Power Infra',
    ownerName: 'Mr. Nitin Joshi',
    city: 'Belgaum',
    gstApplicable: true,
    taxableFee: 120000,
    gstAmount: 21600,
    totalInvoiceAmount: 141600,
    paymentStatus: 'Pending',
    totalAmountReceived: 0,
    taxableAmountReceived: 0,
    gstAmountReceived: 0,
    commissionRatePercent: 20,
    commissionPayable: 0,
    remarks: 'Pro-forma invoice shared with accounts team. Follow up scheduled.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredLceRecords(): LceRecord[] {
  try {
    const raw = localStorage.getItem(LCE_STORAGE_KEY);
    if (!raw) {
      saveLceRecords(defaultLceRecords);
      return defaultLceRecords;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultLceRecords;
  } catch (err) {
    console.error('Failed to load LCE records from storage:', err);
    return defaultLceRecords;
  }
}

export function saveLceRecords(records: LceRecord[]): void {
  try {
    localStorage.setItem(LCE_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save LCE records to storage:', err);
  }
}

const BENEFICIARIES_STORAGE_KEY = 'gfp_commission_beneficiaries';

export const defaultBeneficiaries = [
  {
    id: 'ben-ajay',
    name: 'Dr. Ajay',
    role: 'Lead Business Referral Partner',
    phone: '+91 98220 12345',
    pan: 'ABCDE1234F',
    bankDetails: {
      bankName: 'HDFC Bank, Pune Camp Branch',
      accountNumber: '50100234567890',
      ifsc: 'HDFC0000039',
      upiId: 'drajay@okhdfcbank',
    },
    defaultCommissionRate: 20,
  },
  {
    id: 'ben-rohit',
    name: 'Adv. Rohit Sharma',
    role: 'Legal & Corporate Associate',
    phone: '+91 98221 67890',
    pan: 'BCDEF2345G',
    bankDetails: {
      bankName: 'ICICI Bank, FC Road Branch',
      accountNumber: '000501523456',
      ifsc: 'ICIC0000005',
      upiId: 'rohitlegal@icici',
    },
    defaultCommissionRate: 15,
  },
  {
    id: 'ben-sneha',
    name: 'CA Sneha Deshmukh',
    role: 'Audit & Taxation Affiliate',
    phone: '+91 98222 78901',
    pan: 'CDEFG3456H',
    bankDetails: {
      bankName: 'State Bank of India, Shivaji Nagar',
      accountNumber: '31234567890',
      ifsc: 'SBIN0001234',
      upiId: 'sneha.audit@sbi',
    },
    defaultCommissionRate: 10,
  },
];

export function getStoredBeneficiaries(): typeof defaultBeneficiaries {
  try {
    const raw = localStorage.getItem(BENEFICIARIES_STORAGE_KEY);
    if (!raw) {
      saveBeneficiaries(defaultBeneficiaries);
      return defaultBeneficiaries;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultBeneficiaries;
  } catch (err) {
    console.error('Failed to load commission beneficiaries:', err);
    return defaultBeneficiaries;
  }
}

export function saveBeneficiaries(beneficiaries: typeof defaultBeneficiaries): void {
  try {
    localStorage.setItem(BENEFICIARIES_STORAGE_KEY, JSON.stringify(beneficiaries));
  } catch (err) {
    console.error('Failed to save commission beneficiaries:', err);
  }
}
