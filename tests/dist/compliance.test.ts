import { describe, it, expect } from 'vitest';
import { allDistHtml } from './helpers';

// Amazon's Operating Agreement requires this statement, verbatim, wherever Associates links appear.
const REQUIRED_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';
// An affiliate link is an amazon.com URL carrying a tracking tag. Plain amazon.com links (the privacy
// policy points at Amazon's privacy notice) are not affiliate links and are not held to these rules.
const AMAZON_ANCHOR = /<a\b[^>]*href="https?:\/\/(?:www\.)?amazon\.com\/[^"]*[?&]tag=[^"]*"[^>]*>/g;

describe('Amazon Associates compliance across the built site', () => {
  const pages = allDistHtml()
    .map(({ path, html }) => ({ path, html, links: html.match(AMAZON_ANCHOR) ?? [] }))
    .filter((p) => p.links.length > 0);

  it('finds affiliate links on the homepage and all sixty recipe pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(61);
  });

  it('every affiliate link carries rel with both sponsored and nofollow', () => {
    const offenders: string[] = [];
    for (const { path, links } of pages) {
      for (const anchor of links) {
        const rel = anchor.match(/\brel="([^"]*)"/)?.[1] ?? '';
        const tokens = rel.split(/\s+/);
        if (!tokens.includes('sponsored') || !tokens.includes('nofollow')) offenders.push(`${path}: ${anchor.slice(0, 120)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every page with an affiliate link states the required disclosure verbatim', () => {
    const missing = pages.filter((p) => !p.html.includes(REQUIRED_DISCLOSURE)).map((p) => p.path);
    expect(missing).toEqual([]);
  });
});
