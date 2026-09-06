import { FirmProfile } from '../types';

export const defaultFirmProfile: FirmProfile = {
  firmName: 'GFP MANAGEMENT CONSULTING SERVICES PRIVATE LIMITED',
  tagline: 'Global Finance Professionals',
  officeLocations: 'Mumbai | Pune | Kolhapur | Belgaum | Mapusa',
  registeredState: 'Maharashtra',
  cin: 'U74140MH2015PTC268912',
  gstin: '27AABCG9128P1Z8',
  pan: 'AABCG9128P',
  sacCode: '998311', // Management Consulting Services
  firmEmail: 'advisory@gfpconsulting.in',
  firmPhone: '+91 93708 88819',
  firmWebsite: 'www.gfpconsulting.in',
  bankDetails: {
    accountHolderName: 'GFP Management Consulting Services Pvt. Ltd.',
    bankNameBranch: 'Bank of India, Patto Plaza Branch',
    accountNumber: '102920110000340',
    ifscCode: 'BKID0001029',
    upiId: 'boim-102988190340@boi',
  },
  contactPersons: [
    { name: 'CA Yogesh Kulkarni', phone: '+91 93708 88819', email: 'yogesh.kulkarni@gfpconsulting.in' },
    { name: 'Surekha Misal', phone: '+91 77559 09801', email: 'surekha.misal@gfpconsulting.in' },
  ],
  signatoryName: 'CA Yogesh Kulkarni',
  signatoryDesignation: 'Director / Authorised Signatory',
  signatoryEmail: 'yogesh.kulkarni@gfpconsulting.in',
  signatoryPhone: '+91 93708 88819',
  signatories: [
    {
      id: 'sig-1',
      name: 'CA Yogesh Kulkarni',
      designation: 'Director / Authorised Signatory',
      email: 'yogesh.kulkarni@gfpconsulting.in',
      phone: '+91 93708 88819',
      isDefault: true,
    },
    {
      id: 'sig-2',
      name: 'Surekha Misal',
      designation: 'Associate Director / Strategic Advisory',
      email: 'surekha.misal@gfpconsulting.in',
      phone: '+91 77559 09801',
      isDefault: false,
    },
  ],
  logoPosition: 'left',
  themeSettings: {
    colorTheme: 'royal_navy',
    fontFamily: 'serif',
    logoPosition: 'left',
    letterheadStyle: 'two_column',
  },
  wordDocConfig: {
    fontFamily: 'Segoe UI',
    fontSizeScale: 'standard',
    colorTheme: 'navy',
    margins: 'standard',
    headerLayout: 'two_column',
    tableStyle: 'executive',
    signatureLayout: 'dual_column',
    includeWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    includeConfidentiality: true,
    includeNonSolicitation: true,
    includeClientEnablers: true,
    includeJurisdiction: true,
    showStampBox: true,
  },
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];
