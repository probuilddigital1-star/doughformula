import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';
import { NEWSLETTER_ENABLED } from '../../src/config/newsletter';

describe('homepage inline footer', () => {
  const home = distFile('index.html');

  it('links Subscribe to the newsletter section instead of a dead button', () => {
    expect(home).toContain('<a href="#newsletter" class="btn btn-gold text-sm">Subscribe</a>');
    expect(home).not.toContain('<button class="btn btn-gold text-sm">Subscribe</button>');
  });

  it('gives the newsletter section the anchor the footer link targets', () => {
    if (NEWSLETTER_ENABLED) expect(home).toContain('id="newsletter"');
    else expect(home).not.toContain('id="newsletter"');
  });

  it('prints the build-time year like SiteFooter.astro', () => {
    expect(home).toContain(`&copy; ${new Date().getFullYear()} The Dough Formula. Made with care`);
    expect(home).not.toContain('© 2025');
  });
});
