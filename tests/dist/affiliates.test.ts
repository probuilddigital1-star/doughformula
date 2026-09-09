import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('homepage equipment section', () => {
  const home = distFile('index.html');
  // Bound at the FAQ section that follows, so footer and FAQ text do not leak into the assertions.
  const section = home.slice(home.indexOf('id="equipment"'), home.indexOf('id="faq"'));

  it('keeps the section anchor the footer links to', () => {
    expect(home).toContain('id="equipment"');
    expect(home).toContain('href="#equipment"');
  });

  it('shows the original six products in the original order with no prices', () => {
    const names = [
      'Lodge Combo Cooker',
      'Escali Primo Scale',
      'OXO Bench Scraper',
      'Banneton Basket Set',
      'UFO Bread Lame',
      'ThermoWorks Thermapen',
    ];
    let last = -1;
    for (const name of names) {
      const idx = section.indexOf(name);
      expect(idx, name).toBeGreaterThan(last);
      last = idx;
    }
    expect(section).not.toContain('~$');
  });

  it('links carry the homepage tracking id and sponsored rel', () => {
    expect(section).toContain('https://www.amazon.com/dp/B0009JKG9M?tag=probuild20-20');
    expect(section.match(/rel="noopener noreferrer sponsored"/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('shows the full disclosure', () => {
    expect(section).toContain('Affiliate Disclosure:');
  });
});
