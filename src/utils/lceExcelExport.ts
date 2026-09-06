import * as XLSX from 'xlsx';
import { LceRecord, CommissionBeneficiary } from '../types';

export interface ExcelExportOptions {
  records: LceRecord[];
  filterMonth?: string;
  selectedBeneficiary?: CommissionBeneficiary | null;
  beneficiaries?: CommissionBeneficiary[];
  firmName?: string;
}

/**
 * Creates a well-formatted worksheet array for a specific beneficiary or consolidated group
 */
function createFormattedSheetData(
  records: LceRecord[],
  beneficiaryName: string,
  beneficiaryDetails?: CommissionBeneficiary | null,
  firmName: string = 'GFP Advisory'
): any[][] {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Title Block
  const titleBlock: any[][] = [
    [firmName.toUpperCase() + ' - PROFESSIONAL ADVISORY & CONSULTING'],
    ['CONFIDENTIAL COMMISSION & REFERRAL SETTLEMENT REGISTER'],
    ['Beneficiary Name:', beneficiaryName || 'Consolidated (All Recipients)', '', 'Report Generated:', currentDate],
    [
      'Designation / Role:',
      beneficiaryDetails?.role || 'Referral Partner / Affiliate',
      '',
      'PAN:',
      beneficiaryDetails?.pan || 'N/A',
    ],
    [
      'Bank & UPI Info:',
      typeof beneficiaryDetails?.bankDetails === 'object' && beneficiaryDetails?.bankDetails?.bankName
        ? `${beneficiaryDetails.bankDetails.bankName} | A/C: ${beneficiaryDetails.bankDetails.accountNumber || '—'} | IFSC: ${beneficiaryDetails.bankDetails.ifsc || '—'} | UPI: ${beneficiaryDetails.bankDetails.upiId || '—'}`
        : typeof beneficiaryDetails?.bankDetails === 'string'
        ? beneficiaryDetails.bankDetails
        : 'Registered Bank Coordinates on File',
      '',
      'Default Commission Rate:',
      beneficiaryDetails?.defaultCommissionRate ? `${beneficiaryDetails.defaultCommissionRate}%` : 'Variable',
    ],
    [], // Blank separator row
  ];

  // Table Column Headers
  const headerRow = [
    'Month',
    'S. No.',
    'Beneficiary / Recipient',
    'Client / Business Name',
    'Promoter / Owner Name',
    'City / Location',
    'GST Status',
    'Taxable Fee (₹)',
    'GST 18% (₹)',
    'Total Gross (₹)',
    'Payment Status',
    'Total Recd (₹)',
    'Taxable Recd Basis (₹)',
    'GST Recd (₹)',
    'Comm %',
    'Commission Payable (₹)',
    'Remarks & Notes',
  ];

  const dataRows = records.map((rec, index) => [
    rec.month || 'Current',
    rec.sNo || index + 1,
    rec.beneficiaryName || beneficiaryName || 'Dr. Ajay',
    rec.businessName || '',
    rec.ownerName || '',
    rec.city || '',
    rec.gstApplicable ? 'Yes (18%)' : 'Non-GST (0%)',
    rec.taxableFee || 0,
    rec.gstAmount || 0,
    rec.totalInvoiceAmount || 0,
    rec.paymentStatus || 'Pending',
    rec.totalAmountReceived || 0,
    rec.taxableAmountReceived || 0,
    rec.gstAmountReceived || 0,
    `${rec.commissionRatePercent || 20}%`,
    rec.commissionPayable || 0,
    rec.remarks || '',
  ]);

  // Aggregated Totals
  const totalTaxable = records.reduce((acc, r) => acc + (r.taxableFee || 0), 0);
  const totalGst = records.reduce((acc, r) => acc + (r.gstAmount || 0), 0);
  const totalGross = records.reduce((acc, r) => acc + (r.totalInvoiceAmount || 0), 0);
  const totalReceived = records.reduce((acc, r) => acc + (r.totalAmountReceived || 0), 0);
  const totalTaxableReceived = records.reduce((acc, r) => acc + (r.taxableAmountReceived || 0), 0);
  const totalGstReceived = records.reduce((acc, r) => acc + (r.gstAmountReceived || 0), 0);
  const totalCommission = records.reduce((acc, r) => acc + (r.commissionPayable || 0), 0);

  const totalRow = [
    'TOTAL SUMMARY',
    records.length,
    `${records.length} Client Records`,
    '',
    '',
    '',
    '',
    totalTaxable,
    totalGst,
    totalGross,
    '',
    totalReceived,
    totalTaxableReceived,
    totalGstReceived,
    '',
    totalCommission,
    `Net Commission Payable: ₹${totalCommission.toLocaleString('en-IN')}`,
  ];

  return [...titleBlock, headerRow, ...dataRows, totalRow];
}

/**
 * Main export function to generate a well-formatted, detailed Excel workbook
 */
