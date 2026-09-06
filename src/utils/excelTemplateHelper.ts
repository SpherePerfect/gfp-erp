import * as XLSX from 'xlsx';
import { ServiceTemplate, ServiceDeliverable, ServiceObjective, ServiceInformationRequired, FeeLineItem } from '../types';

/**
 * Exports all active service templates into a structured Excel workbook (.xlsx)
 */
export function exportTemplatesToExcel(templates: ServiceTemplate[], firmName = 'GFP Advisory'): void {
  const wb = XLSX.utils.book_new();

  // 1. Primary Service Catalog Sheet
  const primaryRows = templates.map((t) => ({
    'Service Code': t.serviceCode,
    'Service Title': t.serviceTitle,
    'Subject Line': t.subjectLine || `Engagement for ${t.serviceTitle}`,
    'Fee Amount (INR)': t.pricing?.feeAmount || 0,
    'GST Percent': t.pricing?.gstPercent ?? 18,
    'Advance Percent': t.pricing?.customAdvancePercent || t.pricing?.paymentSplit?.[0]?.percent || 50,
    'Offer Validity (Days)': t.pricing?.validityDays || 7,
    'Project Delivery Timeline': t.projectTimeline || '3 to 4 Weeks',
    'Client Enablers Clause': t.clientEnablersClause || '',
    'Objectives (Separated by |)': (t.objectives || []).map((o) => o.text).join(' | '),
    'Information Required (Separated by |)': (t.informationRequired || []).map((i) => i.text).join(' | '),
    'Payment Terms (Separated by |)': (t.pricing?.paymentSplit || [])
      .map((p) => `${p.milestone} (${p.percent}%)`)
      .join(' | '),
    'Additional Conditions (Separated by |)': (t.additionalConditions || []).join(' | '),
    'Opening Paragraph 1': t.openingParagraphs?.[0] || '',
    'Opening Paragraph 2': t.openingParagraphs?.[1] || '',
  }));

  const wsCatalog = XLSX.utils.json_to_sheet(primaryRows);

  // Set column widths for readability
  wsCatalog['!cols'] = [
    { wch: 14 }, // Code
    { wch: 38 }, // Title
    { wch: 42 }, // Subject
    { wch: 16 }, // Fee
    { wch: 12 }, // GST
    { wch: 15 }, // Adv %
    { wch: 18 }, // Validity
    { wch: 22 }, // Timeline
    { wch: 40 }, // Enablers
    { wch: 45 }, // Objectives
    { wch: 45 }, // Info required
    { wch: 40 }, // Payment
    { wch: 40 }, // Conditions
    { wch: 45 }, // P1
    { wch: 45 }, // P2
  ];

  XLSX.utils.book_append_sheet(wb, wsCatalog, 'Service Catalog');

  // 2. Itemized Deliverables & Line Items Sheet
  const deliverableRows: any[] = [];
  templates.forEach((t) => {
    (t.deliverables || []).forEach((d, dIdx) => {
      deliverableRows.push({
        'Service Code': t.serviceCode,
        'Service Title': t.serviceTitle,
        'Section Name': d.section || `Section ${d.sectionNumber || 1}`,
        'Section Number': d.sectionNumber || 1,
        'Deliverable Heading': d.heading,
        'Deliverable Description': d.body,
        'Sub-Deliverables (Separated by ;)': (d.subDeliverables || []).map((s) => s.title).join('; '),
        'Individual Fee (INR)': d.individualFee || '',
        'Include in Proposal': d.include ? 'YES' : 'NO',
      });
    });

    // Also include template itemized line items if any
    const lineItems = t.lineItems || t.pricing?.lineItems || [];
    lineItems.forEach((item) => {
      deliverableRows.push({
        'Service Code': t.serviceCode,
        'Service Title': t.serviceTitle,
        'Section Name': 'Fee Line Item',
        'Section Number': 99,
        'Deliverable Heading': item.description,
        'Deliverable Description': item.notes || item.unit || 'Itemized Fee Line Item',
        'Sub-Deliverables (Separated by ;)': '',
        'Individual Fee (INR)': item.amount,
        'Include in Proposal': 'YES',
      });
    });
  });

  if (deliverableRows.length > 0) {
    const wsDeliverables = XLSX.utils.json_to_sheet(deliverableRows);
    wsDeliverables['!cols'] = [
      { wch: 14 },
      { wch: 32 },
      { wch: 24 },
      { wch: 14 },
      { wch: 38 },
      { wch: 55 },
      { wch: 40 },
      { wch: 18 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDeliverables, 'Deliverables & Line Items');
  }

  // 3. Write and Trigger Download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${firmName.replace(/\s+/g, '_')}_Service_Templates_${dateStr}.xlsx`);
}

/**
 * Parses an uploaded Excel (.xlsx, .xls, or .csv) file into an array of ServiceTemplate objects.
 */
export async function importTemplatesFromExcel(file: File): Promise<ServiceTemplate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Look for the primary catalog sheet
        const sheetName = workbook.SheetNames.find(
          (name) => /catalog|service|template/i.test(name)
        ) || workbook.SheetNames[0];

        if (!sheetName) {
          throw new Error('No valid sheets found in uploaded Excel workbook.');
        }

        const ws = workbook.Sheets[sheetName];
        const catalogRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!catalogRows || catalogRows.length === 0) {
          throw new Error('The selected Excel sheet contains no service data rows.');
        }

        // Check if there is a secondary Deliverables & Line Items sheet
        const delivSheetName = workbook.SheetNames.find(
          (name) => /deliverable|line item|item/i.test(name) && name !== sheetName
        );
        let delivRows: any[] = [];
        if (delivSheetName) {
          delivRows = XLSX.utils.sheet_to_json(workbook.Sheets[delivSheetName], { defval: '' });
        }

        const parsedTemplates: ServiceTemplate[] = [];

        catalogRows.forEach((row, rIdx) => {
          const serviceCode = String(row['Service Code'] || row['Code'] || `SVC-${rIdx + 1}`).trim().toUpperCase();
          const serviceTitle = String(
            row['Service Title'] || row['Title'] || row['Service Name'] || `Service Offering ${rIdx + 1}`
          ).trim();

          if (!serviceTitle) return;

          const feeAmount = parseFloat(String(row['Fee Amount (INR)'] || row['Fee'] || row['Amount'] || 25000)) || 25000;
          const gstPercent = parseFloat(String(row['GST Percent'] || row['GST'] || 18)) || 18;
          const advancePercent = parseFloat(String(row['Advance Percent'] || row['Advance'] || 50)) || 50;
          const validityDays = parseInt(String(row['Offer Validity (Days)'] || row['Validity'] || 7), 10) || 7;
          const projectTimeline = String(row['Project Delivery Timeline'] || row['Timeline'] || '3 to 4 Weeks').trim();
          const clientEnablersClause = String(row['Client Enablers Clause'] || '').trim();

          // Opening paragraphs
          const p1 = String(row['Opening Paragraph 1'] || '').trim();
          const p2 = String(row['Opening Paragraph 2'] || '').trim();
          const openingParagraphs = [
            p1 || `Thank you for the opportunity to partner with your enterprise on ${serviceTitle}.`,
            p2 || 'Our advisory approach provides structured, end-to-end guidance aligned with statutory compliance and your commercial milestones.',
          ];

          // Parse objectives
          const rawObjectives = String(row['Objectives (Separated by |)'] || row['Objectives'] || '').trim();
          const objectives: ServiceObjective[] = rawObjectives
            ? rawObjectives.split('|').map((txt, idx) => ({
                id: `obj-${serviceCode.toLowerCase()}-${idx + 1}`,
                text: txt.trim(),
                include: true,
              })).filter((o) => o.text.length > 0)
            : [
                { id: `obj-${serviceCode.toLowerCase()}-1`, text: `Deliver comprehensive professional assessment for ${serviceTitle}`, include: true },
                { id: `obj-${serviceCode.toLowerCase()}-2`, text: 'Formulate an actionable implementation roadmap with defined timelines', include: true },
              ];

          // Parse information required
          const rawInfo = String(row['Information Required (Separated by |)'] || row['Information Required'] || row['Documents'] || '').trim();
          const informationRequired: ServiceInformationRequired[] = rawInfo
            ? rawInfo.split('|').map((txt, idx) => ({
                id: `inf-${serviceCode.toLowerCase()}-${idx + 1}`,
                text: txt.trim(),
                include: true,
              })).filter((i) => i.text.length > 0)
            : [
                { id: `inf-${serviceCode.toLowerCase()}-1`, text: 'Certificate of Incorporation / Registration & Statutory Licenses', include: true },
                { id: `inf-${serviceCode.toLowerCase()}-2`, text: 'Audited Financial Statements for preceding three financial years', include: true },
              ];

          // Parse additional conditions
          const rawCond = String(row['Additional Conditions (Separated by |)'] || row['Additional Conditions'] || row['Conditions'] || '').trim();
          const additionalConditions = rawCond
            ? rawCond.split('|').map((c) => c.trim()).filter(Boolean)
            : [
                'Our findings and deliverables represent professional advisory opinion; sovereign disbursements and statutory sanctions remain within the sole prerogative of respective government departments.',
              ];

          // Deliverables: check if secondary sheet has deliverables for this service code
          const matchingDelivs = delivRows.filter((dRow) => {
            const rowCode = String(dRow['Service Code'] || '').trim().toUpperCase();
            return rowCode === serviceCode;
          });

          const deliverables: ServiceDeliverable[] = [];
          const lineItems: FeeLineItem[] = [];

          if (matchingDelivs.length > 0) {
            matchingDelivs.forEach((mRow, dIdx) => {
              const heading = String(mRow['Deliverable Heading'] || `Deliverable ${dIdx + 1}`).trim();
              const body = String(mRow['Deliverable Description'] || '').trim();
              const sectionName = String(mRow['Section Name'] || 'Section 1').trim();
              const sectionNumber = parseInt(String(mRow['Section Number'] || 1), 10) || 1;
              const subStr = String(mRow['Sub-Deliverables (Separated by ;)'] || '').trim();
              const indFee = parseFloat(String(mRow['Individual Fee (INR)'] || '0')) || undefined;
              const include = String(mRow['Include in Proposal'] || 'YES').trim().toUpperCase() !== 'NO';

              if (sectionName.toLowerCase().includes('line item')) {
                lineItems.push({
                  id: `line-${serviceCode.toLowerCase()}-${dIdx + 1}`,
                  description: heading,
                  amount: indFee || 0,
                  notes: body,
                });
              } else {
                const subDeliverables = subStr
                  ? subStr.split(';').map((s, sIdx) => ({
                      id: `sub-${dIdx + 1}-${sIdx + 1}`,
                      title: s.trim(),
                      completed: false,
                    })).filter((s) => s.title.length > 0)
                  : undefined;

                deliverables.push({
                  id: `del-${serviceCode.toLowerCase()}-${dIdx + 1}`,
                  heading,
                  body: body || 'Detailed advisory deliverable with structured analysis and stakeholder presentations.',
                  include,
                  section: sectionName,
                  sectionNumber,
                  individualFee: indFee,
                  subDeliverables,
                });
              }
            });
          }

          // Fallback if no matching secondary deliverables
          if (deliverables.length === 0) {
            deliverables.push(
              {
                id: `del-${serviceCode.toLowerCase()}-1`,
                heading: 'Diagnostic Appraisal & Baseline Verification',
                body: `Conduct in-depth preliminary assessment of records, statutory filings, and strategic opportunities for ${serviceTitle}.`,
                include: true,
                section: 'Section 1',
                sectionNumber: 1,
              },
              {
                id: `del-${serviceCode.toLowerCase()}-2`,
                heading: 'Actionable Implementation Roadmap & Executive Charter',
                body: 'Deliver comprehensive analytical model, process documentation, and strategic executive walkthrough.',
                include: true,
                section: 'Section 1',
                sectionNumber: 1,
              }
            );
          }

          const template: ServiceTemplate = {
            id: `template-${serviceCode.toLowerCase()}-${Date.now()}-${rIdx}`,
            serviceCode,
            serviceTitle,
            subjectLine: String(row['Subject Line'] || `Engagement for ${serviceTitle}`).trim(),
            openingParagraphs,
            objectives,
            deliverables,
            informationRequired,
            projectTimeline,
            clientEnablersClause,
            lineItems: lineItems.length > 0 ? lineItems : undefined,
            pricing: {
              feeLabel: `Professional Investment for ${serviceTitle}`,
              feeAmount,
              currency: 'INR',
              gstPercent,
              paymentSplit: [
                {
                  id: 'p1',
                  milestone: 'Upon acceptance and prior to kickoff (mobilization advance)',
                  percent: advancePercent,
                  applyGst: true,
                },
                {
                  id: 'p2',
                  milestone: 'Upon completion and report submission',
                  percent: Math.max(0, 100 - advancePercent),
                  applyGst: true,
                },
              ],
              validityDays,
              customAdvancePercent: advancePercent,
              lineItems: lineItems.length > 0 ? lineItems : undefined,
            },
            additionalConditions,
            isCustom: true,
          };

          parsedTemplates.push(template);
        });

        resolve(parsedTemplates);
      } catch (error) {
        console.error('Failed to parse template spreadsheet:', error);
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a pre-formatted sample Excel template for users to edit and re-upload.
 */
export function downloadSampleTemplateWorkbook(): void {
  const sampleTemplates: ServiceTemplate[] = [
    {
      id: 'sample-1',
      serviceCode: 'ADV-STRAT',
      serviceTitle: 'Corporate Strategy & Governance Advisory',
      subjectLine: 'Engagement for Corporate Strategy & Governance Advisory',
      openingParagraphs: [
        'Thank you for the opportunity to assist your esteemed enterprise in evaluating corporate growth strategies, governance structures, and capital allocation.',
        'Our approach is structured to align regulatory, financial, and strategic objectives with your long-term expansion roadmaps.',
      ],
      objectives: [
        { id: 'o1', text: 'Evaluate existing corporate governance and board compliance frameworks', include: true },
        { id: 'o2', text: 'Formulate an actionable 3-year strategic growth and capital deployment matrix', include: true },
      ],
      deliverables: [
        {
          id: 'd1',
          heading: 'Strategic Governance Assessment & Risk Matrix',
          body: 'Comprehensive diagnostic report benchmarking existing governance policies against industry best practices.',
          include: true,
          section: 'Section 1',
          sectionNumber: 1,
          subDeliverables: [
            { id: 's1', title: 'Board oversight and charter evaluation' },
            { id: 's2', title: 'Enterprise risk register and mitigation plan' },
          ],
        },
        {
          id: 'd2',
          heading: 'Growth Roadmap & Capital Allocation Blueprint',
          body: 'Detailed financial modeling and capital budgeting framework for upcoming strategic initiatives.',
          include: true,
          section: 'Section 2',
          sectionNumber: 2,
          subDeliverables: [
            { id: 's3', title: '5-year pro-forma financial forecasts' },
            { id: 's4', title: 'Sensitivity and valuation scenario analysis' },
          ],
        },
      ],
      informationRequired: [
        { id: 'i1', text: 'Certificate of Incorporation and latest Articles of Association', include: true },
        { id: 'i2', text: 'Audited Financial Statements for last 3 financial years', include: true },
      ],
      lineItems: [
        { id: 'l1', description: 'Phase 1: Governance Diagnostic Assessment', amount: 50000, unit: 'Lumpsum' },
        { id: 'l2', description: 'Phase 2: Financial Model & Executive Presentation', amount: 50000, unit: 'Lumpsum' },
      ],
      pricing: {
        feeLabel: 'Professional Investment for Strategic Advisory',
        feeAmount: 100000,
        currency: 'INR',
        gstPercent: 18,
        paymentSplit: [
          { id: 'p1', milestone: 'Upon signing and prior to kickoff (mobilization advance)', percent: 50, applyGst: true },
          { id: 'p2', milestone: 'Upon completion and deliverable handover', percent: 50, applyGst: true },
        ],
        validityDays: 14,
        customAdvancePercent: 50,
      },
      additionalConditions: [
        'Out-of-pocket statutory filing fees or external valuation costs, if required, shall be pre-approved and billed at actuals.',
      ],
    },
  ];

  exportTemplatesToExcel(sampleTemplates, 'GFP_Sample_Service_Templates');
}
