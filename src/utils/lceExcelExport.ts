import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LceRecord, CommissionBeneficiary } from '../types';

export interface ExcelExportOptions {
  records: LceRecord[];
  filterMonth?: string;
  selectedBeneficiary?: CommissionBeneficiary | null;
  beneficiaries?: CommissionBeneficiary[];
  firmName?: string;
}

// Brand theme color constants (ARGB format required by ExcelJS)
const COLORS = {
  NAVY_PRIMARY: 'FF0B2545',   // #0B2545
  NAVY_SECONDARY: 'FF133863', // #133863
  NAVY_LIGHT: 'FFEAF1FB',     // Soft navy tint
  SLATE_HEADER: 'FF1E293B',   // Dark slate
  ZEBRA_EVEN: 'FFFFFFFF',     // Pure white
  ZEBRA_ODD: 'FFF8FAFC',      // Soft slate 50
  BORDER_LIGHT: 'FFE2E8F0',   // Slate 200
  BORDER_DARK: 'FF94A3B8',    // Slate 400
  TOTAL_BG: 'FFE8EFF7',       // Accounting total highlight
  TEXT_WHITE: 'FFFFFFFF',
  TEXT_NAVY: 'FF0B2545',
  TEXT_MUTED: 'FF64748B',
  STATUS_PAID_BG: 'FFDCFCE7', // Emerald 100
  STATUS_PAID_FG: 'FF166534', // Emerald 800
  STATUS_PEND_BG: 'FFFEF3C7', // Amber 100
  STATUS_PEND_FG: 'FF92400E', // Amber 800
  STATUS_ADV_BG: 'FFE0E7FF',  // Indigo 100
  STATUS_ADV_FG: 'FF3730A3',  // Indigo 800
};

/**
 * Builds a highly styled, executive-grade worksheet for a given list of records
 */
function buildStyledSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  records: LceRecord[],
  beneficiaryName: string,
  beneficiaryDetails?: CommissionBeneficiary | null,
  firmName: string = 'GFP Advisory'
): void {
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 11 }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // ROW 1: Super Title
  ws.mergeCells('A1:Q1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `${firmName.toUpperCase()} — PARTNERSHIP & REFERRAL COMMERCIAL REGISTER`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.TEXT_WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_PRIMARY } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  // ROW 2: Subtitle Banner
  ws.mergeCells('A2:Q2');
  const subCell = ws.getCell('A2');
  subCell.value = 'CONFIDENTIAL COMMISSION SETTLEMENT & REVENUE RECONCILIATION STATEMENT';
  subCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.TEXT_WHITE } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SECONDARY } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // ROW 3: Blank separator
  ws.getRow(3).height = 8;

  // ROWS 4 - 8: Beneficiary Profile Card
  const profileRows = [
    { label1: 'Recipient / Partner:', val1: beneficiaryName || 'Consolidated (All Recipients)', label2: 'Date of Statement:', val2: currentDate },
    { label1: 'Designation / Role:', val1: beneficiaryDetails?.role || 'Referral Partner / Affiliate Advisor', label2: 'Permanent A/C (PAN):', val2: beneficiaryDetails?.pan || 'On Record' },
    {
      label1: 'Bank Account & Branch:',
      val1: typeof beneficiaryDetails?.bankDetails === 'object' && beneficiaryDetails?.bankDetails?.bankName
        ? `${beneficiaryDetails.bankDetails.bankName} (A/C: ${beneficiaryDetails.bankDetails.accountNumber || '—'}, IFSC: ${beneficiaryDetails.bankDetails.ifsc || '—'})`
        : typeof beneficiaryDetails?.bankDetails === 'string' && beneficiaryDetails.bankDetails
        ? beneficiaryDetails.bankDetails
        : 'Registered Commercial Settlement Account',
      label2: 'UPI Virtual ID:',
      val2: (typeof beneficiaryDetails?.bankDetails === 'object' ? beneficiaryDetails?.bankDetails?.upiId : '') || '—',
    },
    {
      label1: 'Default Commission Basis:',
      val1: beneficiaryDetails?.defaultCommissionRate ? `${beneficiaryDetails.defaultCommissionRate}% of Taxable Fee Collected` : 'Deal Specific Variable %',
      label2: 'Active Deals in Period:',
      val2: `${records.length} Client Engagements`,
    },
  ];

  profileRows.forEach((row, idx) => {
    const rowNum = 4 + idx;
    ws.getRow(rowNum).height = 19;

    // Field 1: Label
    ws.mergeCells(`A${rowNum}:B${rowNum}`);
    const l1 = ws.getCell(`A${rowNum}`);
    l1.value = row.label1;
    l1.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.TEXT_NAVY } };
    l1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_LIGHT } };
    l1.alignment = { horizontal: 'right', vertical: 'middle' };

    // Field 1: Value
    ws.mergeCells(`C${rowNum}:H${rowNum}`);
    const v1 = ws.getCell(`C${rowNum}`);
    v1.value = row.val1;
    v1.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
    v1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Field 2: Label
    ws.mergeCells(`I${rowNum}:K${rowNum}`);
    const l2 = ws.getCell(`I${rowNum}`);
    l2.value = row.label2;
    l2.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.TEXT_NAVY } };
    l2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_LIGHT } };
    l2.alignment = { horizontal: 'right', vertical: 'middle' };

    // Field 2: Value
    ws.mergeCells(`L${rowNum}:Q${rowNum}`);
    const v2 = ws.getCell(`L${rowNum}`);
    v2.value = row.val2;
    v2.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
    v2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Set subtle border around profile grid
    for (let c = 1; c <= 17; c++) {
      const cell = ws.getRow(rowNum).getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      };
    }
  });

  // ROW 9 - 10: Blank spacer before table
  ws.getRow(9).height = 10;
  ws.getRow(10).height = 4;

  // ROW 11: Main Table Column Headers
  const headers = [
    { label: 'Month', width: 14, align: 'center' },
    { label: 'S.No.', width: 8, align: 'center' },
    { label: 'Beneficiary / Recipient', width: 22, align: 'left' },
    { label: 'Client / Business Name', width: 28, align: 'left' },
    { label: 'Promoter / Owner', width: 22, align: 'left' },
    { label: 'City / Location', width: 16, align: 'left' },
    { label: 'GST Status', width: 14, align: 'center' },
    { label: 'Taxable Fee (₹)', width: 18, align: 'right' },
    { label: 'GST 18% (₹)', width: 16, align: 'right' },
    { label: 'Gross Invoice (₹)', width: 19, align: 'right' },
    { label: 'Payment Status', width: 16, align: 'center' },
    { label: 'Total Recd (₹)', width: 18, align: 'right' },
    { label: 'Taxable Recd Basis (₹)', width: 22, align: 'right' },
    { label: 'GST Recd (₹)', width: 16, align: 'right' },
    { label: 'Comm %', width: 11, align: 'center' },
    { label: 'Commission Payable (₹)', width: 24, align: 'right' },
    { label: 'Remarks / Milestone Notes', width: 32, align: 'left' },
  ];

  const headerRow = ws.getRow(11);
  headerRow.height = 32;

  headers.forEach((h, idx) => {
    const colIndex = idx + 1;
    const cell = headerRow.getCell(colIndex);
    cell.value = h.label;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.TEXT_WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_PRIMARY } };
    cell.alignment = { horizontal: h.align as any, vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.NAVY_PRIMARY } },
      bottom: { style: 'medium', color: { argb: COLORS.NAVY_PRIMARY } },
      left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
    };
    ws.getColumn(colIndex).width = h.width;
  });

  // DATA ROWS (Start at Row 12)
  const rupeeFormat = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹"0.00';
  let startRow = 12;

  records.forEach((rec, index) => {
    const currentRow = ws.getRow(startRow + index);
    currentRow.height = 24;
    const isOdd = index % 2 === 1;
    const rowBg = isOdd ? COLORS.ZEBRA_ODD : COLORS.ZEBRA_EVEN;

    const rowValues = [
      rec.month || 'Current',
      rec.sNo || index + 1,
      rec.beneficiaryName || beneficiaryName || 'Dr. Ajay',
      rec.businessName || '—',
      rec.ownerName || '—',
      rec.city || '—',
      rec.gstApplicable ? 'GST (18%)' : 'Exempt (0%)',
      rec.taxableFee || 0,
      rec.gstAmount || 0,
      rec.totalInvoiceAmount || 0,
      rec.paymentStatus || 'Pending',
      rec.totalAmountReceived || 0,
      rec.taxableAmountReceived || 0,
      rec.gstAmountReceived || 0,
      (rec.commissionRatePercent || 20) / 100, // Stored as decimal for % format
      rec.commissionPayable || 0,
      rec.remarks || '',
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = currentRow.getCell(colIdx + 1);
      cell.value = val;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      };
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };

      // Formatting by column type
      // Numeric Currency columns: 8, 9, 10, 12, 13, 14, 16
      if ([8, 9, 10, 12, 13, 14, 16].includes(colIdx + 1)) {
        cell.numFmt = rupeeFormat;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colIdx + 1 === 16) {
          // Commission Payable is highlighted in bold navy
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.TEXT_NAVY } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOdd ? 'FFE6EEF8' : 'FFEFF6FF' } };
        }
      } else if (colIdx + 1 === 15) {
        // Percentage column
        cell.numFmt = '0.0%';
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colIdx + 1 === 2) {
        // Serial number
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.TEXT_MUTED } };
      } else if (colIdx + 1 === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true };
      } else if (colIdx + 1 === 7) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: rec.gstApplicable ? 'FF1E3A8A' : 'FF475569' } };
      } else if (colIdx + 1 === 11) {
        // Payment Status Badge
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        const st = String(rec.paymentStatus || '').toLowerCase();
        if (st.includes('full') || st.includes('paid')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.STATUS_PAID_BG } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.STATUS_PAID_FG } };
        } else if (st.includes('advance') || st.includes('partial')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.STATUS_ADV_BG } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.STATUS_ADV_FG } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.STATUS_PEND_BG } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.STATUS_PEND_FG } };
        }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      }
    });
  });

  // SUMMARY TOTAL ROW (Directly below data rows)
  const totalRowIndex = startRow + records.length;
  const totalRow = ws.getRow(totalRowIndex);
  totalRow.height = 30;

  // Merge A-G for "TOTAL SUMMARY" label
  ws.mergeCells(`A${totalRowIndex}:G${totalRowIndex}`);
  const totalLabel = totalRow.getCell(1);
  totalLabel.value = `GRAND TOTALS — ${records.length} ENGAGEMENT DEALS`;
  totalLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.NAVY_PRIMARY } };
  totalLabel.alignment = { horizontal: 'center', vertical: 'middle' };
  totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TOTAL_BG } };

  // Set borders and fills for all summary cells
  for (let c = 1; c <= 17; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TOTAL_BG } };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.NAVY_PRIMARY } },
      bottom: { style: 'double', color: { argb: COLORS.NAVY_PRIMARY } },
      left: { style: 'thin', color: { argb: COLORS.BORDER_DARK } },
      right: { style: 'thin', color: { argb: COLORS.BORDER_DARK } },
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.NAVY_PRIMARY } };
  }

  // Sum Formulas for numeric columns
  const firstDataRow = startRow;
  const lastDataRow = Math.max(startRow, totalRowIndex - 1);

  const sumCols = [
    { col: 8, colLetter: 'H' },  // Taxable Fee
    { col: 9, colLetter: 'I' },  // GST Amount
    { col: 10, colLetter: 'J' }, // Gross Invoice
    { col: 12, colLetter: 'L' }, // Total Recd
    { col: 13, colLetter: 'M' }, // Taxable Recd
    { col: 14, colLetter: 'N' }, // GST Recd
    { col: 16, colLetter: 'P' }, // Commission Payable
  ];

  if (records.length > 0) {
    sumCols.forEach(({ col, colLetter }) => {
      const cell = totalRow.getCell(col);
      cell.value = { formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})` };
      cell.numFmt = rupeeFormat;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (col === 16) {
        cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF0B2545' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4E2F4' } };
      }
    });
  } else {
    sumCols.forEach(({ col }) => {
      const cell = totalRow.getCell(col);
      cell.value = 0;
      cell.numFmt = rupeeFormat;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
  }

  // Footer Note in Remarks
  const remarksCell = totalRow.getCell(17);
  remarksCell.value = 'Reconciled & Certified';
  remarksCell.font = { name: 'Segoe UI', size: 9, italic: true, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  remarksCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // AUDIT & SIGN-OFF BLOCK
  const signOffRow = totalRowIndex + 3;
  ws.getRow(signOffRow).height = 40;

  ws.mergeCells(`B${signOffRow}:E${signOffRow}`);
  const prepCell = ws.getCell(`B${signOffRow}`);
  prepCell.value = 'Prepared By: Accounts & Commercials Desk\nGFP Advisory Services Pvt Ltd';
  prepCell.font = { name: 'Segoe UI', size: 9, color: { argb: COLORS.TEXT_MUTED } };
  prepCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  ws.mergeCells(`M${signOffRow}:P${signOffRow}`);
  const authCell = ws.getCell(`M${signOffRow}`);
  authCell.value = 'Authorised Signatory / Managing Partner\nFor & On Behalf of GFP Advisory';
  authCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.TEXT_NAVY } };
  authCell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
}

/**
 * Main export function to generate a fully styled, multi-sheet professional Excel workbook
 */
export async function exportLceRecordsToExcel(
  records: LceRecord[],
  filterMonth?: string,
  selectedBeneficiary?: CommissionBeneficiary | null,
  beneficiaries: CommissionBeneficiary[] = [],
  firmName: string = 'GFP Advisory'
): Promise<void> {
  const filtered = filterMonth && filterMonth !== 'ALL'
    ? records.filter((r) => r.month.toLowerCase() === filterMonth.toLowerCase())
    : records;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${firmName} Commercial Portal`;
  workbook.lastModifiedBy = 'GFP Partner Network';
  workbook.created = new Date();
  workbook.modified = new Date();

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

    const safeSheetName = (selectedBeneficiary.name || 'Beneficiary Report')
      .slice(0, 31)
      .replace(/[\/\\?*:[\]]/g, '');

    buildStyledSheet(
      workbook,
      safeSheetName,
      beneficiaryRecords,
      selectedBeneficiary.name,
      selectedBeneficiary,
      firmName
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `Commission_Report_${selectedBeneficiary.name.replace(/\s+/g, '_')}${monthTag}_${fileDate}.xlsx`;
    saveAs(blob, fileName);
    return;
  }

  // Case 2: Consolidated report with master sheet + individual tabs per beneficiary
  // Tab 1: Master Summary Register
  buildStyledSheet(
    workbook,
    'Consolidated All',
    filtered,
    'Consolidated (All Recipients)',
    null,
    firmName
  );

  // Additional sheets per unique beneficiary
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
      const safeTitle = ben.name.slice(0, 31).replace(/[\/\\?*:[\]]/g, '');
      buildStyledSheet(workbook, safeTitle, benRecords, ben.name, ben, firmName);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `Master_Commission_Register${monthTag}_${fileDate}.xlsx`;
  saveAs(blob, fileName);
}
