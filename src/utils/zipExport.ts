import JSZip from 'jszip';
import saveAs from 'file-saver';
import { EngagementRecord, FirmProfile } from '../types';
import { exportEngagementLetterDocx, exportProFormaInvoiceDocx, sanitizeFilenamePart } from './docxExport';

export async function downloadBothDocxZip(
  record: EngagementRecord,
  firm: FirmProfile
): Promise<void> {
  const zip = new JSZip();

  const cleanClient = sanitizeFilenamePart(record.client.companyName || record.client.addresseeName || 'Client');
  const cleanRef = sanitizeFilenamePart(record.refNo || 'Ref');
  const cleanInv = sanitizeFilenamePart(record.invoiceNo || 'Inv');

  const letterBlob = await exportEngagementLetterDocx(record, firm);
  const invoiceBlob = await exportProFormaInvoiceDocx(record, firm);

  // Strictly NO underscores in filenames
  zip.file(`Engagement Letter - ${cleanClient} - ${cleanRef}.docx`, letterBlob);
  zip.file(`Pro-Forma Invoice - ${cleanClient} - ${cleanInv}.docx`, invoiceBlob);

  const zipContent = await zip.generateAsync({ type: 'blob' });
  saveAs(zipContent, `Engagement and Invoice - ${cleanClient}.zip`);
}

export { downloadBothDocxZip as exportEngagementZip };

