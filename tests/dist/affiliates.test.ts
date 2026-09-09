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

describe('recipe page gear blocks', () => {
  const cases: [string, string[], string[]][] = [
    // slug, must contain, must not contain
    ['recipes/sourdough-65-slow/index.html', ['Lodge Combo Cooker', 'Banneton Basket Set', 'UFO Bread Lame'], ['ThermiChef', 'USA Pan']],
    ['recipes/baguette-65-same-day/index.html', ['ThermiChef', 'Saint Germain Bakery Couche', 'UFO Bread Lame'], ['Lodge Combo Cooker', 'USA Pan']],
    ['recipes/focaccia-75-same-day/index.html', ['USA Pan 9x13 Rectangular Pan'], ['Lodge Combo Cooker', 'ThermiChef', 'USA Pan 9x5']],
    ['recipes/sandwich-75-overnight/index.html', ['USA Pan 9x5 Loaf Pan'], ['Lodge Combo Cooker', 'ThermiChef', 'USA Pan 9x13']],
  ];

  for (const [file, yes, no] of cases) {
    it(`${file} shows universal gear plus its family set`, () => {
      const html = distFile(file);
      expect(html).toContain("What you&#39;ll need for this bake");
      for (const name of ['Escali Primo Scale', 'OXO Bench Scraper', 'ThermoWorks Thermapen', ...yes]) {
        expect(html, name).toContain(name);
      }
      for (const name of no) expect(html, name).not.toContain(name);
      expect(html).toContain('Affiliate Disclosure:');
      expect(html).toContain(`?tag=probuild20-20`);
    });
  }
});
