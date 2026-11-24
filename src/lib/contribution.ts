const CONTRIBUTION_PHRASES = ['owner contribution', 'capital call', 'contribution'];

export function isOwnerContribution(...parts: string[]): boolean {
  const combined = parts
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return CONTRIBUTION_PHRASES.some((phrase) => combined.includes(phrase));
}
