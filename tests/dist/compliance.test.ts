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

  it('finds affiliate links on the homepage, all sixty recipe pages and the calculator pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(62);
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

describe('direct-merchant links across the built site', () => {
  const CHALLENGER_ANCHOR = /<a\b[^>]*href="https:\/\/challengerbreadware\.com\/[^"]*"[^>]*>/g;
  const OTHER_RETAILERS = 'Some links go to other retailers who also pay me a commission.';

  it('every Challenger link is sponsored, nofollow and tracked, on a page with the other-retailers line', () => {
    const offenders: string[] = [];
    for (const { path, html } of allDistHtml()) {
      const links = html.match(CHALLENGER_ANCHOR) ?? [];
      if (links.length && !html.includes(OTHER_RETAILERS)) offenders.push(`${path}: no other-retailers line`);
      for (const a of links) {
        const rel = (a.match(/\brel="([^"]*)"/)?.[1] ?? '').split(/\s+/);
        if (!rel.includes('sponsored') || !rel.includes('nofollow')) offenders.push(`${path}: rel ${a.slice(0, 120)}`);
        if (!a.includes('data-affiliate="true"') || !a.includes('data-merchant="challenger"')) offenders.push(`${path}: tracking ${a.slice(0, 120)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
