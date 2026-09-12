import { describe, it, expect } from 'vitest';
import { distFile, allDistHtml } from './helpers';
import { EVENTS, POSTHOG_KEY, PRODUCTION_HOST, RESERVED_EVENTS } from '../../src/config/analytics';

const PAGES = {
  homepage: 'index.html',
  recipe: 'recipes/baguette-65-overnight/index.html',
  article: 'techniques/autolyse-step-by-step/index.html',
};

/** The body of the one inline analytics script, or '' when the page has none. */
function analyticsScript(html: string): string {
  const m = html.match(/<script data-analytics="posthog"[^>]*>([\s\S]*?)<\/script>/);
  return m ? m[1] : '';
}

function affiliateAnchors(html: string): string[] {
  return html.match(/<a [^>]*data-affiliate="true"[^>]*>/g) ?? [];
}

describe('PostHog snippet', () => {
  for (const [label, rel] of Object.entries(PAGES)) {
    describe(label, () => {
      const html = distFile(rel);
      const script = analyticsScript(html);

      it('ships the snippet inline with the project token', () => {
        expect(script).not.toBe('');
        expect(script).toContain(POSTHOG_KEY);
        expect(script).toContain('/static/array.js');
      });

      it('is marked deferred and initializes only after load', () => {
        expect(html).toContain('data-load="deferred"');
        expect(script).toContain("window.addEventListener('load'");
        expect(script).toContain('requestIdleCallback');
        expect(script).toContain('timeout: 3000');
      });

      it('never loads posthog through an eager script tag', () => {
        // The CDN request comes from the stub's init(), which this page defers. A src= tag
        // pointing at PostHog would fetch during parse and undo that.
        expect(html).not.toMatch(/<script[^>]+src="https:\/\/[^"]*posthog[^"]*"/);
      });

      it('carries the agreed configuration', () => {
        expect(script).toContain('"autocapture":false');
        expect(script).toContain('"disable_session_recording":true');
        expect(script).toContain('"capture_pageview":true');
        expect(script).toContain('"capture_pageleave":true');
        expect(script).toContain('"capture_performance":{"web_vitals":true}');
        expect(script).toContain('"persistence":"localStorage+cookie"');
      });

      it('guards on the production hostname', () => {
        expect(script).toContain(PRODUCTION_HOST);
        expect(script).toContain('location.hostname');
      });

      it('wires every implemented event and none of the reserved ones', () => {
        for (const name of Object.values(EVENTS)) expect(script).toContain(name);
        for (const name of Object.values(RESERVED_EVENTS)) expect(html).not.toContain(name);
      });
    });
  }
});

describe('affiliate click attributes', () => {
  const REQUIRED = [
    'data-product-id',
    'data-product-name',
    'data-merchant',
    'data-placement',
    'data-tracking-id',
  ];

  it('homepage affiliate links carry every attribute the listener reads', () => {
    const anchors = affiliateAnchors(distFile(PAGES.homepage));
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) for (const attr of REQUIRED) expect(a).toContain(attr + '="');
  });

  it('recipe affiliate links carry every attribute the listener reads', () => {
    const anchors = affiliateAnchors(distFile(PAGES.recipe));
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) for (const attr of REQUIRED) expect(a).toContain(attr + '="');
  });

  it('tags each placement from the tracking id it was rendered with', () => {
    const home = distFile(PAGES.homepage);
    expect(home).toContain('data-placement="homepage"');
    expect(home).toContain('data-placement="calculator"');
    expect(distFile(PAGES.recipe)).toContain('data-placement="recipe"');
  });

  it('never renders an unresolved placement', () => {
    for (const { path, html } of allDistHtml()) {
      expect(html, path + ' has an affiliate link with no known placement').not.toContain(
        'data-placement="unknown"',
      );
    }
  });

  it('leaves the affiliate rel and target untouched', () => {
    for (const a of affiliateAnchors(distFile(PAGES.homepage))) {
      expect(a).toContain('rel="sponsored nofollow noopener noreferrer"');
      expect(a).toContain('target="_blank"');
    }
  });
});

describe('built pages', () => {
  // Catches a dev origin leaking into canonical URLs, asset paths or the analytics guard.
  const DEV_HOST = 'local' + 'host';

  it('never mention a development host', () => {
    for (const { path, html } of allDistHtml()) {
      expect(html.toLowerCase(), path + ' mentions a development host').not.toContain(DEV_HOST);
    }
  });
});
