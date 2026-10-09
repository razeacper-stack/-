/**
 * Exact Currency & Money Arithmetic Utilities (Phase 9)
 * CRITICAL FINANCIAL INTEGRITY: All internal persistence and math use integer minor units (e.g. Halalas, Piasters, Cents).
 * No floating-point math is ever used to derive stored financial totals.
 */

export type CurrencyCode = 'SAR' | 'EGP' | 'AED' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbolAr: string;
  symbolEn: string;
  nameAr: string;
  nameEn: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  SAR: {
    code: 'SAR',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    nameAr: 'ريال سعودي',
    nameEn: 'Saudi Riyal',
    decimals: 2,
  },
  EGP: {
    code: 'EGP',
    symbolAr: 'ج.م',
    symbolEn: 'EGP',
    nameAr: 'جنيه مصري',
    nameEn: 'Egyptian Pound',
    decimals: 2,
  },
  AED: {
    code: 'AED',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    nameAr: 'درهم إماراتي',
    nameEn: 'UAE Dirham',
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbolAr: '$',
    symbolEn: '$',
    nameAr: 'دولار أمريكي',
    nameEn: 'US Dollar',
    decimals: 2,
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'SAR';

/**
 * Convert major units (e.g. 100.50) to exact integer minor units (e.g. 10050)
 */
export function toMinorUnits(major: number | string, decimals: number = 2): number {
  if (typeof major === 'string') {
    const sanitized = major.trim().replace(/,/g, '');
    const parsed = parseFloat(sanitized);
    if (isNaN(parsed)) return 0;
    major = parsed;
  }
  if (isNaN(major) || !isFinite(major)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(major * factor);
}

/**
 * Convert exact integer minor units (e.g. 10050) to major units (e.g. 100.50)
 */
export function toMajorUnits(minor: number, decimals: number = 2): number {
  if (isNaN(minor) || !isFinite(minor)) return 0;
  const factor = Math.pow(10, decimals);
  return minor / factor;
}

/**
 * Format minor units into clean internationalized currency string
 * e.g. 10050 minor -> "100.50 ر.س" or "SAR 100.50"
 */
export function formatCurrency(
  minorUnits: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  lang: 'ar' | 'en' = 'ar'
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  const major = toMajorUnits(minorUnits, config.decimals);
  const formattedNumber = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(major);

  if (lang === 'ar') {
    return `${formattedNumber} ${config.symbolAr}`;
  }
  return `${config.symbolEn} ${formattedNumber}`;
}

/**
 * Safe exact integer arithmetic helpers
 */
export function addMinor(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => acc + (Math.round(curr) || 0), 0);
}

export function subtractMinor(a: number, b: number): number {
  return (Math.round(a) || 0) - (Math.round(b) || 0);
}

/**
 * Calculate percentage discount/scholarship on base minor amount with exact integer rounding
 */
export function calculatePercentageMinor(baseMinor: number, percentage: number): number {
  if (baseMinor <= 0 || percentage <= 0) return 0;
  if (percentage >= 100) return baseMinor;
  return Math.round((baseMinor * percentage) / 100);
}
