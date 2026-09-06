/**
 * Utilities for dynamic deliverable numbering, EL reference code generation,
 * and service package management.
 */

export function cleanDeliverableHeading(heading: string): string {
  if (!heading) return '';
  return heading
    .replace(/^(\d+(\.\d+)*|[A-Za-z]+\s*\d+)\s*[-–—.:]\s*/i, '')
    .replace(/^[\d.]+\s+/i, '')
    .trim();
}

export function formatDeliverableHeading(
  heading: string,
  index: number,
  sectionPrefix: string | number = '1'
): string {
  const cleaned = cleanDeliverableHeading(heading);
  return `${sectionPrefix}.${index + 1}  ${cleaned || heading}`;
}

export interface DeliverableWithNumbering {
  id: string;
  heading: string;
  body: string;
  include: boolean;
  section: string;
  sectionNumber: number | string;
  itemNumber: number;
  fullNumber: string; // e.g. "1.1", "1.2", "2.1"
  formattedHeading: string;
  subDeliverables?: any[];
}

/**
 * Dynamically numbers ONLY the included deliverables according to their section.
 * If 10 deliverables are defined across sections, selecting 3 in section 1 and 2 in section 2
 * automatically yields 1.1, 1.2, 1.3 in section 1 and 2.1, 2.2 in section 2.
 */
export function getNumberedDeliverables(
  deliverables: any[],
  defaultSectionPrefix: string | number = '1'
): DeliverableWithNumbering[] {
  if (!deliverables || deliverables.length === 0) return [];

  // Group by section or assign default
  const sectionCounters: { [secKey: string]: number } = {};

  return deliverables.map((del) => {
    // Extract section number if present (e.g. sectionNumber: 2, or section: "Section 2: Financial Assessment")
    let secNum: string | number = defaultSectionPrefix;

    if (del.sectionNumber !== undefined && del.sectionNumber !== null && del.sectionNumber !== '') {
      secNum = del.sectionNumber;
    } else if (del.section) {
      const match = del.section.match(/(?:Section|Phase|Part|Module)\s*(\d+)/i) || del.section.match(/^(\d+)/);
      if (match) {
        secNum = match[1];
      } else {
        secNum = defaultSectionPrefix;
      }
    }

    const secKey = String(secNum);
    if (del.include) {
      sectionCounters[secKey] = (sectionCounters[secKey] || 0) + 1;
    }
    const itemNum = sectionCounters[secKey] || 1;
    const fullNumber = `${secNum}.${itemNum}`;
    const cleaned = cleanDeliverableHeading(del.heading);

    return {
      ...del,
      section: del.section || `Section ${secNum}`,
      sectionNumber: secNum,
      itemNumber: itemNum,
      fullNumber,
      formattedHeading: `${fullNumber}  ${cleaned || del.heading}`,
    };
  });
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseMonthFromDate(dateStr: string): { monthNum: number; monthName: string; year: string } {
  let month = new Date().getMonth() + 1; // 1-12
  let year = `${new Date().getFullYear()}`;

  if (dateStr) {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) month = m;
        if (parts[2]) year = parts[2].trim();
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) month = m;
        year = parts[0].trim();
      }
    }
  }

  return {
    monthNum: month,
    monthName: MONTH_NAMES[month - 1] || 'Unknown',
    year,
  };
}

export function generateElRefNumber(
  dateStr: string,
  count: number | string,
  prefix = 'GFP/EL'
): { refNo: string; code: string; monthNum: number; monthName: string } {
  const { monthNum, monthName } = parseMonthFromDate(dateStr);
  const numericCount = parseInt(String(count).replace(/\D/g, ''), 10) || 1;
  const countPadded = numericCount < 10 ? `0${numericCount}` : `${numericCount}`;
  const code = `${monthNum}${countPadded}`; // e.g. 803 for August #03, 903 for September #03

  return {
    refNo: `${prefix}/${code}`,
    code,
    monthNum,
    monthName,
  };
}

export function generateInvoiceNumber(
  dateStr: string,
  count: number | string,
  prefix = 'GFP/PI'
): string {
  const { monthNum } = parseMonthFromDate(dateStr);
  const numericCount = parseInt(String(count).replace(/\D/g, ''), 10) || 1;
  const countPadded = numericCount < 10 ? `0${numericCount}` : `${numericCount}`;
  const code = `${monthNum}${countPadded}`;

  return `${prefix}/${code}`;
}
