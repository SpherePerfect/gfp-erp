/**
 * Converts a number to Indian currency words format.
 * E.g., 18000 -> "Rupees Eighteen Thousand Only"
 * 10620 -> "Rupees Ten Thousand Six Hundred Twenty Only"
 * 21240 -> "Rupees Twenty-One Thousand Two Hundred Forty Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      str += ones[num] + ' ';
    } else {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      str += tens[ten] + (one > 0 ? '-' + ones[one] : '') + ' ';
    }
  }
  return str.trim();
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Rupees Zero Only';
  }

  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  let num = integerPart;
  const parts: string[] = [];

  // Crores (1,00,00,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    parts.push(convertBelowThousand(crores) + ' Crore');
    num %= 10000000;
  }

  // Lakhs (1,00,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    parts.push(convertBelowThousand(lakhs) + ' Lakh');
    num %= 100000;
  }

  // Thousands (1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    parts.push(convertBelowThousand(thousands) + ' Thousand');
    num %= 1000;
  }

  // Hundreds & Below
  if (num > 0) {
    parts.push(convertBelowThousand(num));
  }

  const resultStr = parts.join(' ').trim();
  let finalWord = `Rupees ${resultStr}`;

  if (decimalPart > 0) {
    finalWord += ` and ${convertBelowThousand(decimalPart)} Paise`;
  }

  finalWord += ' Only';
  return finalWord.replace(/\s+/g, ' ');
}

export function formatIndianCurrency(amount: number, currency: string = 'INR'): string {
  try {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹ ${amount.toLocaleString('en-IN')}`;
  }
}
