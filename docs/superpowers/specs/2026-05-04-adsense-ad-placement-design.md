# AdSense Ad Placement Design

**Date:** 2026-05-04
**Goal:** Place Google AdSense ads on The Dough Formula in spots that earn meaningful revenue without degrading the editorial feel of the site or the conversion experience of the bread calculator.

## Context

The Dough Formula was just approved for Google AdSense (publisher ID `ca-pub-7820884299125377`). The AdSense loader script is already present in `src/layouts/Layout.astro:126`, but no ad units have been placed. The site has three main page types:

1. **Homepage** (`src/pages/index.astro`) — the bread calculator and the bulk of organic traffic. Below the calculator are several long content sections (dark feature, baker's percent explainer, methodology, about, equipment, FAQ).
2. **Article pages** — 22 long-form articles (~1,200–1,700 words each) rendered through `src/layouts/ArticleLayout.astro`, single column, narrow text width.
3. **Category index pages** — grids of `ArticleCard` components for each of five categories.

The site has a deliberate premium-editorial visual language (Fraunces, cream palette, accent-gold) that distinguishes it from typical content-farm sites. Ad placement must respect this.

## Strategy

**Balanced — solid revenue, still tasteful.** Two ads on the homepage in content sections below the calculator and below the newsletter signup, two ads in articles, one in-feed ad on category index pages. No ads in the calculator UI, no ads above the calculator, no ads adjacent to the newsletter signup, no anchor/sticky ads, no ads on policy pages. Auto-placement for the mid-article slot (no per-article author work).

The calculator is the site's conversion magnet and LCP element. The newsletter signup is the secondary conversion. Both stay pristine — ads sit only in pure content sections (educational copy, equipment, FAQ) where the user is reading rather than acting.

## Ad Slot Inventory

| # | ID | Page type | Position | Format |
|---|----|-----------|----------|--------|
| 1 | `homepage-post-newsletter` | Homepage | Between the newsletter section (`section.section-dark`, ends ~line 1189) and the baker's percent explainer (`#bakers-percent`, line 1192) | Responsive display |
| 2 | `homepage-pre-faq` | Homepage | Between the equipment section (`#equipment`, ends ~line 1421) and the FAQ section (`#faq`, line 1422) | Responsive display |
| 3 | `article-mid` | Article pages | Auto-injected before the first `<h2>` inside `.prose` | Responsive display |
| 4 | `article-end` | Article pages | Between the article body and the "Keep Reading" related-articles section | Responsive display |
| 5 | `category-in-feed` | Category index pages | After the third article card in the grid (only renders on categories with 4+ articles) | In-feed (fluid) |

**Pages with zero ads:** `index.astro` above the calculator, the entire `#calculator` section, `about.astro`, `contact.astro`, `privacy.astro`, `guides/index.astro`.

## Architecture

### New files

- **`src/components/AdUnit.astro`** — the only ad-rendering component on the site. Reusable, prop-driven.
- **`src/config/ads.ts`** — single source of truth for AdSense slot IDs and the publisher ID. Centralizes the values so they can be rotated without hunting through layouts.
- **`public/ads.txt`** — required AdSense file at the site root. Contains: `google.com, pub-7820884299125377, DIRECT, f08c47fec0942fa0`.

### Modified files

- **`src/layouts/ArticleLayout.astro`** — adds the static end-of-article ad above "Keep Reading" and the inline script that auto-injects the mid-article ad before the first H2 in `.prose`.
- **`src/pages/index.astro`** — adds `<AdUnit />` at the two homepage positions.
- **`src/pages/[category]/index.astro`** — splits the article grid so an in-feed `<AdUnit />` can be inserted after the third card when the category has 4+ articles.
- **`src/pages/privacy.astro`** — adds a section on Google AdSense, third-party cookies, and reader opt-out (Google's Ads Settings link, NAI, EDAA).

## AdUnit Component

A single component used at every ad position.

**Props:**

```ts
interface Props {
  slot: string;          // AdSense ad slot ID
  format?: 'auto' | 'fluid';  // 'auto' for display, 'fluid' for in-feed
  layoutKey?: string;    // required when format='fluid'
  fullWidth?: boolean;   // sets data-full-width-responsive on the <ins>
  minHeight?: string;    // CSS value for reserved space (default: '260px' for auto, '200px' for fluid)
  class?: string;        // optional extra wrapper classes
}
```

**Render output (display format):**

```html
<div class="ad-slot my-12 mx-auto" data-nosnippet style="min-height: 260px;">
  <p class="ad-label text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3">
    Advertisement
  </p>
  <ins class="adsbygoogle"
       style="display:block;"
       data-ad-client="ca-pub-7820884299125377"
       data-ad-slot="{slot}"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Notes on the markup:**

- The "Advertisement" label uses the same `text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)]` eyebrow style used for category labels elsewhere on the site, so the ad framing reads as native UI rather than a foreign banner.
- `min-height` on the wrapper prevents CLS while AdSense fills the slot. Default sized for typical display ad heights; tunable per-position via the prop.
- `data-nosnippet` on the wrapper keeps ad content out of search engine snippets.
- `my-12` (≈48px vertical margin) gives the ad room to breathe rather than colliding with surrounding text.
- The push script is inline immediately after the `<ins>` element, which AdSense documentation recommends.

## Mid-Article Auto-Injection

Article body is rendered through `<Content />` inside `<div class="prose">` and is opaque to the layout — we cannot inject ads at compile time without a custom rehype plugin (which would be more code than this needs).

Instead, an inline `<script>` at the bottom of `ArticleLayout.astro` runs after the article renders:

```js
(function () {
  const prose = document.querySelector('.prose');
  if (!prose) return;
  const firstH2 = prose.querySelector('h2');
  if (!firstH2) return;

  // Build container that mirrors the AdUnit component output
  const container = document.createElement('div');
  container.className = 'ad-slot my-12';
  container.setAttribute('data-nosnippet', '');
  container.style.minHeight = '260px';
  container.innerHTML = `
    <p class="ad-label text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3">Advertisement</p>
    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7820884299125377" data-ad-slot="${MID_ARTICLE_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>
  `;
  firstH2.before(container);
  (window.adsbygoogle = window.adsbygoogle || []).push({});
})();
```

The slot ID is templated in from the same `src/config/ads.ts` source as the static placements (the layout reads it server-side and renders it into the inline script).

**Why "before the first H2" rather than "after":** placing the ad after an H2 would visually separate the heading from its first paragraph, which looks broken. Placing it before the first H2 puts the ad at the natural break between the article's intro/lede and its first labeled section — readers experience it as a section break, not an interruption.

**Failure mode:** if `.prose` or the first H2 doesn't exist, the script does nothing. No errors, no awkward placements. All current articles have at least two H2s, so this should always succeed in practice.

**Performance:** one DOM query and one insertion, run after the article body is already in the DOM. No effect on LCP. No effect on TTI beyond microseconds.

## Configuration

`src/config/ads.ts`:

```ts
export const ADSENSE_CLIENT = 'ca-pub-7820884299125377';

