// PostHog Cloud US settings.
// POSTHOG_KEY is the public project token (PostHog > Settings > Project > Project API key).
// It is a client-side key, documented as safe to ship in the browser, and lives here the same
// way KIT_PUBLIC_API_KEY lives in newsletter.ts. Never put a personal API key or the project's
// secret key in this file.
import { placementForTrackingId, type Placement, type Product } from '../data/equipment';

export { placementForTrackingId, type Placement };

export const POSTHOG_KEY = 'phc_mbbaNJmZTt8YAacD7VyeuMoYMfEd67UmNtkrWrpPHyHg';
export const POSTHOG_API_HOST = 'https://us.i.posthog.com';
export const POSTHOG_UI_HOST = 'https://us.posthog.com';

// Analytics runs on the production hostname only. Written as an allow list rather than a
// deny list so dev servers, loopback addresses and preview deploys all stay out of the data
// without naming each one, and so no dev hostname string ships in the built pages.
export const PRODUCTION_HOST = 'thedoughformula.com';

/** Empty token means the snippet does not render at all, the way NEWSLETTER_ENABLED works. */
export const ANALYTICS_ENABLED = POSTHOG_KEY.trim().length > 0;

// Autocapture and session recording are off on purpose: this site captures only the named
// events below, plus pageviews, pageleaves and web vitals.
export const POSTHOG_OPTIONS = {
  api_host: POSTHOG_API_HOST,
  ui_host: POSTHOG_UI_HOST,
  autocapture: false,
  disable_session_recording: true,
  capture_pageview: true,
  capture_pageleave: true,
  capture_performance: { web_vitals: true },
  persistence: 'localStorage+cookie',
  // Project-level extras PostHog would otherwise load on init regardless of the client
  // config above. Surveys and dead-clicks autocapture are both a form of autocapture this
  // site deliberately keeps off; exception autocapture is unused here too.
  disable_surveys: true,
  capture_dead_clicks: false,
  capture_exceptions: false,
  // Heatmaps are on at the project level, and the Heatmaps extension unconditionally
  // instantiates DeadClicksAutocapture to feed it, which is what actually pulls in
  // dead-clicks-autocapture.js. capture_dead_clicks alone doesn't stop that: this is the
  // flag that does.
  capture_heatmaps: false,
} as const;

/** Events the site captures today. */
export const EVENTS = {
  affiliateClick: 'affiliate_click',
  calculatorTab: 'calculator_tab',
  planBakeOpened: 'plan_bake_opened',
  newsletterSubmitted: 'newsletter_submitted',
} as const;

// Reserved for Phase 2 (the hydration and baker's percentage calculator pages). The name is
// settled here so the two pages and the homepage agree when the hand-off ships. Nothing
// captures it yet, and tests/dist/analytics.test.ts asserts it stays out of the built pages.
export const RESERVED_EVENTS = {
  calculatorHandoff: 'calculator_handoff',
} as const;

/**
 * The data attributes an affiliate link needs for the delegated click listener in
 * Analytics.astro to turn it into an affiliate_click event. Spread onto the anchor.
 */
export function affiliateLinkAttributes(
  p: Product,
  trackingId: string,
  placement: Placement = placementForTrackingId(trackingId),
): Record<string, string> {
  return {
    'data-affiliate': 'true',
    'data-product-id': p.id,
    'data-product-name': p.name,
    // Amazon reports as 'amazon'; direct merchants report their own id ('challenger').
    'data-merchant': p.merchant === 'amazon' ? 'amazon' : (p.merchantId ?? 'direct'),
    'data-placement': placement,
    'data-tracking-id': trackingId,
  };
}
