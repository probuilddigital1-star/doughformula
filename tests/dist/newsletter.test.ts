import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';
import { NEWSLETTER_ENABLED } from '../../src/config/newsletter';

describe('newsletter section', () => {
  const home = distFile('index.html');

  it('never ships the old live-heading hook', () => {
    expect(home).not.toContain('id="newsletter-style"');
  });

  it('renders only when Kit is configured', () => {
    if (NEWSLETTER_ENABLED) {
      expect(home).toContain('id="newsletter-form"');
      expect(home).toContain('data-kit-form-id="');
    } else {
      expect(home).not.toContain('id="newsletter-form"');
    }
  });

  it('describes the send cadence honestly', () => {
    if (!NEWSLETTER_ENABLED) return;
    expect(home).toContain('An occasional email when a new recipe or tool goes up. Unsubscribe anytime.');
    expect(home).not.toMatch(/weekly tips/i);
  });
});
