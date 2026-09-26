import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { distFile } from './helpers';

const home = distFile('index.html');
const ASTRO = join(process.cwd(), 'dist', '_astro');

describe('homepage hero image', () => {
  const imgs = home.match(/<img\b[^>]*>/g) ?? [];
  const hero = imgs.find((i) => i.includes('hero-bread'))!;

  it('is the only image with fetchpriority high, and loads eagerly', () => {
    expect(hero).toBeDefined();
    expect(imgs.filter((i) => i.includes('fetchpriority="high"'))).toEqual([hero]);
    expect(hero).toContain('loading="eager"');
    expect(hero).toContain('decoding="async"');
  });

  it('has explicit dimensions, a four-width webp srcset and sizes 100vw', () => {
    expect(hero).toMatch(/ width="1600"/);
    expect(hero).toMatch(/ height="2400"/);
    expect(hero).toContain('sizes="100vw"');
    const widths = [...hero.matchAll(/\.webp (\d+)w/g)].map((m) => Number(m[1]));
    expect(widths).toEqual([480, 750, 1080, 1600]);
  });

  it('is preloaded with the same srcset it renders', () => {
    const preload = home.match(/<link rel="preload" as="image"[^>]*>/)![0];
    expect(preload.match(/imagesrcset="([^"]+)"/)![1]).toBe(hero.match(/srcset="([^"]+)"/)![1]);
    expect(preload).toContain('imagesizes="100vw"');
    expect(preload).toContain('fetchpriority="high"');
  });

  it('ships compressed: no variant over 250 KB, the phone variant under 80 KB, and never the source jpg', () => {
    const files = readdirSync(ASTRO).filter((f) => f.startsWith('hero-bread'));
    expect(files.some((f) => f.endsWith('.jpg'))).toBe(false);
    for (const f of files) expect(statSync(join(ASTRO, f)).size, f).toBeLessThan(250_000);
    const phone = hero.match(/\/_astro\/([^ ]+) 750w/)![1];
    expect(statSync(join(ASTRO, phone)).size).toBeLessThan(80_000);
  });
});