export const AD_SLOTS = {
  homepagePostCalculator: '',  // fill from AdSense console
  homepageMidContent: '',
  articleMid: '',
  articleEnd: '',
  categoryInFeed: '',
} as const;
```

When a slot is empty string, the `AdUnit` component renders the reserved space with the "Advertisement" label but does NOT emit the `<ins>` tag or push to `adsbygoogle`. This means:

- The site builds and ships safely before slot IDs are populated.
- No broken-ad errors in the console while you're still creating ad units in AdSense.
- Once you paste real slot IDs in, the ads activate on next deploy with no other code changes.

The `categoryInFeed` slot also requires a `data-ad-layout-key` value from AdSense — it'll be added to the config when you create the ad unit.

## CLS Prevention & Visual Integration

- **Reserved space:** every ad container has a `min-height` set inline (260px for display, 200px for in-feed). This holds layout space before AdSense fills it.
- **Centered, max-width respect:** mid-article ads sit inside the `.prose` flow, inheriting the 680px text column width — they don't break the article's reading rhythm. End-of-article and homepage ads use the parent container's full width.
- **Consistent labeling:** every ad slot is preceded by a discreet "Advertisement" eyebrow in the site's existing accent-gold uppercase tracking style.
- **Vertical breathing room:** `my-12` margins around each ad keep them from feeling crammed.
- **No ad-blocker bait:** standard `class="adsbygoogle"` and `<ins>` markup — no obfuscation, no anti-blocker scripts. Readers using ad blockers see clean empty space.

## Policy Compliance

- **`ads.txt`** at the public root — required by AdSense; flagged as a warning in the AdSense console if missing.
- **Privacy policy update** — `privacy.astro` gets a section disclosing Google AdSense, third-party cookies/identifiers, and links to opt-out tools (Google Ads Settings, NAI, EDAA). This is required by AdSense's program policies.
- **No ads on thin or policy pages** — about, contact, privacy, guides hub all stay ad-free. The first three are required to stay ad-free for policy reasons; the guides hub is excluded as a UX choice.
- **No ads near interactive elements** — the calculator UI itself has zero ads to comply with the "encouraging accidental clicks" prohibition. Homepage ads sit in pure content sections below the calculator.
- **Ad density** — five distinct ad positions across the site. No single page exceeds two ads (homepage: 2, article: 2, category index: 1). Well within AdSense's recommended density.

## Testing Plan

1. **Build verification** — `npm run build && npm run preview`, walk through each page type, confirm no console errors and no visible layout regressions when slot IDs are blank.
2. **Slot population** — create five display ad units in the AdSense console, paste the IDs into `src/config/ads.ts`, redeploy.
3. **Live ad render** — load each page type in a clean browser session, confirm:
   - Homepage: two ads visible below the calculator, none above
   - Article: "Advertisement" label appears in two spots (before first H2, before "Keep Reading")
   - Category index (with 4+ articles): in-feed ad in the third grid slot
   - Calculator UI: no ads
   - About / contact / privacy / guides hub: no ads
4. **CLS check** — Lighthouse run on homepage and an article page. Compare CLS to `lighthouse-prod.json` baseline. Acceptance: no measurable regression (CLS still ≤ 0.1).
5. **`ads.txt` reachable** — `curl https://thedoughformula.com/ads.txt` returns the expected line.
6. **Policy spot-check** — open AdSense console after 24h, confirm no policy violations flagged.

## Open Items (Pre-Implementation)

- User must create five Display ad units in the AdSense console and paste slot IDs into `src/config/ads.ts`. The in-feed unit requires both an ad slot ID and a `data-ad-layout-key`.
- Privacy policy disclosure copy will be drafted as part of implementation; user can review wording before merge.

## Out of Scope

- Auto Ads (Google's automatic placement system) — the manual approach gives full control over which areas of the site can show ads, which is what this design is built around.
- A/B testing of ad positions — premature without traffic baselines.
- AdSense reporting integration in the site itself — handled by the AdSense console.
- Header bidding, alternative ad networks, ad mediation — explicitly out of scope; AdSense only.
- Newsletter signup, affiliate links, or other monetization — separate concern.
