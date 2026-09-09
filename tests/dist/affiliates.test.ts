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

describe('calculator gear block', () => {
  const home = distFile('index.html');
  // Bound at the Baker's Percentage section, which follows the calculator (and the newsletter, when enabled)
  // and precedes the homepage #equipment grid, so that grid's full disclosure is not counted here.
  const block = home.slice(home.indexOf('id="gear-block"'), home.indexOf('id="bakers-percent"'));

  it('exists with a style-to-family map covering every calculator style', () => {
    expect(home).toContain('id="gear-block"');
    expect(home).toContain('data-style-family=');
    for (const style of ['sourdough', 'no-knead', 'baguette', 'ciabatta', 'focaccia', 'sandwich', 'brioche', 'custom']) {
      expect(block, style).toContain(style);
    }
  });

  it('renders the universal list and four family wrappers, dutch-oven visible by default', () => {
    expect(block.match(/data-gear-family="/g)).toHaveLength(4);
    const dutch = block.match(/data-gear-family="dutch-oven" class="([^"]*)"/);
    expect(dutch).not.toBeNull();
    expect(dutch![1]).not.toContain('hidden');
    for (const fam of ['steam-stone', 'sheet-pan', 'loaf-pan']) {
      const m = block.match(new RegExp(`data-gear-family="${fam}" class="([^"]*)"`));
      expect(m, fam).not.toBeNull();
      expect(m![1], fam).toContain('hidden');
    }
  });

  it('uses the calculator tracking id and one compact disclosure', () => {
    expect(block).toContain('?tag=probuild20-20');
    expect(block.match(/As an Amazon Associate, we earn from qualifying purchases\./g)).toHaveLength(1);
    expect(block).not.toContain('Affiliate Disclosure:');
  });
});
