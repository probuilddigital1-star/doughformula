import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { allDistHtml, distFile } from './helpers';

const BASE = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital';
const OTHER_RETAILERS = 'Some links go to other retailers who also pay me a commission.';
const DUTCH_OVEN = ['sourdough', 'country-loaf', 'no-knead'];

const recipeSlugs = readdirSync(join(process.cwd(), 'dist', 'recipes')).filter((n) => n !== 'index.html');
const styleOf = (slug: string) => slug.replace(/-\d.*$/, '');
const recipe = (slug: string) => distFile(`recipes/${slug}/index.html`);

/** The featured card's markup: from its wrapper to the end of its button. */
function card(html: string): string {
  const start = html.indexOf('data-featured-gear=');
  if (start === -1) return '';
  return html.slice(start, html.indexOf('</a>', start) + 4);
}

describe('Challenger featured card on recipe pages', () => {
  const dutch = recipeSlugs.filter((s) => DUTCH_OVEN.includes(styleOf(s)));
  const others = recipeSlugs.filter((s) => !DUTCH_OVEN.includes(styleOf(s)));

  it('finds pages in each group', () => {
    for (const style of DUTCH_OVEN) expect(dutch.some((s) => styleOf(s) === style), style).toBe(true);
    expect(others.length).toBeGreaterThan(0);
  });

  it('shows exactly one card on every sourdough, country loaf and no-knead page, with the recipe campaign', () => {
    for (const slug of dutch) {
      const html = recipe(slug);
      expect(html.match(/data-featured-gear=/g)?.length, slug).toBe(1);
      const c = card(html);
      expect(c, slug).toContain('Featured pick');
      expect(c, slug).toContain('See it at Challenger');
      expect(c, slug).toContain(`href="${BASE}&campaign=recipe"`);
      expect(c, slug).toMatch(/rel="[^"]*\bsponsored\b[^"]*"/);
      expect(c, slug).toMatch(/rel="[^"]*\bnofollow\b[^"]*"/);
      expect(c, slug).toContain('data-merchant="challenger"');
      expect(c, slug).toContain('data-placement="recipe"');
    }
  });

  it('keeps the Lodge on those pages and does not list Challenger in the plain gear list', () => {
    for (const slug of dutch) {
      const html = recipe(slug);
      expect(html, slug).toContain('Lodge Combo Cooker');
      expect(html.match(/View on Challenger/g), slug).toBeNull();
    }
  });

  it('shows the other-retailers disclosure line on those pages', () => {
    for (const slug of dutch) expect(recipe(slug), slug).toContain(OTHER_RETAILERS);
  });

  it('card image is lazy, sized and described', () => {
    const img = card(recipe(dutch[0])).match(/<img[^>]*>/)?.[0] ?? '';
    expect(img).toContain('loading="lazy"');
    expect(img).toMatch(/ width="\d+"/);
    expect(img).toMatch(/ height="\d+"/);
    expect(img).toMatch(/ alt="[^"]{10,}"/);
    expect(img).toMatch(/\.webp/);
    expect(img).toMatch(/srcset="[^"]*720w/);
  });

  it('never appears on other recipe families or the homepage', () => {
    for (const slug of others) {
      const html = recipe(slug);
      expect(html, slug).not.toContain('data-featured-gear');
      expect(html, slug).not.toContain('challengerbreadware.com');
      expect(html, slug).not.toContain(OTHER_RETAILERS);
    }
    const home = distFile('index.html');
    expect(home).not.toContain('data-featured-gear');
    expect(home).not.toContain('challengerbreadware.com');
    expect(home).not.toContain(OTHER_RETAILERS);
  });

  it('every Challenger link on the site carries ref and a campaign tag', () => {
    for (const { path, html } of allDistHtml()) {
      const links = html.match(/https:\/\/challengerbreadware\.com[^"]*/g) ?? [];
      for (const l of links) expect(l, path).toMatch(/\?ref=probuilddigital&campaign=(recipe|recipe-step|calculator)$/);
    }
  });
});
