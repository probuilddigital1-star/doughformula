import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

const home = distFile('index.html');
const BASE = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital';
const OTHER_RETAILERS = 'Some links go to other retailers who also pay me a commission.';
const decode = (v: string) =>
  v.replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&amp;/g, '&');

const blockStart = home.indexOf('id="gear-block"');
const block = home.slice(blockStart, home.indexOf('</aside>', blockStart));
const aside = home.slice(home.lastIndexOf('<aside', blockStart), home.indexOf('>', blockStart) + 1);

describe('homepage "More tools" line', () => {
  it('sits directly after the recipe output and before the gear block', () => {
    const at = home.indexOf('id="more-tools"');
    expect(at).toBeGreaterThan(home.indexOf('id="btn-copy"'));
    expect(at).toBeLessThan(blockStart);
  });

  it('reads as specified, links both calculators and tags them for tool_link_click', () => {
    const p = home.slice(home.lastIndexOf('<p', home.indexOf('id="more-tools"')), home.indexOf('</p>', home.indexOf('id="more-tools"')) + 4);
    const text = p.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    expect(text).toBe("Also try the hydration calculator and the baker's percentage calculator.");
    expect(p).toMatch(/<a href="\/hydration-calculator\/"[^>]*data-tool-link="homepage_more_tools"[^>]*>hydration calculator<\/a>/);
    expect(p).toMatch(/<a href="\/bakers-percentage-calculator\/"[^>]*data-tool-link="homepage_more_tools"[^>]*>baker(&#39;|')s percentage calculator<\/a>/);
    expect(p).toContain('text-sm text-[var(--crust-brown)]');
    expect(p).not.toContain('—');
  });
});

describe('Challenger card in the homepage calculator gear block', () => {
  const styleInstructions = [...home.matchAll(/data-style="([^"]+)"[^>]*data-instructions="([^"]*)"/g)].map((m) => ({
    id: m[1],
    instructions: JSON.parse(decode(m[2])) as string[],
  }));
  const featuredStyles = JSON.parse(decode(aside.match(/data-featured-styles="([^"]*)"/)![1])) as string[];

  it('is decided by the style data: exactly the styles whose instructions mention a Dutch oven', () => {
    expect(styleInstructions.length).toBe(8);
    const fromData = styleInstructions.filter((s) => s.instructions.some((i) => /dutch oven/i.test(i))).map((s) => s.id);
    expect(featuredStyles).toEqual(fromData);
    expect(featuredStyles).toEqual(['sourdough', 'no-knead']);
  });

  it('is visible in the server HTML for the default style, Sourdough', () => {
    expect(styleInstructions[0].id).toBe('sourdough');
    expect(home).toMatch(/class="[^"]*card-selected[^"]*"[^>]*data-style="sourdough"/);
    const wrap = block.match(/<div data-featured-wrap[^>]*>/)![0];
    expect(wrap).not.toMatch(/\bhidden\b/);
    expect(block.indexOf('data-featured-wrap')).toBeLessThan(block.indexOf('data-gear-family='));
  });

  it('is shown and hidden on style change by the calculator script', () => {
    // The calculator script ships as a bundled, minified module; selector strings and dataset
    // keys survive minification.
    const scripts = [...home.matchAll(/<script type="module" src="(\/_astro\/[^"]+\.js)"/g)].map((m) => distFile(m[1].slice(1)));
    const calc = scripts.find((js) => js.includes('data-featured-wrap')) ?? '';
    expect(calc).toContain('[data-featured-wrap], [data-other-retailers]');
    expect(calc).toContain('featuredStyles');
  });

  it('links with campaign=homepage, sponsored nofollow, and reports homepage_calculator / homepage', () => {
    const a = block.match(/<a [^>]*challengerbreadware[^>]*>/)![0];
    expect(a).toContain(`href="${BASE}&campaign=homepage"`);
    expect(a).toMatch(/rel="[^"]*\bsponsored\b[^"]*\bnofollow\b[^"]*"/);
    expect(a).toContain('data-affiliate="true"');
    expect(a).toContain('data-merchant="challenger"');
    expect(a).toContain('data-placement="homepage_calculator"');
    expect(a).toContain('data-tracking-id="homepage"');
    expect(block).toContain('See it at Challenger');
  });

  it('uses the stacked layout with a lazy, sized, described image', () => {
    const card = block.slice(block.indexOf('data-featured-gear='));
    expect(block.match(/class="card featured-gear[^"]*"/)![0]).not.toContain('sm:flex-row');
    const img = card.match(/<img[^>]*>/)![0];
    expect(img).toContain('loading="lazy"');
    expect(img).toMatch(/ width="360"/);
    expect(img).toMatch(/ height="240"/);
    expect(img).toMatch(/ alt="[^"]{10,}"/);
  });

  it("isn't listed again in the text gear list", () => {
    expect(home).not.toContain('View on Challenger');
    expect(home.match(/challengerbreadware\.com/g)).toHaveLength(1);
  });

  it("the gear block's disclosure carries the other-retailers line, toggled with the card", () => {
    expect(block.match(/As an Amazon Associate I earn from qualifying purchases\./g)).toHaveLength(1);
    const span = block.match(/<span data-other-retailers[^>]*>([\s\S]*?)<\/span>/)!;
    expect(span[0]).not.toMatch(/class="[^"]*\bhidden\b/);
    expect(span[1].trim()).toBe(OTHER_RETAILERS);
  });

  it("the homepage equipment section's disclosure is unchanged (all Amazon, no other-retailers line)", () => {
    const section = home.slice(home.indexOf('id="equipment"'), home.indexOf('id="faq"'));
    expect(section).toContain('Affiliate Disclosure:');
    expect(section).not.toContain(OTHER_RETAILERS);
  });
});

describe('homepage Amazon links are unchanged', () => {
  it('every ASIN and tracking id matches the pre-promotion build exactly', () => {
    const links = (home.match(/https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]+\?tag=[^"]+/g) ?? []).sort();
    expect(links).toEqual(
      [
        'B00004OCNJ?tag=probuild20-20', 'B00004OCNJ?tag=tdf-calc-20',
        'B0007GAWRS?tag=probuild20-20', 'B0007GAWRS?tag=tdf-calc-20',
        'B0009JKG9M?tag=probuild20-20', 'B0009JKG9M?tag=tdf-calc-20',
        'B0029JOC6I?tag=tdf-calc-20',
        'B002UNMZOO?tag=tdf-calc-20',
        'B06XXXQVNZ?tag=tdf-calc-20',
        'B08CTCHYDT?tag=probuild20-20', 'B08CTCHYDT?tag=tdf-calc-20', 'B08CTCHYDT?tag=tdf-calc-20',
        'B08G4ZPZBZ?tag=probuild20-20', 'B08G4ZPZBZ?tag=tdf-calc-20',
        'B0BR5ZLMFP?tag=tdf-calc-20',
        'B0DG71Q1LZ?tag=probuild20-20', 'B0DG71Q1LZ?tag=tdf-calc-20',
      ].map((l) => `https://www.amazon.com/dp/${l}`).sort(),
    );
  });
});
