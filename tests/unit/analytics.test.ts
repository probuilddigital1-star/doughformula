import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_ENABLED,
  EVENTS,
  POSTHOG_KEY,
  POSTHOG_OPTIONS,
  RESERVED_EVENTS,
  affiliateLinkAttributes,
  placementForTrackingId,
} from '../../src/config/analytics';
import { PRODUCTS, TRACKING_IDS } from '../../src/data/equipment';

describe('placementForTrackingId', () => {
  it('maps each tracking id to its placement', () => {
    expect(placementForTrackingId(TRACKING_IDS.homepage)).toBe('homepage');
    expect(placementForTrackingId(TRACKING_IDS.recipe)).toBe('recipe');
    expect(placementForTrackingId(TRACKING_IDS.calculator)).toBe('calculator');
  });

  it('falls back to unknown rather than throwing on an unseen id', () => {
    expect(placementForTrackingId('some-new-tag-20')).toBe('unknown');
    expect(placementForTrackingId('')).toBe('unknown');
  });
});

describe('affiliateLinkAttributes', () => {
  const product = PRODUCTS['escali-scale'];

  it('builds the full attribute set for an Amazon product', () => {
    expect(affiliateLinkAttributes(product, TRACKING_IDS.homepage)).toEqual({
      'data-affiliate': 'true',
      'data-product-id': 'escali-scale',
      'data-product-name': 'Escali Primo Scale',
      'data-merchant': 'amazon',
      'data-placement': 'homepage',
      'data-tracking-id': TRACKING_IDS.homepage,
    });
  });

  it('takes the placement from the tracking id it is given', () => {
    expect(affiliateLinkAttributes(product, TRACKING_IDS.recipe)['data-placement']).toBe('recipe');
    expect(affiliateLinkAttributes(product, TRACKING_IDS.calculator)['data-placement']).toBe(
      'calculator',
    );
  });

  it('carries the merchant for a direct product', () => {
    const direct = { ...product, merchant: 'direct' as const, href: 'https://example.com' };
    expect(affiliateLinkAttributes(direct, TRACKING_IDS.recipe)['data-merchant']).toBe('direct');
  });

  it('reports Challenger as merchant challenger, with the placement from the tracking id', () => {
    const c = PRODUCTS['challenger-bread-pan'];
    expect(affiliateLinkAttributes(c, TRACKING_IDS.recipe)).toMatchObject({
      'data-merchant': 'challenger',
      'data-placement': 'recipe',
      'data-product-id': 'challenger-bread-pan',
    });
    expect(affiliateLinkAttributes(c, TRACKING_IDS.calculator)['data-placement']).toBe('calculator');
  });

  it('takes an explicit placement for the in-step mention', () => {
    const c = PRODUCTS['challenger-bread-pan'];
    expect(affiliateLinkAttributes(c, TRACKING_IDS.recipe, 'recipe_step')['data-placement']).toBe('recipe_step');
  });

  it('never emits an empty required attribute', () => {
    for (const p of Object.values(PRODUCTS)) {
      const attrs = affiliateLinkAttributes(p, TRACKING_IDS.recipe);
      for (const [name, value] of Object.entries(attrs)) {
        expect(value, p.id + ' produced an empty ' + name).not.toBe('');
      }
    }
  });
});

describe('PostHog configuration', () => {
  it('is enabled with a public project token', () => {
    expect(ANALYTICS_ENABLED).toBe(true);
    expect(POSTHOG_KEY.startsWith('phc_')).toBe(true);
  });

  it('keeps autocapture and session recording off', () => {
    expect(POSTHOG_OPTIONS.autocapture).toBe(false);
    expect(POSTHOG_OPTIONS.disable_session_recording).toBe(true);
  });

  it('turns off the project-level extras PostHog would otherwise load on init', () => {
    expect(POSTHOG_OPTIONS.disable_surveys).toBe(true);
    expect(POSTHOG_OPTIONS.capture_dead_clicks).toBe(false);
    expect(POSTHOG_OPTIONS.capture_exceptions).toBe(false);
    expect(POSTHOG_OPTIONS.capture_heatmaps).toBe(false);
  });

  it('captures pageviews, pageleaves and web vitals', () => {
    expect(POSTHOG_OPTIONS.capture_pageview).toBe(true);
    expect(POSTHOG_OPTIONS.capture_pageleave).toBe(true);
    expect(POSTHOG_OPTIONS.capture_performance.web_vitals).toBe(true);
    expect(POSTHOG_OPTIONS.persistence).toBe('localStorage+cookie');
  });

  it('keeps the Phase 2 hand-off event reserved and separate', () => {
    expect(RESERVED_EVENTS.calculatorHandoff).toBe('calculator_handoff');
    expect(Object.values(EVENTS)).not.toContain('calculator_handoff');
  });
});
