import { describe, it, expect } from 'vitest';
import { handoffHref } from '../../src/lib/handoff';

describe('handoffHref', () => {
  it('builds the URL the homepage calculator reads', () => {
    expect(handoffHref({ hydration: 75, weight: 875 })).toBe('/?loaves=1&weight=875&hydration=75#calculator');
    expect(handoffHref({ hydration: 72.7, weight: 960 })).toBe('/?loaves=1&weight=960&hydration=72.7#calculator');
  });
  it('clamps hydration to the 50 to 95 range the homepage accepts', () => {
    expect(handoffHref({ hydration: 40, weight: 900 })).toBe('/?loaves=1&weight=900&hydration=50#calculator');
    expect(handoffHref({ hydration: 120, weight: 900 })).toBe('/?loaves=1&weight=900&hydration=95#calculator');
  });
  it('keeps weight inside the homepage field range of 200 to 2000 g', () => {
    expect(handoffHref({ hydration: 70, weight: 150 })).toBe('/?loaves=1&weight=200&hydration=70#calculator');
    expect(handoffHref({ hydration: 70, weight: 2600 })).toBe('/?loaves=1&weight=2000&hydration=70#calculator');
  });
  it('rounds weight and falls back to the homepage defaults on bad input', () => {
    expect(handoffHref({ hydration: 70, weight: 900.6 })).toBe('/?loaves=1&weight=901&hydration=70#calculator');
    expect(handoffHref({ hydration: NaN, weight: 0 })).toBe('/?loaves=1&weight=900&hydration=75#calculator');
  });
});
