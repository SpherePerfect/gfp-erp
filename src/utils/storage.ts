import { defaultFirmProfile } from '../data/defaultFirmProfile';
import { defaultTemplates } from '../data/defaultTemplates';
import { EngagementRecord, FirmProfile, ServiceTemplate } from '../types';

const STORAGE_KEYS = {
  FIRM_PROFILE: 'gfp_firm_profile_v1',
  TEMPLATES: 'gfp_service_templates_v1',
  ENGAGEMENTS: 'gfp_engagements_v1',
  LAST_USER: 'gfp_last_user_v1',
};

// Initial sample engagements matching the user's prompt (covering this month and previous month)
const initialSampleEngagements: EngagementRecord[] = [
  {
    id: 'eng-techvision-2026',
    refNo: 'GFP/FM-EL/816/2026',
    invoiceNo: 'GFP/FM-INV/816/2026',
    sequenceCount: 16,
    date: '02/09/2026',
    validityDays: 14,
    projectTimeline: '4 Weeks',
    clientEnablersClause: 'Timely supply of audited financial statements and MIS schedules is essential for model formulation.',
    client: {
      addresseeName: 'Mr. Rajesh Mehta',
      salutation: 'Dear Sir',
      companyName: 'TechVision AI Solutions Pvt Ltd',
      designation: 'Managing Director & CFO',
      businessEntityType: 'Private Limited',
      billingAddress: '402 Cyber City, Baner High Street\nPune, Maharashtra 411045',
      state: 'Maharashtra',
      gstin: '27AAFCT8192K1Z9',
      pan: 'AAFCT8192K',
      email: 'rajesh.mehta@techvisionai.in',
      phone: '+91 98230 45678',
    },
    service: {
      ...defaultTemplates[1],
      pricing: {
        ...defaultTemplates[1].pricing,
        feeAmount: 125000,
        customAdvancePercent: 50,
      },
    },
    signatory: defaultFirmProfile.signatories?.[0],
    invoiceMilestoneType: 'advance',
    notes: 'Financial model draft and valuation sensitivity framework for upcoming Series A investment round.',
    status: 'approved',
    createdBy: 'CA Yogesh Kulkarni',
    createdAt: '2026-09-02T09:30:00.000Z',
    lastEditedAt: '2026-09-02T10:15:00.000Z',
    actionLog: [
      {
        timestamp: '2026-09-02T09:30:00.000Z',
        user: 'CA Yogesh Kulkarni',
        action: 'Created Engagement Letter GFP/FM-EL/816/2026',
      },
      {
        timestamp: '2026-09-02T10:15:00.000Z',
        user: 'CA Yogesh Kulkarni',
        action: 'Client approved engagement terms; Pro-forma advance generated',
      },
    ],
  },
  {
    id: 'eng-apex-consulting-2026',
    refNo: 'GFP/TAX-EL/817/2026',
    invoiceNo: 'GFP/TAX-INV/817/2026',
    sequenceCount: 17,
    date: '01/09/2026',
    validityDays: 10,
    projectTimeline: 'Ongoing Retainer',
    clientEnablersClause: 'Client shall submit monthly compliance inputs before the 5th of each subsequent month.',
    client: {
      addresseeName: 'Dr. Ananya Sen',
      salutation: 'Dear Madam',
      companyName: 'Apex Health Diagnostics LLP',
      designation: 'Managing Partner',
      businessEntityType: 'LLP',
      billingAddress: 'Unit 12, Pinnacle Corporate Hub\nKalyani Nagar, Pune 411006',
      state: 'Maharashtra',
      gstin: '27AAIFA9102L1ZQ',
      pan: 'AAIFA9102L',
      email: 'ananya.sen@apexhealth.in',
      phone: '+91 98811 77654',
    },
    service: {
      ...defaultTemplates[0],
      serviceTitle: 'Strategic Direct Tax Assessment & Advisory',
      pricing: {
        ...defaultTemplates[0].pricing,
        feeAmount: 60000,
        customAdvancePercent: 50,
      },
    },
    signatory: defaultFirmProfile.signatories?.[0],
    invoiceMilestoneType: 'advance',
    notes: 'Corporate direct tax scrutiny support and ongoing compliance retainer.',
    status: 'invoiced',
    createdBy: 'CA Yogesh Kulkarni',
    createdAt: '2026-09-01T11:00:00.000Z',
    lastEditedAt: '2026-09-01T11:45:00.000Z',
    actionLog: [
      {
        timestamp: '2026-09-01T11:00:00.000Z',
        user: 'CA Yogesh Kulkarni',
        action: 'Created Engagement Letter GFP/TAX-EL/817/2026',
      },
    ],
  },
  {
    id: 'eng-vishnu-sarda-2026',
    refNo: 'GFP/MSME-EL/815/2026',
    invoiceNo: 'GFP/MSME-INV/815/2026',
    sequenceCount: 15,
    date: '20/08/2026',
    validityDays: 7,
    projectTimeline: '3 to 4 Weeks',
    clientEnablersClause: 'Adherence to delivery timelines is strictly subject to the timely provision of requisite documentation, business records, and stakeholder interactions by your team.',
    client: {
      addresseeName: 'Mr. Vishnu Sarda',
      salutation: 'Dear Sir',
      companyName: 'Shlok Hospital',
      designation: 'Director / Managing Trustee',
      businessEntityType: 'Private Limited',
      billingAddress: 'Near Patto Plaza, Commercial District\nMumbai Road, Pune, Maharashtra 411001',
      state: 'Maharashtra',
      gstin: '27AABCS9821R1ZF',
      pan: 'AABCS9821R',
      email: 'vishnu.sarda@example.com',
      phone: '+91 98220 12345',
    },
    service: JSON.parse(JSON.stringify(defaultTemplates[0])),
    signatory: defaultFirmProfile.signatories?.[0],
    invoiceMilestoneType: 'advance',
    notes: 'First draft sent for MSME Benefits Assessment. Mobilization advance is 50% (Rs. 9,000 + GST).',
    status: 'letter_sent',
    createdBy: 'CA Yogesh Kulkarni',
    createdAt: '2026-08-20T10:00:00.000Z',
    lastEditedAt: '2026-08-20T10:30:00.000Z',
    actionLog: [
      {
        timestamp: '2026-08-20T10:00:00.000Z',
        user: 'CA Yogesh Kulkarni',
        action: 'Created Engagement Letter GFP/MSME-EL/815/2026',
      },
      {
        timestamp: '2026-08-20T10:15:00.000Z',
        user: 'CA Yogesh Kulkarni',
        action: 'Generated Word docx and sent to client',
      },
    ],
  },
];