export function exportLceRecordsToExcel(
  records: LceRecord[],
  filterMonth?: string,
  selectedBeneficiary?: CommissionBeneficiary | null,
  beneficiaries: CommissionBeneficiary[] = [],
  firmName: string = 'GFP Advisory'
): void {
  const filtered = filterMonth && filterMonth !== 'ALL'
    ? records.filter((r) => r.month.toLowerCase() === filterMonth.toLowerCase())
    : records;

  const workbook = XLSX.utils.book_new();
  const fileDate = new Date().toISOString().slice(0, 10);
  const monthTag = filterMonth && filterMonth !== 'ALL' ? `_${filterMonth.replace(/\s+/g, '_')}` : '';

  // Case 1: Specific individual beneficiary chosen
  if (selectedBeneficiary && selectedBeneficiary.name !== 'ALL') {
    const beneficiaryRecords = filtered.filter(
      (r) =>
        r.beneficiaryId === selectedBeneficiary.id ||
        (r.beneficiaryName && r.beneficiaryName.toLowerCase() === selectedBeneficiary.name.toLowerCase()) ||
        (!r.beneficiaryName && selectedBeneficiary.name.toLowerCase().includes('ajay'))
    );

    const sheetData = createFormattedSheetData(
      beneficiaryRecords,
      selectedBeneficiary.name,
      selectedBeneficiary,
      firmName
    );
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet['!cols'] = [
      { wch: 16 }, // Month
      { wch: 8 },  // S. No.
      { wch: 22 }, // Beneficiary
      { wch: 34 }, // Business Name
      { wch: 24 }, // Owner Name
      { wch: 16 }, // City
      { wch: 15 }, // GST Status
      { wch: 22 }, // Taxable Fee
      { wch: 18 }, // GST 18%
      { wch: 22 }, // Total Gross
      { wch: 18 }, // Payment Status
      { wch: 22 }, // Total Recd
      { wch: 26 }, // Taxable Basis Recd
      { wch: 18 }, // GST Recd
      { wch: 12 }, // Comm %
      { wch: 26 }, // Commission Payable
      { wch: 38 }, // Remarks
    ];

    const safeSheetName = (selectedBeneficiary.name || 'Beneficiary Report').slice(0, 31).replace(/[\/\\?*:[\]]/g, '');
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const fileName = `Commission_Report_${selectedBeneficiary.name.replace(/\s+/g, '_')}${monthTag}_${fileDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return;
  }

  // Case 2: Consolidated report with master sheet + individual tabs per beneficiary
  // Tab 1: Master Summary Register
  const masterSheetData = createFormattedSheetData(
    filtered,
    'Consolidated (All Recipients)',
    null,
    firmName
  );
  const masterSheet = XLSX.utils.aoa_to_sheet(masterSheetData);
  masterSheet['!cols'] = [
    { wch: 16 }, // Month
    { wch: 8 },  // S. No.
    { wch: 22 }, // Beneficiary
    { wch: 34 }, // Business Name
    { wch: 24 }, // Owner Name
    { wch: 16 }, // City
    { wch: 15 }, // GST Status
    { wch: 22 }, // Taxable Fee
    { wch: 18 }, // GST 18%
    { wch: 22 }, // Total Gross
    { wch: 18 }, // Payment Status
    { wch: 22 }, // Total Recd
    { wch: 26 }, // Taxable Basis Recd
    { wch: 18 }, // GST Recd
    { wch: 12 }, // Comm %
    { wch: 26 }, // Commission Payable
    { wch: 38 }, // Remarks
  ];
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'All Beneficiaries');

  // Also add individual sheet per unique beneficiary if they have records!
  const uniqueBeneficiaries = beneficiaries.length > 0
    ? beneficiaries
    : [
        { id: 'ben-ajay', name: 'Dr. Ajay', role: 'Referral Partner' },
        { id: 'ben-rohit', name: 'Adv. Rohit Sharma', role: 'Legal Associate' },
        { id: 'ben-sneha', name: 'CA Sneha Deshmukh', role: 'Audit Affiliate' },
      ];

  uniqueBeneficiaries.forEach((ben) => {
    const benRecords = filtered.filter(
      (r) =>
        r.beneficiaryId === ben.id ||
        (r.beneficiaryName && r.beneficiaryName.toLowerCase() === ben.name.toLowerCase()) ||
        (!r.beneficiaryName && ben.name.toLowerCase().includes('ajay'))
    );

    if (benRecords.length > 0) {
      const benSheetData = createFormattedSheetData(benRecords, ben.name, ben, firmName);
      const benSheet = XLSX.utils.aoa_to_sheet(benSheetData);
      benSheet['!cols'] = masterSheet['!cols'];
      const safeTitle = ben.name.slice(0, 31).replace(/[\/\\?*:[\]]/g, '');
      XLSX.utils.book_append_sheet(workbook, benSheet, safeTitle);
    }
  });

  const fileName = `Master_Commission_Register${monthTag}_${fileDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
