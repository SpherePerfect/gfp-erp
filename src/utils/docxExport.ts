import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import saveAs from 'file-saver';
import { EngagementRecord, FirmProfile, ServiceTemplate, WordDocConfig } from '../types';
import { formatIndianCurrency, numberToIndianWords } from './numberToIndianWords';
import { formatDeliverableHeading, getNumberedDeliverables } from './numberingHelpers';
import { getFirmLogoBytes } from './logoImageHelper';
import { getQrImageBytes } from './qrImageHelper';

// Executive Typography & Palette Defaults
export const FONT_PRIMARY = 'Segoe UI';
export const COLOR_NAVY = '0B2545';          // Oxford Executive Navy
export const COLOR_COBALT = '1E40AF';        // Royal Accent Cobalt
export const COLOR_CHARCOAL = '1E293B';      // Deep text body
export const COLOR_SLATE = '475569';         // Secondary text
export const COLOR_MUTED = '64748B';         // Subtitle/Caption
export const COLOR_BG_LIGHT = 'F8FAFC';      // Soft Ice Shading
export const COLOR_BG_ACCENT = 'F1F5F9';     // Tinted Card Shading
export const COLOR_BORDER = 'CBD5E1';        // Clean subtle border
export const COLOR_BORDER_DARK = '94A3B8';   // Darker subtle border
export const COLOR_HIGHLIGHT = 'EEF2FF';     // Totals row shading
export const COLOR_SUCCESS_LIGHT = 'ECFDF5'; // Green accent light

export function resolveWordDocConfig(record: EngagementRecord, firm: FirmProfile, customConfig?: WordDocConfig): WordDocConfig {
  return {
    fontFamily: customConfig?.fontFamily || record.wordDocConfig?.fontFamily || firm.wordDocConfig?.fontFamily || 'Segoe UI',
    fontSizeScale: customConfig?.fontSizeScale || record.wordDocConfig?.fontSizeScale || firm.wordDocConfig?.fontSizeScale || 'standard',
    colorTheme: customConfig?.colorTheme || record.wordDocConfig?.colorTheme || firm.wordDocConfig?.colorTheme || 'navy',
    margins: customConfig?.margins || record.wordDocConfig?.margins || firm.wordDocConfig?.margins || 'standard',
    headerLayout: customConfig?.headerLayout || record.wordDocConfig?.headerLayout || firm.wordDocConfig?.headerLayout || 'two_column',
    tableStyle: customConfig?.tableStyle || record.wordDocConfig?.tableStyle || firm.wordDocConfig?.tableStyle || 'executive',
    signatureLayout: customConfig?.signatureLayout || record.wordDocConfig?.signatureLayout || firm.wordDocConfig?.signatureLayout || 'dual_column',
    includeWatermark: customConfig?.includeWatermark ?? record.wordDocConfig?.includeWatermark ?? false,
    watermarkText: customConfig?.watermarkText || record.wordDocConfig?.watermarkText || 'CONFIDENTIAL',
    includeConfidentiality: customConfig?.includeConfidentiality ?? record.wordDocConfig?.includeConfidentiality ?? true,
    includeNonSolicitation: customConfig?.includeNonSolicitation ?? record.wordDocConfig?.includeNonSolicitation ?? true,
    includeClientEnablers: customConfig?.includeClientEnablers ?? record.wordDocConfig?.includeClientEnablers ?? true,
    includeJurisdiction: customConfig?.includeJurisdiction ?? record.wordDocConfig?.includeJurisdiction ?? true,
    showStampBox: customConfig?.showStampBox ?? record.wordDocConfig?.showStampBox ?? true,
  };
}

export function getThemePalette(themeName: string = 'navy') {
  switch (themeName) {
    case 'indigo':
      return {
        primary: '312E81',   // Executive Indigo text
        accent: '4F46E5',    // Indigo Accent
        highlight: 'EEF2FF', // Soft light Indigo tint
        border: 'E0E7FF',    // Clean subtle border
        bgLight: 'F8FAFC',   // Soft Ice light
      };
    case 'cobalt':
      return {
        primary: '1E3A8A',   // Deep Cobalt text
        accent: '2563EB',    // Royal Cobalt
        highlight: 'F0F7FF', // Soft light Ice Blue
        border: 'DBEAFE',    // Clean light border
        bgLight: 'F8FAFC',
      };
    case 'charcoal':
      return {
        primary: '1E293B',   // Deep Slate
        accent: '334155',    // Slate Accent
        highlight: 'F1F5F9', // Crisp Slate White
        border: 'E2E8F0',    // Clean light border
        bgLight: 'F8FAFC',
      };
    case 'emerald':
      return {
        primary: '064E3B',   // Deep Emerald text
        accent: '059669',    // Vivid Emerald
        highlight: 'ECFDF5', // Soft light Mint ice
        border: 'D1FAE5',    // Clean light border
        bgLight: 'F8FAFC',
      };
    case 'burgundy':
      return {
        primary: '581C87',   // Deep Burgundy text
        accent: '7E22CE',    // Magenta Accent
        highlight: 'FAF5FF', // Soft light Rose/Lavender tint
        border: 'F3E8FF',    // Clean light border
        bgLight: 'F8FAFC',
      };
    case 'navy':
    default:
      return {
        primary: '0B2545',   // Oxford Executive Navy text
        accent: '1D4ED8',    // Royal Accent
        highlight: 'F0F4F8', // Soft Pearl Ice highlight
        border: 'E2E8F0',    // Clean subtle light border
        bgLight: 'F8FAFC',
      };
  }
}

export function getDocMargins(marginStyle: string = 'standard', hasHeader: boolean = false) {
  switch (marginStyle) {
    case 'compact':
      return {
        top: hasHeader ? 1650 : 720,
        bottom: 720,
        left: 720,
        right: 720,
        header: 360,
        footer: 360,
      }; // 0.5 in
    case 'spacious':
      return {
        top: hasHeader ? 2250 : 1440,
        bottom: 1440,
        left: 1440,
        right: 1440,
        header: 450,
        footer: 480,
      }; // 1.0 in
    case 'standard':
    default:
      return {
        top: hasHeader ? 1900 : 1080,
        bottom: 1080,
        left: 1080,
        right: 1080,
        header: 380,
        footer: 420,
      }; // 0.75 in
  }
}

// Cell margin constants for luxurious document padding
const CELL_PADDING_STANDARD = { top: 120, bottom: 120, left: 160, right: 160 };
const CELL_PADDING_COMPACT = { top: 80, bottom: 80, left: 140, right: 140 };
const CELL_PADDING_HEADER = { top: 130, bottom: 130, left: 160, right: 160 };

