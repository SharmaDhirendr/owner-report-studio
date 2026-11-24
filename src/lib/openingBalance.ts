const OPENING_BALANCE_PHRASES = [
  'opening balance',
  'beginning balance',
  'beginning cash balance',
  'beginning cash',
];

export function isOpeningBalance(...parts: string[]): boolean {
  const combined = parts
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return OPENING_BALANCE_PHRASES.some((phrase) => combined.includes(phrase));
}
