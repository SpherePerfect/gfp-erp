/**
 * Multi-Currency Exchange & Milestone Billing Schedule Generator
 * Tailored for Indian Advisory & Global Cross-Border Mandates
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  exchangeRateToInr: number; // 1 Unit of Currency = X INR
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    exchangeRateToInr: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRateToInr: 86.85,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRateToInr: 91.20,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    exchangeRateToInr: 23.65,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    exchangeRateToInr: 109.40,
  },
};

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string = 'INR'): number {
  if (!amount || isNaN(amount)) return 0;
  const from = SUPPORTED_CURRENCIES[fromCurrency] || SUPPORTED_CURRENCIES.INR;
  const to = SUPPORTED_CURRENCIES[toCurrency] || SUPPORTED_CURRENCIES.INR;

  // Convert to INR first, then to target
  const inrValue = amount * from.exchangeRateToInr;
  const targetValue = inrValue / to.exchangeRateToInr;
  return Math.round(targetValue);
}

export function formatCurrencyWithSymbol(amount: number, currencyCode: string = 'INR'): string {
  const curr = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const formatted = Math.round(amount || 0).toLocaleString('en-IN');
  return `${curr.symbol} ${formatted}`;
}

export interface MilestoneTemplateOption {
  id: string;
  name: string;
  description: string;
  splits: { name: string; percent: number; trigger: string }[];
}

export const PRESET_MILESTONE_SCHEDULES: MilestoneTemplateOption[] = [
  {
    id: '50_50',
    name: '50% Advance / 50% Final Delivery',
    description: 'Standard consulting schedule for corporate finance and valuation assignments',
    splits: [
      { name: 'Mobilization Advance', percent: 50, trigger: 'Upon signing of this Engagement Letter' },
      { name: 'Final Deliverable Sign-off', percent: 50, trigger: 'Upon submission and approval of the Final Deliverable' },
    ],
  },
  {
    id: '40_30_30',
    name: '40% Advance / 30% Interim Draft / 30% Final',
    description: 'Structured for multi-phase feasibility studies, CMA data, and transaction advisory',
    splits: [
      { name: 'Mobilization Advance', percent: 40, trigger: 'Upon signing of this Engagement Letter & onboarding' },
      { name: 'Interim Draft Submission', percent: 30, trigger: 'Upon delivery of First Draft Financial Model / Review' },
      { name: 'Final Sign-off & Closure', percent: 30, trigger: 'Upon delivery of Final Approved Report' },
    ],
  },
  {
    id: '100_ADVANCE',
    name: '100% Upfront Retainer Advance',
    description: 'Recommended for fast-track statutory opinions, due diligence, and credit appraisals',
    splits: [
      { name: 'Full Upfront Retainer', percent: 100, trigger: '100% Advance prior to commencement of field work' },
    ],
  },
  {
    id: '33_33_34',
    name: 'Equal Tranches (33.3% / 33.3% / 33.4%)',
    description: 'Equally distributed across initiation, progress milestone, and handover',
    splits: [
      { name: 'Tranche 1: Commencement', percent: 33.3, trigger: 'Upon formal engagement execution' },
      { name: 'Tranche 2: Milestone Review', percent: 33.3, trigger: 'Upon completion of secondary research & analysis' },
      { name: 'Tranche 3: Handover & Sign-off', percent: 33.4, trigger: 'Upon formal delivery of executive deliverables' },
    ],
  },
];
