/**
 * Statutory GSTIN and PAN Validator & Metadata Extractor
 * Complies with the Indian Goods & Services Tax (GST) 15-character statutory format:
 * [2-digit State Code] + [10-char PAN] + [1-digit Entity Number] + ['Z'] + [1-digit Checksum]
 */

export const INDIAN_GST_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export const PAN_CONSTITUTION_MAP: Record<string, string> = {
  C: 'Private Limited / Public Limited Company',
  P: 'Proprietorship / Individual',
  F: 'Partnership / LLP',
  T: 'Trust / Society',
  H: 'Hindu Undivided Family (HUF)',
  A: 'Association of Persons (AOP)',
  B: 'Body of Individuals (BOI)',
  G: 'Government Agency',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
};

export interface GstinParseResult {
  isValid: boolean;
  raw: string;
  cleaned: string;
  pan: string;
  stateCode: string;
  stateName: string;
  entityType: string;
  panCategory: string;
  checksumChar: string;
  errorMessage?: string;
}

export function validateAndParseGstin(rawInput: string): GstinParseResult {
  const cleaned = (rawInput || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      raw: rawInput,
      cleaned: '',
      pan: '',
      stateCode: '',
      stateName: '',
      entityType: '',
      panCategory: '',
      checksumChar: '',
      errorMessage: 'GSTIN cannot be empty',
    };
  }

  if (cleaned.length !== 15) {
    return {
      isValid: false,
      raw: rawInput,
      cleaned,
      pan: cleaned.length >= 12 ? cleaned.substring(2, 12) : '',
      stateCode: cleaned.substring(0, 2),
      stateName: INDIAN_GST_STATES[cleaned.substring(0, 2)] || 'Unknown State',
      entityType: '',
      panCategory: '',
      checksumChar: '',
      errorMessage: `GSTIN must be exactly 15 characters (currently ${cleaned.length})`,
    };
  }

  // Regex format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + 'Z' + 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isFormatMatch = gstinRegex.test(cleaned);

  const stateCode = cleaned.substring(0, 2);
  const stateName = INDIAN_GST_STATES[stateCode] || 'Unknown / Other State';
  const pan = cleaned.substring(2, 12);
  const panFourthChar = pan.charAt(3);
  const entityType = PAN_CONSTITUTION_MAP[panFourthChar] || 'Corporate Entity';
  const panCategory = panFourthChar;
  const checksumChar = cleaned.charAt(14);

  if (!isFormatMatch) {
    return {
      isValid: false,
      raw: rawInput,
      cleaned,
      pan,
      stateCode,
      stateName,
      entityType,
      panCategory,
      checksumChar,
      errorMessage: 'Invalid statutory GSTIN structure (Format: 22AAAAA0000A1Z5)',
    };
  }

  return {
    isValid: true,
    raw: rawInput,
    cleaned,
    pan,
    stateCode,
    stateName,
    entityType,
    panCategory,
    checksumChar,
  };
}
