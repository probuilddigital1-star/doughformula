// Shared display rules for the calculator pages. A result whose required input is empty (or a
// weight that is zero) shows a dash rather than a misleading "0 g" or "0%".

export const DASH = '–';

/** Parses an input's raw value. Empty or non-numeric text is NaN. */
export function parseInput(raw: string | undefined): number {
  const s = (raw ?? '').trim();
  return s === '' ? NaN : Number(s);
}

/** A weight that can anchor a calculation: a number above zero. */
export const isWeight = (n: number): boolean => Number.isFinite(n) && n > 0;

/** An amount or percent that may legitimately be zero, but not empty or negative. */
export const isAmount = (n: number): boolean => Number.isFinite(n) && n >= 0;

export const grams = (n: number | null): string => (n === null ? DASH : `${n} g`);
export const percent = (n: number | null): string => (n === null ? DASH : `${n}%`);