/**
 * Sanitizes filename string to strictly guarantee NO underscores or illegal characters
 */
export function sanitizeFilenamePart(text: string): string {
  if (!text) return 'Document';
  return text
    .replace(/_/g, '-')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Spacing helper
function createVerticalSpacer(pt = 6): Paragraph {
  return new Paragraph({
    spacing: { before: pt * 20, after: pt * 20 },
    children: [],
  });
}

// Section Header with sleek left accent bar
function createSectionHeader(title: string, numberPrefix?: string): Table {
  const displayText = numberPrefix ? `${numberPrefix}.  ${title.toUpperCase()}` : title.toUpperCase();
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_NAVY },
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 70, bottom: 70, left: 140, right: 140 },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: displayText,
                    bold: true,
                    size: 26, // 11pt
                    font: FONT_PRIMARY,
                    color: COLOR_NAVY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates an executive letterhead table with side-by-side logo and firm credentials
 */
/**
 * Builds the executive 2-column letterhead table:
 * - Left column (70% width): Entity identity, designation/tagline, address, statutory credentials with pipes (|),
 *   and contact credentials with pipes (|), all cleanly arranged one below the other and left-aligned.
 * - Right column (30% width): Prominent firm logo, right-aligned, with strictly preserved aspect ratio (never squashed or compressed).
 * - Bottom border: Single crisp accent rule separating the header from the document page.
 */
