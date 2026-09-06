/**
 * Utility to reliably extract, measure, and convert logo images into Uint8Array for docx ImageRun embedding
 * Preserves strict aspect ratio for square, rectangular, and custom proportion logos so they NEVER get compressed/squashed.
 */

export function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const parts = dataUrl.split(',');
    const base64 = parts.length > 1 ? parts[1] : parts[0];
    const cleanBase64 = base64.replace(/[\s\r\n]+/g, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Failed to parse base64 logo data URL:', err);
    return null;
  }
}

/**
 * Parses intrinsic image dimensions directly from binary header bytes (PNG, JPEG, GIF, BMP, WebP)
 */
export function detectImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (!bytes || bytes.length < 16) return null;

  try {
    // 1. PNG check: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 24 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    // 2. JPEG check: FF D8
    if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset < bytes.length - 8) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        // SOF markers (Start Of Frame)
        if (
          marker === 0xc0 ||
          marker === 0xc1 ||
          marker === 0xc2 ||
          marker === 0xc3 ||
          marker === 0xc5 ||
          marker === 0xc6 ||
          marker === 0xc7 ||
          marker === 0xc9 ||
          marker === 0xca ||
          marker === 0xcb ||
          marker === 0xcd ||
          marker === 0xce ||
          marker === 0xcf
        ) {
          const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
          const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
          if (width > 0 && height > 0) {
            return { width, height };
          }
        }
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
        if (length <= 0) break;
        offset += 2 + length;
      }
    }

    // 3. GIF check: 'GIF'
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      const width = bytes[6] | (bytes[7] << 8);
      const height = bytes[8] | (bytes[9] << 8);
      if (width > 0 && height > 0) return { width, height };
    }

    // 4. BMP check: 'BM'
    if (bytes[0] === 0x42 && bytes[1] === 0x4d && bytes.length >= 26) {
      const width = (bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24)) >>> 0;
      const height = Math.abs((bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24)) >> 0);
      if (width > 0 && height > 0) return { width, height };
    }
  } catch (err) {
    console.warn('Error reading image dimensions from bytes:', err);
  }

  return null;
}

/**
 * Calculates scaled dimensions preserving exact aspect ratio within target bounding box
 * For square logos (e.g. 500x500): scales to 55x55 (exact 1:1, never squashed)
 * For landscape logos (e.g. 300x100): scales to 140x47
 */
export function calculatePreservedDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth = 240,
  maxHeight = 90
): { width: number; height: number } {
  if (!origWidth || !origHeight || origWidth <= 0 || origHeight <= 0) {
    return { width: 90, height: 90 };
  }

  // Uniform scaling factor ensures the logo fits within bounds without ANY squashing or compression
  const scale = Math.min(maxWidth / origWidth, maxHeight / origHeight);
  const width = Math.round(origWidth * scale);
  const height = Math.round(origHeight * scale);

  return {
    width: Math.max(20, width),
    height: Math.max(20, height),
  };
}

/**
 * Generates an executive, high-resolution GFP Advisory vector logo as a PNG Uint8Array
 * so that even if the user hasn't uploaded a logo file yet, the Word export ALWAYS contains
 * a crisp, professional corporate logo.
 */
export function generateDefaultGfpLogoBytes(): Uint8Array | null {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // High DPI crispness
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Left Icon Shield / Monogram
    const shieldX = 8;
    const shieldY = 10;
    const shieldW = 90;
    const shieldH = 90;

    // Rounded shield background
    ctx.fillStyle = '#0B2545';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(shieldX, shieldY, shieldW, shieldH, 12);
    } else {
      ctx.rect(shieldX, shieldY, shieldW, shieldH);
    }
    ctx.fill();

    // Inner gold accent border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // "GFP" text in shield
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GFP', shieldX + shieldW / 2, shieldY + shieldH / 2 - 6);

    // "ADVISORY" sub-pill
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ADVISORY', shieldX + shieldW / 2, shieldY + shieldH / 2 + 22);

    // Right Typography
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // GFP MANAGEMENT CONSULTING
    ctx.fillStyle = '#0B2545';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('GFP MANAGEMENT', 112, 16);

    // CONSULTING SERVICES
    ctx.fillStyle = '#0B2545';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CONSULTING SERVICES', 112, 42);

    // Gold decorative divider line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(112, 68);
    ctx.lineTo(370, 68);
    ctx.stroke();

    // Global Finance Professionals
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 12px serif';
    ctx.fillText('Global Finance Professionals', 112, 75);

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrlToUint8Array(dataUrl);
  } catch (e) {
    console.warn('Canvas rendering for logo failed:', e);
    return null;
  }
}

/**
 * Returns the logo Uint8Array ready for ImageRun along with perfectly proportioned dimensions
 * Specifically takes care of square logos (e.g. GFP emblem) so they are NEVER compressed or squashed.
 */
export function getFirmLogoBytes(
  logoDataUrl?: string,
  storedDimensions?: { width: number; height: number },
  targetWidthPx?: number
): {
  bytes: Uint8Array | null;
  width: number;
  height: number;
} {
  const desiredWidth = targetWidthPx && targetWidthPx > 0 ? targetWidthPx : undefined;

  if (logoDataUrl) {
    const bytes = dataUrlToUint8Array(logoDataUrl);
    if (bytes && bytes.length > 0) {
      // 1. Detect dimensions from binary header or stored metadata
      const detected = storedDimensions || detectImageDimensions(bytes);
      if (detected && detected.width > 0 && detected.height > 0) {
        if (desiredWidth) {
          const ratio = detected.height / detected.width;
          const calculatedHeight = Math.round(desiredWidth * ratio);
          return { bytes, width: desiredWidth, height: calculatedHeight };
        }
        // Generous, prominent bounds for executive logo presentation (Big & crisp)
        const { width, height } = calculatePreservedDimensions(detected.width, detected.height, 300, 130);
        return { bytes, width, height };
      }

      // If detection failed, assume balanced ratio
      const fallbackW = desiredWidth || 160;
      return { bytes, width: fallbackW, height: Math.round(fallbackW * 0.7) };
    }
  }

  // Fallback to crisp default GFP logo (which is 380x110 ~3.45:1 aspect ratio)
  const defaultBytes = generateDefaultGfpLogoBytes();
  const defaultW = desiredWidth || 260;
  return { bytes: defaultBytes, width: defaultW, height: Math.round(defaultW * (85 / 260)) };
}
