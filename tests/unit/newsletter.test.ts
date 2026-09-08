import { describe, it, expect } from 'vitest';
import { isNewsletterEnabled } from '../../src/config/newsletter';

describe('isNewsletterEnabled', () => {
  it('is false when either value is empty', () => {
    expect(isNewsletterEnabled('', '')).toBe(false);
    expect(isNewsletterEnabled('123', '')).toBe(false);
    expect(isNewsletterEnabled('', 'abc')).toBe(false);
  });

  it('is true when both values are set', () => {
    expect(isNewsletterEnabled('123', 'abc')).toBe(true);
  });

  it('ignores surrounding whitespace', () => {
    expect(isNewsletterEnabled('  ', 'abc')).toBe(false);
  });
});
