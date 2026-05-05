import type { Combo } from '../data/recipes';

// Non-cryptographic deterministic hash. Same input -> same output every build.
function stringHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function comboKey(c: Combo): string {
  return `${c.style}|${c.hydration}|${c.schedule}`;
}

export function pickVariant<T>(bank: readonly T[], c: Combo): T {
  if (bank.length === 0) {
    throw new Error('pickVariant: empty bank');
  }
  return bank[stringHash(comboKey(c)) % bank.length];
}
