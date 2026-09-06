import * as XLSX from 'xlsx';
import { ServiceTemplate, PaymentMilestone } from '../types';

export function exportTemplatesToExcel(templates: ServiceTemplate[]): void {
  // Master Services Sheet
  const masterHeaders = [
    'Service Code',
    'Service Title',
    'Subject Line',
    'Fee Amount (INR)',
    'GST Percent (%)',
    'Validity Days',
    'Opening Paragraphs',
    'Key Objectives (One per line)',
    'Documents Required (One per line)',
    'Payment Milestones (e.g. 50% - Mobilization Advance; 50% - Final Delivery)',
    'Line Items (e.g. Diagnostic Audit: 25000 | Scheme Drafting: 25000)',
    'Additional Conditions (One per line)',
  ];

  const masterRows = templates.map((t) => {
    const objectivesText = t.objectives?.map((o) => o.text).join('\n') || '';
    const docsText = t.informationRequired?.map((d) => d.text).join('\n') || '';
    const milestonesText =
      t.pricing?.paymentSplit
        ?.map((m) => `${m.percent}% - ${m.milestone}${m.applyGst === false ? ' [NO GST]' : ''}`)
        .join('; ') || '';
    const lineItemsText =
      t.pricing?.lineItems
        ?.map((li) => `${li.description}: ₹${li.amount}${li.unit ? ` (${li.unit})` : ''}`)
        .join(' | ') || '';
    const conditionsText = t.additionalConditions?.join('\n') || '';
    const openingText = t.openingParagraphs?.join('\n\n') || '';

    return [
      t.serviceCode || 'ADV',
      t.serviceTitle,
      t.subjectLine || '',
      t.pricing?.feeAmount || 0,
      t.pricing?.gstPercent ?? 18,
      t.pricing?.validityDays || 15,
      openingText,
      objectivesText,
      docsText,
      milestonesText,
      lineItemsText,
      conditionsText,
    ];
  });

  const masterSheetData = [masterHeaders, ...masterRows];
  const masterSheet = XLSX.utils.aoa_to_sheet(masterSheetData);
  masterSheet['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 38 },
    { wch: 18 },
    { wch: 16 },
    { wch: 15 },
    { wch: 45 },
    { wch: 45 },
    { wch: 40 },
    { wch: 45 },
    { wch: 40 },
    { wch: 45 },
  ];

  // Deliverables Detail Sheet
  const deliverableHeaders = [
    'Service Code',
    'Service Title',
    'Deliverable Heading',
    'Deliverable Description',
  ];

  const deliverableRows: any[] = [];
  templates.forEach((t) => {
    t.deliverables.forEach((d) => {
      deliverableRows.push([
        t.serviceCode || 'ADV',
        t.serviceTitle,
        d.heading,
        d.body,
      ]);
    });
  });

  const deliverablesSheetData = [deliverableHeaders, ...deliverableRows];
  const deliverablesSheet = XLSX.utils.aoa_to_sheet(deliverablesSheetData);
  deliverablesSheet['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 40 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, masterSheet, 'Services Catalog');
  XLSX.utils.book_append_sheet(workbook, deliverablesSheet, 'Detailed Deliverables');

  const fileDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `GFP_Services_Master_Templates_${fileDate}.xlsx`);
}

