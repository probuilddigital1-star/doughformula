import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allDistHtml, distFile, distFileExists } from './helpers';

const DIST = join(process.cwd(), 'dist');
const css = readdirSync(join(DIST, '_astro'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(DIST, '_astro', f), 'utf8'))
  .join('\n');
const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];

describe('self-hosted fonts', () => {
  it('no page loads anything from Google Fonts', () => {
    for (const { path, html } of allDistHtml()) {
      expect(html, path).not.toContain('fonts.googleapis.com');
      expect(html, path).not.toContain('fonts.gstatic.com');
    }
    expect(css).not.toContain('fonts.gstatic.com');
  });

  it('declares every family and style the site uses, each with font-display swap', () => {
    const has = (family: string, style: string) =>
      faces.some((f) => f.includes(family) && new RegExp(`font-style:\\s*${style}`).test(f));
    // The hero uses Fraunces italic; the pizza CTA and blockquotes use Cormorant italic.
    for (const family of ['Fraunces', 'DM Sans', 'Cormorant Garamond']) {
      expect(has(family, 'normal'), `${family} normal`).toBe(true);
      expect(has(family, 'italic'), `${family} italic`).toBe(true);
    }
    for (const f of faces) expect(f).toMatch(/font-display:\s*swap/);
  });

  it('every font file the CSS or a preload references ships in dist', () => {
    const urls = new Set<string>();
    for (const m of css.matchAll(/url\(["']?(\/fonts\/[^"')]+)["']?\)/g)) urls.add(m[1]);
    for (const m of distFile('index.html').matchAll(/<link rel="preload" as="font"[^>]*href="([^"]+)"/g)) urls.add(m[1]);
    expect(urls.size).toBeGreaterThanOrEqual(6);
    for (const u of urls) expect(distFileExists(u.slice(1)), u).toBe(true);
  });

  it('preloads only the two header faces, as crossorigin woff2', () => {
    const preloads = distFile('index.html').match(/<link rel="preload" as="font"[^>]*>/g) ?? [];
    expect(preloads.map((p) => p.match(/href="([^"]+)"/)![1])).toEqual([
      '/fonts/fraunces-latin-normal.woff2',
      '/fonts/dm-sans-latin-normal.woff2',
    ]);
    for (const p of preloads) {
      expect(p).toContain('type="font/woff2"');
      expect(p).toContain('crossorigin');
    }
  });
});