function createWordHeaderTable(
  firm: FirmProfile,
  isPersonalNonGst: boolean,
  personalIssuer?: { name: string; designation?: string; pan?: string; email?: string; phone?: string; address?: string },
  config?: WordDocConfig
): Table {
  const { bytes: logoBytes, width: logoWidth, height: logoHeight } = getFirmLogoBytes(
    firm.logoDataUrl,
    firm.logoDimensions
  );
  const palette = getThemePalette(config?.colorTheme);
  const fontPrimary = config?.fontFamily || FONT_PRIMARY;

  const leftColumnChildren: Paragraph[] = [];

  if (isPersonalNonGst && personalIssuer) {
    // 1. Personal Name
    leftColumnChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: personalIssuer.name.toUpperCase(),
            bold: true,
            size: 22,
            font: fontPrimary,
            color: palette.primary,
          }),
        ],
      }),
      // 2. Designation
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: personalIssuer.designation || 'Strategic & Financial Advisory Consultant',
            italics: true,
            size: 17,
            font: fontPrimary,
            color: COLOR_SLATE,
          }),
        ],
      }),
      // 3. Location
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: personalIssuer.address || firm.officeLocations || 'Registered Office: Mumbai | Pune | Bengaluru | Delhi NCR',
            size: 16,
            font: fontPrimary,
            color: COLOR_MUTED,
          }),
        ],
      }),
      // 4. PAN & Status with pipes
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          ...(personalIssuer.pan
            ? [
                new TextRun({ text: 'PAN: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
                new TextRun({ text: personalIssuer.pan, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
                new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
              ]
            : []),
          new TextRun({ text: 'Status: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: 'Individual Advisory Mandate / Non-GST', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
        ],
      }),
      // 5. Contact with pipes
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 20 },
        children: [
          ...(personalIssuer.email
            ? [
                new TextRun({ text: 'Email: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
                new TextRun({ text: personalIssuer.email, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
                new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
              ]
            : []),
          new TextRun({ text: 'Phone: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: personalIssuer.phone || firm.firmPhone || '+91 93708 88819', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
        ],
      })
    );
  } else {
    // 1. Firm Name
    leftColumnChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: firm.firmName.toUpperCase(),
            bold: true,
            size: 22,
            font: fontPrimary,
            color: palette.primary,
          }),
        ],
      }),
      // 2. Tagline
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: firm.tagline || 'Strategic & Financial Advisory Services',
            italics: true,
            size: 17,
            font: fontPrimary,
            color: COLOR_SLATE,
          }),
        ],
      }),
      // 3. Location / Office
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({
            text: firm.officeLocations || 'Registered Office: Mumbai | Pune | Bengaluru | Delhi NCR',
            size: 16,
            font: fontPrimary,
            color: COLOR_MUTED,
          }),
        ],
      }),
      // 4. Statutory details cleanly laid out to prevent line wrapping
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 12 },
        children: [
          new TextRun({ text: 'GSTIN: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: firm.gstin, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
          new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
          new TextRun({ text: 'PAN: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: firm.pan, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
          ...(firm.cin
            ? [
                new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
                new TextRun({ text: 'CIN: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
                new TextRun({ text: firm.cin, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
              ]
            : []),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 15 },
        children: [
          new TextRun({ text: 'SAC Code: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: firm.sacCode || '998311', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
          new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
          new TextRun({ text: 'Sector: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: 'Strategic & Financial Advisory Services', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
        ],
      }),
      // 5. Contact with pipes (|)
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 20 },
        children: [
          new TextRun({ text: 'Email: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: firm.firmEmail || 'contact@gfpconsulting.in', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
          new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
          new TextRun({ text: 'Phone: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
          new TextRun({ text: firm.firmPhone || '+91 93708 88819', bold: true, size: 16, font: fontPrimary, color: palette.primary }),
          ...(firm.firmWebsite
            ? [
                new TextRun({ text: '   |   ', size: 16, font: fontPrimary, color: COLOR_MUTED }),
                new TextRun({ text: 'Web: ', size: 16, font: fontPrimary, color: COLOR_SLATE }),
                new TextRun({ text: firm.firmWebsite, bold: true, size: 16, font: fontPrimary, color: palette.primary }),
              ]
            : []),
        ],
      })
    );
  }

  // Right column: Watermark notice + Right-aligned Logo (PROMINENT AND BIG)
  const rightColumnChildren: Paragraph[] = [];

  if (config?.includeWatermark && config?.watermarkText) {
    rightColumnChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 12 },
        children: [
          new TextRun({
            text: `[ ${config.watermarkText.toUpperCase()} ]`,
            bold: true,
            size: 14,
            font: fontPrimary,
            color: '94A3B8',
          }),
        ],
      })
    );
  }

  if (logoBytes) {
    // Ensure the logo is BIG as requested by user
    const displayWidth = Math.max(160, Math.round(logoWidth * 1.15));
    const displayHeight = Math.max(50, Math.round(logoHeight * 1.15));

    rightColumnChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 5, after: 15 },
        children: [
          new ImageRun({
            data: logoBytes,
            transformation: {
              width: displayWidth,
              height: displayHeight,
            },
            type: 'png',
          }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: palette.primary },
      top: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            margins: { top: 10, bottom: 25, left: 0, right: 15 },
            children: leftColumnChildren,
          }),
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            margins: { top: 10, bottom: 25, left: 15, right: 0 },
            children: rightColumnChildren.length > 0 ? rightColumnChildren : [new Paragraph({})],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the default native Microsoft Word Header component
 */
function createWordNativeHeader(
  firm: FirmProfile,
  isPersonalNonGst: boolean,
  personalIssuer?: { name: string; designation?: string; pan?: string; email?: string; phone?: string; address?: string },
  config?: WordDocConfig
): Header {
  const headerTable = createWordHeaderTable(firm, isPersonalNonGst, personalIssuer, config);
  return new Header({
    children: [headerTable],
  });
}

function createExecutiveLetterheadTable(
  firm: FirmProfile,
  logoPosition: 'left' | 'right' | 'center' = 'center',
  personalIssuer?: { name: string; designation?: string; pan?: string; email?: string; phone?: string; address?: string },
  config?: WordDocConfig
): Table {
  return createWordHeaderTable(
    firm,
    Boolean(personalIssuer),
    personalIssuer,
    config
  );
}

/**
 * Resolves all active service offerings bundled in this engagement
 */
function getActiveServices(record: EngagementRecord): ServiceTemplate[] {
  if (record.services && record.services.length > 0) {
    return record.services;
  }
  return [record.service];
}

/**
 * Exports Engagement Letter as executive-level DOCX
 */
export async function exportEngagementLetterDocx(
  record: EngagementRecord,
  firm: FirmProfile,
  customConfig?: WordDocConfig
): Promise<Blob> {
  const docConfig = resolveWordDocConfig(record, firm, customConfig);
  const palette = getThemePalette(docConfig.colorTheme);
  const fontPrimary = docConfig.fontFamily || FONT_PRIMARY;

  const { client } = record;
  const activeServices = getActiveServices(record);
  const primaryService = activeServices[0] || record.service;
  const isMultiService = activeServices.length > 1;

  // Active signatory resolution
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

  const isPersonalNonGst =
    record.invoiceIssuerType === 'personal' || record.isNonGstInvoice === true;

  const logoPosition = firm.logoPosition || firm.themeSettings?.logoPosition || 'left';
  const expectedTimeline = record.projectTimeline || primaryService.projectTimeline || '3 to 4 Weeks';
  const clientEnablersNote =
    record.clientEnablersClause ||
    primaryService.clientEnablersClause ||
    'Adherence to this project timeline is strictly subject to the timely provision of requisite documentation, business records, and scheduled stakeholder interactions by your team.';

  // Aggregate financials
  const totalBaseFee = activeServices.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0);
  
  // Discount calculation
  let discountAmount = 0;
  if (record.discountConfig?.enabled && record.discountConfig.value > 0) {
    if (record.discountConfig.type === 'percent') {
      discountAmount = Math.round((totalBaseFee * record.discountConfig.value) / 100);
    } else {
      discountAmount = Math.min(record.discountConfig.value, totalBaseFee);
    }
  }
  const taxableSubtotal = Math.max(0, totalBaseFee - discountAmount);

  // GST Calculation
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

  // Advance Calculation
  const advancePercent = record.customAdvancePercent || primaryService.pricing?.customAdvancePercent || 50;
  const advanceAmount = Math.round((taxableSubtotal * advancePercent) / 100);
  const advanceGstAmount = isPersonalNonGst ? 0 : Math.round((advanceAmount * gstRate) / 100);
  const advanceGrandTotal = advanceAmount + advanceGstAmount;

  // TDS Calculation
  let tdsAmount = 0;
  if (record.tdsConfig?.enabled && record.tdsConfig.ratePercent > 0) {
    tdsAmount = Math.round((taxableSubtotal * record.tdsConfig.ratePercent) / 100);
  }

  // Payment QR Resolution for Letter
  const letterCustomQr = record.qrCodeDataUrl || firm.qrCodeDataUrl || firm.bankDetails.qrCodeDataUrl;
  const letterQrResult = await getQrImageBytes(letterCustomQr, {
    upiId: firm.bankDetails.upiId || 'audit@gfpconsulting.in',
    payeeName: firm.bankDetails.accountHolderName || firm.firmName,
    amount: advanceGrandTotal,
    invoiceNo: record.refNo || 'ENG-001',
  });

  // Combined title — dynamic subject respecting template subject line or individual service title
  const engagementSubject = isMultiService
    ? `ENGAGEMENT CHARTER FOR ADVISORY SERVICES — ${activeServices.map((s) => s.serviceTitle.toUpperCase()).join(' & ')}`
    : (primaryService.subjectLine
        ? primaryService.subjectLine.toUpperCase()
        : `ENGAGEMENT FOR ${primaryService.serviceTitle.toUpperCase()}`);

  // Sequential Section Numbering to ensure proper headings & references
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
  const acceptanceSecNum = `${secCount++}`;

  // Build document sections
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: getDocMargins(docConfig.margins, true),
          },
        },
        headers: {
          default: createWordNativeHeader(
            firm,
            isPersonalNonGst,
            isPersonalNonGst ? record.personalIssuer : undefined,
            docConfig
          ),
        },

        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        margins: { top: 60 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Prepared exclusively for ${client.companyName || client.addresseeName}. Strictly Private & Confidential.`,
                                size: 18,
                                font: FONT_PRIMARY,
                                color: COLOR_MUTED,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        margins: { top: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: 'Page ',
                                size: 18,
                                font: FONT_PRIMARY,
                                color: COLOR_MUTED,
                              }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                size: 18,
                                font: FONT_PRIMARY,
                                color: COLOR_NAVY,
                                bold: true,
                              }),
                              new TextRun({
                                text: ' of ',
                                size: 18,
                                font: FONT_PRIMARY,
                                color: COLOR_MUTED,
                              }),
                              new TextRun({
                                children: [PageNumber.TOTAL_PAGES],
                                size: 18,
                                font: FONT_PRIMARY,
                                color: COLOR_NAVY,
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // 1. Engagement Metadata Strip
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'REFERENCE NO: ', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE }),
                          new TextRun({ text: record.refNo, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'DATE OF ISSUE: ', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE }),
                          new TextRun({ text: record.date, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(8),

          // 3. Client Addressee Box
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({ text: 'To,', bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_SLATE }),
            ],
          }),
          new Paragraph({
            spacing: { after: 20 },
            children: [
              new TextRun({ text: client.addresseeName, bold: true, size: 26, font: FONT_PRIMARY, color: COLOR_NAVY }),
            ],
          }),
          ...(client.designation
            ? [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [new TextRun({ text: client.designation, size: 23, font: FONT_PRIMARY, color: COLOR_SLATE })],
                }),
              ]
            : []),
          ...(client.companyName
            ? [
                new Paragraph({
                  spacing: { after: 20 },
                  children: [new TextRun({ text: client.companyName, bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_CHARCOAL })],
                }),
              ]
            : []),
          ...(client.billingAddress
            ? client.billingAddress.split('\n').map(
                (line) =>
                  new Paragraph({
                    spacing: { after: 20 },
                    children: [new TextRun({ text: line, size: 23, font: FONT_PRIMARY, color: COLOR_SLATE })],
                  })
              )
            : []),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `State: ${client.state || 'Maharashtra'}`, size: 23, font: FONT_PRIMARY, color: COLOR_SLATE }),
              ...(client.gstin
                ? [new TextRun({ text: `   |   GSTIN: ${client.gstin}`, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })]
                : []),
              ...(client.pan
                ? [new TextRun({ text: `   |   PAN: ${client.pan}`, size: 23, font: FONT_PRIMARY, color: COLOR_SLATE })]
                : []),
            ],
          }),

          createVerticalSpacer(4),

          // 4. Subject Card Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_NAVY },
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 90, bottom: 90, left: 160, right: 160 },
                    shading: { fill: COLOR_BG_ACCENT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'SUBJECT: ',
                            bold: true,
                            size: 24,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                          new TextRun({
                            text: engagementSubject,
                            bold: true,
                            size: 24,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // 5. Salutation & Opening
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `${client.salutation || 'Dear Sir'},`,
                bold: true,
                size: 24,
                font: FONT_PRIMARY,
                color: COLOR_CHARCOAL,
              }),
            ],
          }),

          ...primaryService.openingParagraphs.map(
            (p) =>
              new Paragraph({
                spacing: { after: 90 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: p,
                    size: 24,
                    font: FONT_PRIMARY,
                    color: COLOR_CHARCOAL,
                  }),
                ],
              })
          ),

          // 1. Key Engagement Objectives & Strategic Focus (when present)
          ...(hasObjectives && objectivesSecNum
            ? [
                createVerticalSpacer(4),
                createSectionHeader('Key Engagement Objectives & Strategic Focus', objectivesSecNum),
                createVerticalSpacer(4),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    left: { style: BorderStyle.SINGLE, size: 16, color: COLOR_COBALT },
                    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  },
                  rows: [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_STANDARD,
                          shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              spacing: { after: 20 },
                              children: [
                                new TextRun({
                                  text: 'The principal objectives of this strategic advisory mandate comprise:',
                                  bold: true,
                                  size: 23,
                                  font: FONT_PRIMARY,
                                  color: COLOR_NAVY,
                                }),
                              ],
                            }),
                            ...activeServices.flatMap((srv) =>
                              (srv.objectives || [])
                                .filter((obj) => obj.include)
                                .map(
                                  (obj, oIdx) =>
                                    new Paragraph({
                                      spacing: { after: 15 },
                                      children: [
                                        new TextRun({
                                          text: `${oIdx + 1}.  `,
                                          bold: true,
                                          size: 23,
                                          font: FONT_PRIMARY,
                                          color: COLOR_COBALT,
                                        }),
                                        new TextRun({
                                          text: obj.text,
                                          size: 23,
                                          font: FONT_PRIMARY,
                                          color: COLOR_CHARCOAL,
                                        }),
                                      ],
                                    })
                                )
                            ),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                createVerticalSpacer(6),
              ]
            : []),

          // Multi-Service Executive Summary Table
          ...(isMultiService && overviewSecNum
            ? [
                createVerticalSpacer(4),
                createSectionHeader('Executive Overview of Engaged Service Offerings', overviewSecNum),
                createVerticalSpacer(4),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
                    left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        new TableCell({
                          width: { size: 12, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_HEADER,
                          shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'REF #', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                        }),
                        new TableCell({
                          width: { size: 58, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_HEADER,
                          shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                          children: [new Paragraph({ children: [new TextRun({ text: 'SERVICE OFFERING & ADVISORY FOCUS', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                        }),
                        new TableCell({
                          width: { size: 30, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_HEADER,
                          shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'INVESTMENT (INR)', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                        }),
                      ],
                    }),
                    ...activeServices.map((srv, sIdx) => {
                      return new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 12, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_STANDARD,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `S-${sIdx + 1}`, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                          }),
                          new TableCell({
                            width: { size: 58, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_STANDARD,
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({ text: srv.serviceTitle, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL }),
                                ],
                              }),
                              new Paragraph({
                                children: [
                                  new TextRun({ text: `Scope: ${srv.deliverables.filter((d) => d.include).length} Key Deliverables | Timeline: ${srv.projectTimeline || '3 to 4 Weeks'}`, size: 20, font: FONT_PRIMARY, color: COLOR_MUTED }),
                                ],
                              }),
                            ],
                          }),
                          new TableCell({
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_STANDARD,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(srv.pricing.feeAmount), bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                          }),
                        ],
                      });
                    }),
                  ],
                }),
                createVerticalSpacer(6),
              ]
            : []),

          // Scope of Work & Deliverables (with dynamic section and item numbering)
          createSectionHeader(isMultiService ? 'Itemized Scope of Work & Deliverables by Service Line' : 'Scope of Work & Deliverables', scopeSecNum),
          createVerticalSpacer(4),

          ...activeServices.flatMap((srv, sIdx) => {
            const includedDels = srv.deliverables.filter((d) => d.include);
            const prefix = isMultiService ? `${scopeSecNum}.${sIdx + 1}` : scopeSecNum;
            const numberedDels = getNumberedDeliverables(includedDels, prefix);

            return [
              ...(isMultiService
                ? [
                    new Paragraph({
                      spacing: { before: 120, after: 60 },
                      children: [
                        new TextRun({
                          text: `Service Module ${sIdx + 1}: ${srv.serviceTitle}`,
                          bold: true,
                          size: 25,
                          font: FONT_PRIMARY,
                          color: COLOR_COBALT,
                        }),
                      ],
                    }),
                  ]
                : []),
              ...numberedDels.map((del) => {
                const heading = del.formattedHeading;
                return new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    left: { style: BorderStyle.SINGLE, size: 16, color: COLOR_COBALT },
                    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  },
                  rows: [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_STANDARD,
                          shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              spacing: { after: 30 },
                              children: [
                                new TextRun({
                                  text: heading,
                                  bold: true,
                                  size: 24,
                                  font: FONT_PRIMARY,
                                  color: COLOR_NAVY,
                                }),
                              ],
                            }),
                            new Paragraph({
                              spacing: { after: 20 },
                              alignment: AlignmentType.JUSTIFIED,
                              children: [
                                new TextRun({
                                  text: del.body,
                                  size: 23,
                                  font: FONT_PRIMARY,
                                  color: COLOR_CHARCOAL,
                                }),
                              ],
                            }),
                            ...(del.subDeliverables && del.subDeliverables.length > 0
                              ? [
                                  new Paragraph({
                                    spacing: { before: 40, after: 20 },
                                    children: [
                                      new TextRun({
                                        text: 'Key Sub-Deliverables & Milestones:',
                                        bold: true,
                                        size: 21,
                                        font: FONT_PRIMARY,
                                        color: COLOR_NAVY,
                                      }),
                                    ],
                                  }),
                                  ...del.subDeliverables.map(
                                    (sub) =>
                                      new Paragraph({
                                        bullet: { level: 0 },
                                        spacing: { after: 15 },
                                        children: [
                                          new TextRun({
                                            text: `${sub.title}`,
                                            bold: true,
                                            size: 21,
                                            font: FONT_PRIMARY,
                                            color: COLOR_CHARCOAL,
                                          }),
                                          ...(sub.description
                                            ? [
                                                new TextRun({
                                                  text: ` — ${sub.description}`,
                                                  size: 20,
                                                  font: FONT_PRIMARY,
                                                  color: COLOR_SLATE,
                                                }),
                                              ]
                                            : []),
                                        ],
                                      })
                                  ),
                                ]
                              : []),
                          ],
                        }),
                      ],
                    }),
                  ],
                });
              }),
              createVerticalSpacer(3),
            ];
          }),

          createVerticalSpacer(4),

          // Information & Documentation Required from Client (when present)
          ...(hasInfoRequired && infoSecNum
            ? [
                createVerticalSpacer(4),
                createSectionHeader('Information & Documentation Required from Client', infoSecNum),
                createVerticalSpacer(4),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                    left: { style: BorderStyle.SINGLE, size: 16, color: COLOR_NAVY },
                    right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  },
                  rows: [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_STANDARD,
                          shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              spacing: { after: 20 },
                              children: [
                                new TextRun({
                                  text: 'To ensure timely and effective execution, the client shall furnish the following records & documentation:',
                                  bold: true,
                                  size: 23,
                                  font: FONT_PRIMARY,
                                  color: COLOR_NAVY,
                                }),
                              ],
                            }),
                            ...activeServices.flatMap((srv) =>
                              (srv.informationRequired || [])
                                .filter((info) => info.include)
                                .map(
                                  (info, iIdx) =>
                                    new Paragraph({
                                      spacing: { after: 15 },
                                      children: [
                                        new TextRun({
                                          text: `${iIdx + 1}.  `,
                                          bold: true,
                                          size: 23,
                                          font: FONT_PRIMARY,
                                          color: COLOR_COBALT,
                                        }),
                                        new TextRun({
                                          text: info.text,
                                          size: 23,
                                          font: FONT_PRIMARY,
                                          color: COLOR_CHARCOAL,
                                        }),
                                      ],
                                    })
                                )
                            ),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                createVerticalSpacer(6),
              ]
            : []),

          // Project Delivery Timeline & Client Enablers
          createSectionHeader('Project Delivery Timeline & Client Enablers', timelineSecNum),
          createVerticalSpacer(4),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 18, color: COLOR_NAVY },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    shading: { fill: COLOR_BG_ACCENT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        spacing: { after: 30 },
                        children: [
                          new TextRun({ text: 'Committed Engagement Timeline: ', bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_NAVY }),
                          new TextRun({ text: expectedTimeline, bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_COBALT }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [
                          new TextRun({ text: clientEnablersNote, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // Professional Investment & Commercial Schedule
          createSectionHeader('Professional Investment & Commercial Schedule', commercialSecNum),
          createVerticalSpacer(4),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_NAVY },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              // Header Row
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '#', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 52, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'DESCRIPTION OF ADVISORY SERVICES', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isPersonalNonGst ? 'STATUS' : 'SAC CODE', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'AMOUNT (INR)', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                ],
              }),

              // Line Items for each service
              ...activeServices.map((srv, sIdx) => {
                return new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 8, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${sIdx + 1}`, bold: true, size: 23, font: FONT_PRIMARY })] })],
                    }),
                    new TableCell({
                      width: { size: 52, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: srv.serviceTitle, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: `Comprehensive advisory deliverable bundle (${srv.deliverables.filter((d) => d.include).length} deliverables)`, size: 21, font: FONT_PRIMARY, color: COLOR_MUTED })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 18, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isPersonalNonGst ? 'Non-GST' : (firm.sacCode || '998311'), size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                    }),
                    new TableCell({
                      width: { size: 22, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(srv.pricing.feeAmount), bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL })] })],
                    }),
                  ],
                });
              }),

              // Discount Row (if any)
              ...(discountAmount > 0
                ? [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 78, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          columnSpan: 3,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: `Less: Agreed Professional Fee Concession (${record.discountConfig?.type === 'percent' ? `${record.discountConfig.value}%` : 'Special Discount'}):`,
                                  size: 22,
                                  font: FONT_PRIMARY,
                                  color: COLOR_SLATE,
                                  italics: true,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 22, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: `- ${formatIndianCurrency(discountAmount)}`,
                                  bold: true,
                                  size: 22,
                                  font: FONT_PRIMARY,
                                  color: 'DC2626',
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),

              // Taxable Base Row
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 78, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    columnSpan: 3,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Taxable Professional Base Investment:', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(taxableSubtotal), bold: true, size: 22, font: FONT_PRIMARY })] })],
                  }),
                ],
              }),

              // GST Breakdown Rows
              ...(!isPersonalNonGst
                ? isInterState
                  ? [
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Add: IGST @ 18% (Inter-State Out-of-State Supply):', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(igstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                    ]
                  : [
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Add: Central GST (CGST) @ 9%:', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(cgstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Add: State GST (SGST) @ 9%:', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(sgstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                    ]
                : [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 78, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          columnSpan: 3,
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'GST Liability: Nil (Personal Advisory / Non-GST Bill of Supply):', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                        }),
                        new TableCell({
                          width: { size: 22, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '₹ 0.00', size: 22, font: FONT_PRIMARY })] })],
                        }),
                      ],
                    }),
                  ]),

              // TDS Deduction Note (if enabled)
              ...(tdsAmount > 0
                ? [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 78, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          columnSpan: 3,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: `Less: Anticipated TDS Deductible under Sec ${record.tdsConfig?.section || '194J'} (${record.tdsConfig?.ratePercent}%):`,
                                  size: 22,
                                  font: FONT_PRIMARY,
                                  color: COLOR_SLATE,
                                  italics: true,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 22, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: `- ${formatIndianCurrency(tdsAmount)}`,
                                  bold: true,
                                  size: 22,
                                  font: FONT_PRIMARY,
                                  color: '2563EB',
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),

              // Grand Total Row
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 78, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    columnSpan: 3,
                    shading: { fill: COLOR_HIGHLIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'TOTAL COMMERCIAL INVESTMENT (GROSS INCL. TAX):', bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: COLOR_HIGHLIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(grandTotal), bold: true, size: 25, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(3),

          // Total in Indian Words Box
          new Paragraph({
            spacing: { before: 40, after: 60 },
            children: [
              new TextRun({ text: 'Amount in Words: ', bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY }),
              new TextRun({ text: numberToIndianWords(grandTotal), italics: true, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL }),
            ],
          }),

          createVerticalSpacer(4),

          // Milestone Payment Schedule Table
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: 'Milestone Remittance Structure:', bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_NAVY }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: `Stage 1: Mobilization Advance (${advancePercent}%)`, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Payable prior to assignment kickoff', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${formatIndianCurrency(advanceGrandTotal)} incl. tax`, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_COBALT })] })],
                  }),
                ],
              }),
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: `Stage 2: Balance Milestone (${100 - advancePercent}%)`, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: 'Payable upon final deliverables release', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${formatIndianCurrency(grandTotal - advanceGrandTotal)} incl. tax`, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_CHARCOAL })] })],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // Bank Details & Remittance Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 14, color: COLOR_NAVY },
              right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: letterQrResult.bytes ? 72 : 100, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [new TextRun({ text: 'OFFICIAL BANK ACCOUNT & REMITTANCE INSTRUCTIONS', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        spacing: { after: 12 },
                        children: [
                          new TextRun({ text: 'Beneficiary Name: ', bold: true, size: 22, font: FONT_PRIMARY }),
                          new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.name || firm.bankDetails.accountHolderName : firm.bankDetails.accountHolderName, size: 22, font: FONT_PRIMARY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 12 },
                        children: [
                          new TextRun({ text: 'Bank & Branch: ', bold: true, size: 22, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.bankNameBranch, size: 22, font: FONT_PRIMARY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 12 },
                        children: [
                          new TextRun({ text: 'Current A/c No: ', bold: true, size: 22, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.accountNumber, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY }),
                          new TextRun({ text: '   |   IFSC Code: ', bold: true, size: 22, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.ifscCode, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'UPI ID: ', bold: true, size: 22, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.upiId, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_COBALT }),
                        ],
                      }),
                    ],
                  }),
                  ...(letterQrResult.bytes
                    ? [
                        new TableCell({
                          width: { size: 28, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new ImageRun({
                                  data: letterQrResult.bytes as any,
                                  transformation: { width: 115, height: 115 },
                                  type: 'png' as any,
                                }),
                              ],
                            }),
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 10 },
                              children: [
                                new TextRun({
                                  text: 'SCAN TO REMIT VIA UPI',
                                  bold: true,
                                  size: 16,
                                  font: FONT_PRIMARY,
                                  color: COLOR_NAVY,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ]
                    : []),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // Assumptions & Out of Scope Matrix
          createSectionHeader('Professional Assumptions & Scope Boundaries', assumptionsSecNum),
          createVerticalSpacer(4),

          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: '• Baseline Documentation: All findings and strategic evaluations are based upon management representations and document disclosures provided by your team.',
                size: 23,
                font: FONT_PRIMARY,
                color: COLOR_CHARCOAL,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: '• Sovereign Approvals: Where government subsidies or bank debt limits are involved, final sanction and disbursement remain at the sole discretion of the respective sovereign committees.',
                size: 23,
                font: FONT_PRIMARY,
                color: COLOR_CHARCOAL,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: '• Scope Boundaries: This engagement is strictly for strategic management consulting and does not constitute statutory audit certification, legal advocacy representation, or commercial litigation representation.',
                size: 23,
                font: FONT_PRIMARY,
                color: COLOR_CHARCOAL,
              }),
            ],
          }),

          createVerticalSpacer(6),

          // Acceptance & Dual Signature Block
          createSectionHeader('Formal Acceptance & Counter-Signatory Execution', acceptanceSecNum),
          createVerticalSpacer(4),

          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'Kindly confirm your acceptance of the terms, scope, and commercial investment of this Engagement Charter by executing below:',
                size: 24,
                font: FONT_PRIMARY,
                color: COLOR_CHARCOAL,
              }),
            ],
          }),

          // Side-by-Side Dual Signature Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  // Firm Signatory
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [
                          new TextRun({
                            text: `FOR ${firm.firmName.toUpperCase()}`,
                            bold: true,
                            size: 23,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 360 }, // Ample signature space
                        children: [new TextRun({ text: '', size: 22 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: '______________________________________', font: FONT_PRIMARY, color: COLOR_BORDER_DARK })],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [new TextRun({ text: activeSignatory.name, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: activeSignatory.designation, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: `Date: ${record.date}`, size: 20, font: FONT_PRIMARY, color: COLOR_MUTED })],
                      }),
                    ],
                  }),

                  // Client Signatory
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [
                          new TextRun({
                            text: `ACCEPTED & AGREED FOR ${client.companyName ? client.companyName.toUpperCase() : client.addresseeName.toUpperCase()}`,
                            bold: true,
                            size: 23,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 360 }, // Ample signature space
                        children: [new TextRun({ text: '', size: 22 })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: '______________________________________', font: FONT_PRIMARY, color: COLOR_BORDER_DARK })],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [new TextRun({ text: client.addresseeName, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: client.designation || 'Authorized Signatory', size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Date: ________________________', size: 20, font: FONT_PRIMARY, color: COLOR_MUTED })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Exports Pro-Forma Invoice / Bill of Supply as executive-level DOCX
 */
export async function exportProFormaInvoiceDocx(
  record: EngagementRecord,
  firm: FirmProfile,
  customConfig?: WordDocConfig
): Promise<Blob> {
  const docConfig = resolveWordDocConfig(record, firm, customConfig);
  const palette = getThemePalette(docConfig.colorTheme);
  const fontPrimary = docConfig.fontFamily || FONT_PRIMARY;

  const { client } = record;
  const activeServices = getActiveServices(record);
  const primaryService = activeServices[0] || record.service;
  const isMultiService = activeServices.length > 1;

  const isPersonalNonGst =
    record.invoiceIssuerType === 'personal' || record.isNonGstInvoice === true;

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

  const totalBaseFee = activeServices.reduce((acc, s) => acc + (s.pricing?.feeAmount || 0), 0);

  // Multiplier / Milestone calculation matching preview logic
  const allMilestones = primaryService.pricing?.paymentSplit || [];
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
    milestoneDescription = `${selected.label || selected.milestone} (${selected.percent}%)`;
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

  const shouldChargeGst = !isPersonalNonGst && milestoneApplyGst;
  const gstPercent = shouldChargeGst ? 18 : 0;
  const totalGstAmount = shouldChargeGst ? Math.round((baseAmount * gstPercent) / 100) : 0;
  const cgstAmount = shouldChargeGst && !isInterState ? Math.round(totalGstAmount / 2) : 0;
  const sgstAmount = shouldChargeGst && !isInterState ? Math.round(totalGstAmount / 2) : 0;
  const igstAmount = shouldChargeGst && isInterState ? totalGstAmount : 0;
  const grossTotal = baseAmount + totalGstAmount;

  // TDS note
  let tdsAmount = 0;
  if (record.tdsConfig?.enabled && record.tdsConfig.ratePercent > 0) {
    tdsAmount = Math.round((baseAmount * record.tdsConfig.ratePercent) / 100);
  }

  // Payment QR Resolution: Priority record.qrCodeDataUrl > firm.qrCodeDataUrl > firm.bankDetails.qrCodeDataUrl > fallback UPI
  const customQrDataUrl = record.qrCodeDataUrl || firm.qrCodeDataUrl || firm.bankDetails.qrCodeDataUrl;
  const qrResult = await getQrImageBytes(customQrDataUrl, {
    upiId: firm.bankDetails.upiId || 'audit@gfpconsulting.in',
    payeeName: firm.bankDetails.accountHolderName || firm.firmName,
    amount: grossTotal,
    invoiceNo: record.invoiceNo || 'INV-001',
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: getDocMargins(docConfig.margins, true),
          },
        },
        headers: {
          default: createWordNativeHeader(
            firm,
            isPersonalNonGst,
            isPersonalNonGst ? record.personalIssuer : undefined,
            docConfig
          ),
        },
        children: [
          // 1. Invoice Document Title
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: isPersonalNonGst ? 'PRO-FORMA INVOICE / BILL OF SUPPLY' : 'PRO-FORMA TAX INVOICE',
                            bold: true,
                            size: 28,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: isPersonalNonGst ? '(Issued under Non-GST Advisory Scheme)' : '(Issued under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules)',
                            italics: true,
                            size: 20,
                            font: FONT_PRIMARY,
                            color: COLOR_MUTED,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // 3. Invoice Metadata Matrix (Invoice #, Date, Ref #, Place of Supply)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'INVOICE NUMBER:', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: record.invoiceNo, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'INVOICE DATE:', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: record.date, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                ],
              }),
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'ENGAGEMENT REF:', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: record.refNo, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_CHARCOAL })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'PLACE OF SUPPLY:', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    children: [new Paragraph({ children: [new TextRun({ text: client.state || 'Maharashtra (27)', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // 4. Billed By vs Billed To Boxes
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  // Billed By
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [new TextRun({ text: 'BILLED BY (SUPPLIER):', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.name.toUpperCase() || firm.firmName.toUpperCase() : firm.firmName.toUpperCase(), bold: true, size: 23, font: FONT_PRIMARY })],
                      }),
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [new TextRun({ text: firm.officeLocations, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })],
                      }),
                      ...(!isPersonalNonGst
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'GSTIN: ', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_NAVY }),
                                new TextRun({ text: firm.gstin, bold: true, size: 21, font: FONT_PRIMARY }),
                              ],
                            }),
                          ]
                        : []),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'PAN: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.pan || firm.pan : firm.pan, size: 21, font: FONT_PRIMARY }),
                        ],
                      }),
                    ],
                  }),

                  // Billed To
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [new TextRun({ text: 'BILLED TO (RECIPIENT):', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [new TextRun({ text: client.companyName || client.addresseeName, bold: true, size: 23, font: FONT_PRIMARY })],
                      }),
                      ...(client.companyName && client.addresseeName
                        ? [
                            new Paragraph({
                              spacing: { after: 10 },
                              children: [new TextRun({ text: `Attn: ${client.addresseeName} (${client.designation || 'Signatory'})`, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })],
                            }),
                          ]
                        : []),
                      ...(client.billingAddress
                        ? client.billingAddress.split('\n').map(
                            (line) =>
                              new Paragraph({
                                spacing: { after: 10 },
                                children: [new TextRun({ text: line, size: 21, font: FONT_PRIMARY, color: COLOR_SLATE })],
                              })
                          )
                        : []),
                      ...(client.gstin
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'GSTIN: ', bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_NAVY }),
                                new TextRun({ text: client.gstin, bold: true, size: 21, font: FONT_PRIMARY }),
                              ],
                            }),
                          ]
                        : []),
                      ...(client.pan
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({ text: 'PAN: ', bold: true, size: 21, font: FONT_PRIMARY }),
                                new TextRun({ text: client.pan, size: 21, font: FONT_PRIMARY }),
                              ],
                            }),
                          ]
                        : []),
                    ],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(6),

          // 5. Itemized Table of Advisory Services
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_NAVY },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_NAVY },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              // Header
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '#', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 52, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: 'SERVICE DESCRIPTION & MILESTONE', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isPersonalNonGst ? 'STATUS' : 'SAC CODE', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: palette.highlight, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'TAXABLE VALUE (₹)', bold: true, size: 21, color: palette.primary, font: fontPrimary })] })],
                  }),
                ],
              }),

              // Line Items
              ...activeServices.map((srv, sIdx) => {
                const itemTaxable = (srv.pricing.feeAmount || 0) * multiplier;
                return new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      width: { size: 8, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${sIdx + 1}`, bold: true, size: 23, font: FONT_PRIMARY })] })],
                    }),
                    new TableCell({
                      width: { size: 52, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: srv.serviceTitle, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: `${milestoneDescription} — Execution under Ref ${record.refNo}`, size: 21, font: FONT_PRIMARY, color: COLOR_MUTED })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 18, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: isPersonalNonGst ? 'Non-GST' : (firm.sacCode || '998311'), size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                    }),
                    new TableCell({
                      width: { size: 22, type: WidthType.PERCENTAGE },
                      margins: CELL_PADDING_STANDARD,
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(itemTaxable), bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL })] })],
                    }),
                  ],
                });
              }),

              // Subtotal Taxable Value
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 78, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    columnSpan: 3,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Total Taxable Value:', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_COMPACT,
                    shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(baseAmount), bold: true, size: 22, font: FONT_PRIMARY })] })],
                  }),
                ],
              }),

              // GST Rows
              ...(!isPersonalNonGst
                ? isInterState
                  ? [
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Integrated GST (IGST) @ 18%:', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(igstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                    ]
                  : [
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Central GST (CGST) @ 9%:', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(cgstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                      new TableRow({
                        cantSplit: true,
                        children: [
                          new TableCell({
                            width: { size: 78, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            columnSpan: 3,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'State GST (SGST) @ 9%:', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                          }),
                          new TableCell({
                            width: { size: 22, type: WidthType.PERCENTAGE },
                            margins: CELL_PADDING_COMPACT,
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(sgstAmount), size: 22, font: FONT_PRIMARY })] })],
                          }),
                        ],
                      }),
                    ]
                : [
                    new TableRow({
                      cantSplit: true,
                      children: [
                        new TableCell({
                          width: { size: 78, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          columnSpan: 3,
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'GST Liability: Nil (Personal Advisory / Non-GST Bill of Supply):', size: 22, font: FONT_PRIMARY, color: COLOR_SLATE })] })],
                        }),
                        new TableCell({
                          width: { size: 22, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '₹ 0.00', size: 22, font: FONT_PRIMARY })] })],
                        }),
                      ],
                    }),
                  ]),

              // Grand Total
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 78, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    columnSpan: 3,
                    shading: { fill: COLOR_HIGHLIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'TOTAL INVOICE PAYABLE AMOUNT (₹):', bold: true, size: 24, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                  new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_HEADER,
                    shading: { fill: COLOR_HIGHLIGHT, type: ShadingType.CLEAR },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIndianCurrency(grossTotal), bold: true, size: 25, font: FONT_PRIMARY, color: COLOR_NAVY })] })],
                  }),
                ],
              }),
            ],
          }),

          createVerticalSpacer(3),

          // Total in Words
          new Paragraph({
            spacing: { before: 40, after: 60 },
            children: [
              new TextRun({ text: 'Invoice Amount in Words: ', bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_NAVY }),
              new TextRun({ text: numberToIndianWords(grossTotal), italics: true, bold: true, size: 23, font: FONT_PRIMARY, color: COLOR_CHARCOAL }),
            ],
          }),

          createVerticalSpacer(4),

          // 6. Bank Details Box & Authorized Signatory Block
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  // Bank Details Box
                  new TableCell({
                    width: { size: qrResult.bytes ? 43 : 55, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        spacing: { after: 20 },
                        children: [new TextRun({ text: 'REMITTANCE INSTRUCTIONS & BANK DETAILS:', bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [
                          new TextRun({ text: 'Account Holder: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.name || firm.bankDetails.accountHolderName : firm.bankDetails.accountHolderName, size: 21, font: FONT_PRIMARY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [
                          new TextRun({ text: 'Bank & Branch: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.bankNameBranch, size: 21, font: FONT_PRIMARY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [
                          new TextRun({ text: 'Account Number: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.accountNumber, bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_NAVY }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 10 },
                        children: [
                          new TextRun({ text: 'IFSC Code: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.ifscCode, bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_NAVY }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'UPI ID: ', bold: true, size: 21, font: FONT_PRIMARY }),
                          new TextRun({ text: firm.bankDetails.upiId, bold: true, size: 21, font: FONT_PRIMARY, color: COLOR_COBALT }),
                        ],
                      }),
                    ],
                  }),

                  // QR Code Box (Custom Uploaded Photo or Dynamic UPI QR)
                  ...(qrResult.bytes
                    ? [
                        new TableCell({
                          width: { size: 27, type: WidthType.PERCENTAGE },
                          margins: CELL_PADDING_COMPACT,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new ImageRun({
                                  data: qrResult.bytes as any,
                                  transformation: { width: 115, height: 115 },
                                  type: 'png' as any,
                                }),
                              ],
                            }),
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              spacing: { before: 10 },
                              children: [
                                new TextRun({
                                  text: 'SCAN TO PAY VIA UPI',
                                  bold: true,
                                  size: 16,
                                  font: FONT_PRIMARY,
                                  color: COLOR_NAVY,
                                }),
                              ],
                            }),
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({
                                  text: qrResult.isCustom ? 'Official Bank / UPI QR' : 'Instant Remittance',
                                  size: 15,
                                  font: FONT_PRIMARY,
                                  color: COLOR_SLATE,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ]
                    : []),

                  // Signatory Box
                  new TableCell({
                    width: { size: qrResult.bytes ? 30 : 45, type: WidthType.PERCENTAGE },
                    margins: CELL_PADDING_STANDARD,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 20 },
                        children: [
                          new TextRun({
                            text: `For ${isPersonalNonGst ? (record.personalIssuer?.name?.toUpperCase() || firm.firmName.toUpperCase()) : firm.firmName.toUpperCase()}`,
                            bold: true,
                            size: 22,
                            font: FONT_PRIMARY,
                            color: COLOR_NAVY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 280 }, // Signature space
                        children: [new TextRun({ text: '', size: 22 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: '__________________________________', font: FONT_PRIMARY, color: COLOR_BORDER_DARK })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.name || activeSignatory.name : activeSignatory.name, bold: true, size: 22, font: FONT_PRIMARY, color: COLOR_NAVY })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: isPersonalNonGst ? record.personalIssuer?.designation || activeSignatory.designation : activeSignatory.designation, size: 20, font: FONT_PRIMARY, color: COLOR_SLATE })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Convenience helper to download engagement letter directly - Strictly NO underscores
 */
export async function downloadEngagementLetter(
  record: EngagementRecord,
  firm: FirmProfile,
  customConfig?: WordDocConfig
): Promise<void> {
  const blob = await exportEngagementLetterDocx(record, firm, customConfig);
  const cleanClient = sanitizeFilenamePart(record.client.companyName || record.client.addresseeName || 'Client');
  const cleanRef = sanitizeFilenamePart(record.refNo || 'Ref');
  saveAs(blob, `Engagement Letter - ${cleanClient} - ${cleanRef}.docx`);
}

/**
 * Convenience helper to download pro-forma invoice directly - Strictly NO underscores
 */
export async function downloadProFormaInvoice(
  record: EngagementRecord,
  firm: FirmProfile,
  customConfig?: WordDocConfig
): Promise<void> {
  const blob = await exportProFormaInvoiceDocx(record, firm, customConfig);
  const cleanClient = sanitizeFilenamePart(record.client.companyName || record.client.addresseeName || 'Client');
  const cleanInv = sanitizeFilenamePart(record.invoiceNo || 'Invoice');
  saveAs(blob, `Pro-Forma Invoice - ${cleanClient} - ${cleanInv}.docx`);
}

export {
  downloadEngagementLetter as exportLetterDocx,
  downloadProFormaInvoice as exportInvoiceDocx,
};