export function downloadSampleTemplateWorkbook(): void {
  const sampleHeaders = [
    'Service Code',
    'Service Title',
    'Subject Line',
    'Fee Amount (INR)',
    'GST Percent (%)',
    'Validity Days',
    'Opening Paragraphs',
    'Key Objectives (One per line)',
    'Documents Required (One per line)',
    'Payment Milestones (e.g. 50% - Mobilization Advance; 50% - Final Delivery)',
    'Line Items (e.g. Diagnostic Audit: 25000 | Scheme Drafting: 25000)',
    'Additional Conditions (One per line)',
  ];

  const sampleRows = [
    [
      'MSME',
      'MSME Subsidy & State Incentives Advisory',
      'Proposal for MSME Government Incentives & Capital Subsidy Support',
      125000,
      18,
      15,
      'Thank you for engaging us to structure and facilitate capital subsidies and interest subvention for your enterprise.',
      '1. Review eligibility under State and Central Industrial Policy\n2. Prepare detailed DPR and financial modeling\n3. Coordinate sanction with Director of Industries',
      '1. Certificate of Incorporation & Udyam Registration\n2. Audited financials for last 3 financial years\n3. Sanction letters from Commercial Banks',
      '50% - Mobilization Advance on Signing; 50% - On Submission of DPR & Sanction Application',
      'Initial Policy Diagnostic: 25000 | Detailed Project Report (DPR): 75000 | Sanction Representation: 25000',
      'Client shall furnish timely audited statements\nStatutory application fees are payable directly to the department',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 40 },
    { wch: 18 },
    { wch: 16 },
    { wch: 15 },
    { wch: 45 },
    { wch: 45 },
    { wch: 45 },
    { wch: 45 },
    { wch: 45 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Services Catalog');
  XLSX.writeFile(wb, 'Sample_Advisory_Service_Template.xlsx');
}

export function importTemplatesFromExcel(file: File): Promise<ServiceTemplate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!jsonRows || jsonRows.length < 2) {
          throw new Error('The uploaded Excel file does not contain any service rows.');
        }

        // Check if there is a second sheet with deliverables
        const deliverablesMap: Record<string, Array<{ heading: string; body: string }>> = {};
        if (workbook.SheetNames.length > 1) {
          const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
          const delivRows: any[][] = XLSX.utils.sheet_to_json(secondSheet, { header: 1 });
          if (delivRows && delivRows.length > 1) {
            for (let i = 1; i < delivRows.length; i++) {
              const row = delivRows[i];
              if (!row || row.length < 3) continue;
              const code = String(row[0] || '').trim().toUpperCase();
              const heading = String(row[2] || '').trim();
              const body = String(row[3] || '').trim();
              if (code && heading) {
                if (!deliverablesMap[code]) deliverablesMap[code] = [];
                deliverablesMap[code].push({ heading, body });
              }
            }
          }
        }

        const importedTemplates: ServiceTemplate[] = [];

        // Loop starting from row index 1 (skipping headers)
        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0 || !row[1]) continue;

          const serviceCode = String(row[0] || `SRV-${i}`).trim().toUpperCase();
          const serviceTitle = String(row[1] || '').trim();
          const subjectLine = String(row[2] || `Engagement for ${serviceTitle}`).trim();
          const feeAmount = Number(row[3]) || 50000;
          const gstPercent = Number(row[4]) || 18;
          const validityDays = Number(row[5]) || 15;
          const openingRaw = String(row[6] || '').trim();
          const objectivesRaw = String(row[7] || '').trim();
          const docsRaw = String(row[8] || '').trim();
          const milestonesRaw = String(row[9] || '').trim();
          const lineItemsRaw = String(row[10] || '').trim();
          const conditionsRaw = String(row[11] || '').trim();

          const openingParagraphs = openingRaw
            ? openingRaw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
            : [
                'Thank you for the opportunity to partner with your esteemed enterprise.',
                'Our advisory framework provides comprehensive strategic and statutory guidance aligned with your business milestones.',
              ];

          const objectives = objectivesRaw
            ? objectivesRaw
                .split('\n')
                .map((t, idx) => ({
                  id: `obj-imp-${i}-${idx}`,
                  text: t.replace(/^[\d.-]+\s*/, '').trim(),
                  include: true,
                }))
                .filter((o) => o.text.length > 0)
            : [
                {
                  id: `obj-imp-${i}-1`,
                  text: 'Formulate an actionable strategic roadmap with defined milestones',
                  include: true,
                },
              ];

          const informationRequired = docsRaw
            ? docsRaw
                .split('\n')
                .map((t, idx) => ({
                  id: `doc-imp-${i}-${idx}`,
                  text: t.replace(/^[\d.-]+\s*/, '').trim(),
                  include: true,
                }))
                .filter((d) => d.text.length > 0)
            : [
                {
                  id: `doc-imp-${i}-1`,
                  text: 'Certificate of Incorporation and statutory registrations',
                  include: true,
                },
              ];

          // Milestones parsing
          let paymentSplit: PaymentMilestone[] = [];
          if (milestonesRaw) {
            const parts = milestonesRaw.split(';');
            parts.forEach((p, idx) => {
              const match = p.match(/(\d+)\s*%\s*-\s*(.+)/);
              if (match) {
                const percent = Number(match[1]);
                const milestoneDesc = match[2].trim();
                const noGst = milestoneDesc.includes('[NO GST]');
                paymentSplit.push({
                  id: `p-imp-${i}-${idx}`,
                  percent,
                  milestone: milestoneDesc.replace('[NO GST]', '').trim(),
                  applyGst: !noGst,
                });
              }
            });
          }
          if (paymentSplit.length === 0) {
            paymentSplit = [
              { id: `p-imp-${i}-1`, percent: 50, milestone: 'Mobilization Advance upon execution', applyGst: true },
              { id: `p-imp-${i}-2`, percent: 50, milestone: 'On submission of Final Deliverables', applyGst: true },
            ];
          }

          // Line items parsing
          const lineItems: any[] = [];
          if (lineItemsRaw) {
            const items = lineItemsRaw.split('|');
            items.forEach((item, idx) => {
              const colonParts = item.split(':');
              if (colonParts.length >= 2) {
                const desc = colonParts[0].trim();
                const amtPart = colonParts[1].trim().replace(/[^\d.]/g, '');
                const amt = Number(amtPart) || 0;
                lineItems.push({
                  id: `li-imp-${i}-${idx}`,
                  description: desc,
                  amount: amt,
                  unit: 'Lumpsum',
                });
              }
            });
          }

          const additionalConditions = conditionsRaw
            ? conditionsRaw.split('\n').map((c) => c.trim()).filter(Boolean)
            : [];

          // Deliverables
          let deliverables: any[] = [];
          if (deliverablesMap[serviceCode] && deliverablesMap[serviceCode].length > 0) {
            deliverables = deliverablesMap[serviceCode].map((d, idx) => ({
              id: `del-imp-${i}-${idx}`,
              heading: d.heading,
              body: d.body,
              include: true,
            }));
          } else {
            deliverables = [
              {
                id: `del-imp-${i}-1`,
                heading: `1.1  Diagnostic Assessment & Execution Blueprint`,
                body: `Comprehensive audit and strategic matrix structured for ${serviceTitle}.`,
                include: true,
              },
              {
                id: `del-imp-${i}-2`,
                heading: `1.2  Regulatory & Incentive Filing Package`,
                body: `Detailed dossier, representations, and end-to-end liaison with relevant authorities.`,
                include: true,
              },
            ];
          }

          importedTemplates.push({
            id: `template-imp-${Date.now()}-${i}`,
            serviceCode,
            serviceTitle,
            subjectLine,
            openingParagraphs,
            objectives,
            deliverables,
            informationRequired,
            pricing: {
              feeLabel: 'Professional Investment for Advisory Services',
              feeAmount,
              currency: 'INR',
              gstPercent,
              validityDays,
              paymentSplit,
              lineItems: lineItems.length > 0 ? lineItems : undefined,
            },
            additionalConditions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        resolve(importedTemplates);
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse Excel file. Please check format.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}
