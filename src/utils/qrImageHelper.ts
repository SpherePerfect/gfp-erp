import QRCode from 'qrcode';
import { dataUrlToUint8Array } from './logoImageHelper';

/**
 * Generates standard Indian UPI Payment URI string
 */
export function buildUpiPaymentUri(
  upiId: string,
  payeeName: string,
  amount: number,
  invoiceNo: string
): string {
  const cleanUpi = (upiId || '').trim();
  const cleanName = (payeeName || '').trim();
  const cleanInv = (invoiceNo || '').trim();
  const amtVal = Math.max(0, Math.round(amount));

  return `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(cleanName)}&am=${amtVal}&cu=INR&tn=${encodeURIComponent(cleanInv)}`;
}

/**
 * Generates an offline client-side QR Code PNG Data URL
 */
export async function generateQrCodeDataUrl(
  text: string,
  options?: { width?: number; margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 250,
      margin: options?.margin || 2,
      color: {
        dark: options?.darkColor || '#0B2545',
        light: options?.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('Failed to generate QR code data URL:', err);
    return '';
  }
}

/**
 * Generates an image bytes payload ready for docx ImageRun embedding
 */
export async function getQrImageBytes(
  customQrDataUrl?: string,
  fallbackUpi?: { upiId: string; payeeName: string; amount: number; invoiceNo: string }
): Promise<{ bytes: Uint8Array | null; width: number; height: number; isCustom: boolean }> {
  // 1. If custom QR image was uploaded by the user
  if (customQrDataUrl) {
    const bytes = dataUrlToUint8Array(customQrDataUrl);
    if (bytes && bytes.length > 0) {
      return {
        bytes,
        width: 100,
        height: 100,
        isCustom: true,
      };
    }
  }

  // 2. Fallback: generate dynamic UPI QR code from remittance parameters
  if (fallbackUpi && fallbackUpi.upiId) {
    try {
      const uri = buildUpiPaymentUri(
        fallbackUpi.upiId,
        fallbackUpi.payeeName,
        fallbackUpi.amount,
        fallbackUpi.invoiceNo
      );
      const dataUrl = await generateQrCodeDataUrl(uri, { width: 300, margin: 2 });
      if (dataUrl) {
        const bytes = dataUrlToUint8Array(dataUrl);
        if (bytes && bytes.length > 0) {
          return {
            bytes,
            width: 95,
            height: 95,
            isCustom: false,
          };
        }
      }
    } catch (e) {
      console.warn('Fallback UPI QR generation failed:', e);
    }
  }

  return { bytes: null, width: 0, height: 0, isCustom: false };
}

/**
 * Returns a displayable data URL for the QR code (custom uploaded image or generated UPI QR)
 */
export async function getResolvedQrDataUrl(
  customQrDataUrl?: string,
  fallbackUpi?: { upiId: string; payeeName: string; amount: number; invoiceNo: string }
): Promise<string> {
  if (customQrDataUrl && customQrDataUrl.trim().length > 0) {
    return customQrDataUrl;
  }
  if (fallbackUpi && fallbackUpi.upiId) {
    const uri = buildUpiPaymentUri(
      fallbackUpi.upiId,
      fallbackUpi.payeeName,
      fallbackUpi.amount,
      fallbackUpi.invoiceNo
    );
    return await generateQrCodeDataUrl(uri, { width: 280, margin: 2 });
  }
  return '';
}
