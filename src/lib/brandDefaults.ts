import type { BrandSettings } from '@/types/report';

export const DEFAULT_PRIMARY_COLOR = '#2563EB';

const SAMPLE_COMPANY = 'Northshore Property Group';
const SAMPLE_OWNER = 'Harborview Holdings';
const SAMPLE_PERIOD = 'October 2026';

const NEAR_BLACK = new Set([
  '#000000',
  '#09090B',
  '#0A0A0A',
  '#0F0F0F',
  '#111111',
  '#121212',
  '#171717',
  '#18181B',
  '#1A1A1A',
  '#27272A',
]);

export const emptyBrand: BrandSettings = {
  companyName: '',
  logoBase64: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  reportPeriod: '',
  ownerName: '',
};

export function visiblePrimaryColor(value: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value.trim());
  if (!match) return DEFAULT_PRIMARY_COLOR;
  const hex = `#${match[1].toUpperCase()}`;
  return NEAR_BLACK.has(hex) ? DEFAULT_PRIMARY_COLOR : hex;
}

export function isSamplePrefill(brand: BrandSettings): boolean {
  return (
    brand.companyName.trim() === SAMPLE_COMPANY &&
    brand.ownerName.trim() === SAMPLE_OWNER &&
    brand.reportPeriod.trim() === SAMPLE_PERIOD
  );
}

export function sanitizeBrand(brand: BrandSettings): BrandSettings {
  const cleared = isSamplePrefill(brand)
    ? { ...brand, companyName: '', ownerName: '', reportPeriod: '', logoBase64: null }
    : brand;
  const unused =
    !cleared.companyName.trim() &&
    !cleared.ownerName.trim() &&
    !cleared.reportPeriod.trim() &&
    !cleared.logoBase64;
  let primaryColor = visiblePrimaryColor(cleared.primaryColor);
  if (unused && primaryColor === '#1E3A8A') primaryColor = DEFAULT_PRIMARY_COLOR;
  if (
    primaryColor === brand.primaryColor &&
    cleared.companyName === brand.companyName &&
    cleared.ownerName === brand.ownerName &&
    cleared.reportPeriod === brand.reportPeriod &&
    cleared.logoBase64 === brand.logoBase64
  ) {
    return brand;
  }
  return { ...cleared, primaryColor };
}