export function getStoredFirmProfile(): FirmProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIRM_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultFirmProfile,
        ...parsed,
        bankDetails: { ...defaultFirmProfile.bankDetails, ...(parsed.bankDetails || {}) },
        signatories: parsed.signatories && parsed.signatories.length > 0 ? parsed.signatories : defaultFirmProfile.signatories,
        themeSettings: { ...defaultFirmProfile.themeSettings, ...(parsed.themeSettings || {}) },
        logoPosition: parsed.logoPosition || defaultFirmProfile.logoPosition || 'left',
        firmEmail: parsed.firmEmail || defaultFirmProfile.firmEmail,
      };
    }
  } catch (e) {
    console.error('Error reading firm profile from storage', e);
  }
  return defaultFirmProfile;
}

export function saveFirmProfile(profile: FirmProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FIRM_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving firm profile to storage', e);
  }
}

export function getStoredTemplates(): ServiceTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading templates from storage', e);
  }
  return defaultTemplates;
}

export function saveTemplates(templates: ServiceTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving templates to storage', e);
  }
}

export function getStoredEngagements(): EngagementRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENGAGEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If parsed has only old single record, merge with new sample records
        const hasSeptember = parsed.some(
          (r: EngagementRecord) => r.date?.includes('/09/2026') || r.date?.includes('-09-')
        );
        if (!hasSeptember) {
          const merged = [...initialSampleEngagements.slice(0, 2), ...parsed];
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading engagements from storage', e);
  }
  return initialSampleEngagements;
}

export function saveEngagements(engagements: EngagementRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENGAGEMENTS, JSON.stringify(engagements));
  } catch (e) {
    console.error('Error saving engagements to storage', e);
  }
}

export function getLastUser(): string {
  return localStorage.getItem(STORAGE_KEYS.LAST_USER) || 'CA Yogesh Kulkarni';
}

export function setLastUser(user: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_USER, user);
}

export function generateNextReference(serviceCode?: string, existingRecords: EngagementRecord[] = []): {
  refNo: string;
  invoiceNo: string;
} {
  const currentYear = new Date().getFullYear();
  const code = (serviceCode && typeof serviceCode === 'string' ? serviceCode.trim() : 'GEN').toUpperCase() || 'GEN';
  const records = Array.isArray(existingRecords) ? existingRecords : [];

  // Find max sequence number for this service
  let maxSeq = 815;
  records.forEach((r) => {
    if (r && r.refNo) {
      const match = r.refNo.match(/\/(\d+)\//);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return {
    refNo: `GFP/${code}-EL/${nextSeq}/${currentYear}`,
    invoiceNo: `GFP/${code}-INV/${nextSeq}/${currentYear}`,
  };
}
