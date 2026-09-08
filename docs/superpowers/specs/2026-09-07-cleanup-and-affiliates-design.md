# Cleanup, Newsletter, and Affiliate Expansion Design

**Date:** 2026-09-07
**Goal:** Ship one release that removes the dead AdSense integration, makes the newsletter form real, and extends Amazon Associates to the recipe pages and the calculator, without touching anything that currently ranks.

## Context

Six months of Search Console data (2026-03-05 to 2026-09-04) show the site growing from 9 to 270 clicks per 28 days, with the homepage calculator holding position 5.4 for `bread calculator`. Two facts from that data drive this design:

- **The audience is tool users, not readers.** Calculator queries produced 369 of 376 attributed clicks. The 22 editorial articles produced 7. Display advertising monetizes readers; this site does not have them.
- **AdSense has declined the site repeatedly.** The slots are live in the markup with an unapproved account, so every page renders empty 260px boxes labeled "Advertisement," and Lighthouse shows Google ads and consent JavaScript at 310 to 370KB of the 600 to 790KB page weight, roughly 225KB of it flagged unused. The site's lab performance score is 56 to 64 on mobile, which is 62% of impressions.

Two other findings shape the work:

- The homepage newsletter form shows a "You're in!" toast and captures nothing. It has done this for every visitor since April.
- Amazon Associates is live (tag `probuild20-20`, site registered) but appears only on the homepage, not on the 60 recipe pages or in the calculator's results panel where purchase intent is highest.

Lab CLS is approximately 0 on the homepage, a recipe page, and an article. The failing field CLS that Cloudflare reports must come from post-load interaction on the calculator. The cause is not yet identified and this design does not guess at it.

## Constraints

**Nothing that ranks changes.** The homepage title tag, H1, URL, content structure, and the formula code that renders the calculator are out of scope. All homepage edits in this release are removals of non-content (ad slots), additions below existing content (gear block), or like-for-like swaps (the equipment grid rendered from a data file instead of hardcoded, same six products in the same order).

**Additive elsewhere.** Recipe pages gain a block; nothing existing on them is rewritten.

**Amazon Associates Operating Agreement.** Disclosure on every page that carries a link. No displayed prices (they must come from Amazon's API or not appear). No product images (they require PA-API access the account does not have yet). `rel="sponsored"` retained on every link.

**Writing style.** Any new prose follows the hard bans in the project's writing-style memory: no em dashes, none of the listed AI-tell phrases, no rule-of-three constructions.

## Scope

**In:** AdSense removal, font subsetting, CLS identification and targeted fix, real newsletter, affiliate data model and components, three affiliate placements, per-placement tracking IDs, privacy policy update, verification.

**Out (deferred to a later spec after a two-week observation window):** dedicated hydration and baker's percentage calculator pages, the windowpane article addition, any homepage title change, any ad network, any paid product.

---

## Section 1: Cleanup

### 1.1 AdSense removal

Delete files:
- `src/components/AdUnit.astro`
- `src/config/ads.ts`
- `public/ads.txt`

Edit `src/layouts/Layout.astro`:
- Remove the four ad-network hints at lines 98 to 101: preconnects to `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`, and the dns-prefetch to `www.googletagservices.com`.
- Remove the `adsbygoogle.js` script tag at line 132.
- Keep the two Google Fonts preconnects at lines 94 and 95.

Remove `<AdUnit>` usages and their imports (`AdUnit`, `AD_SLOTS`, `ADSENSE_CLIENT`):
- `src/pages/index.astro`: lines 1194 and 1428, plus the import at line 5.
- `src/layouts/ArticleLayout.astro`: line 195, plus the lazy mid-article slot injector `<script define:vars>` beginning at line 211, plus the import at line 7.
- `src/layouts/RecipeLayout.astro`: line 177, plus the lazy injector beginning at line 204, plus the import at line 9.
- `src/pages/recipes/index.astro`: line 67 and the import at line 5.
- `src/pages/[category]/index.astro`: the block beginning at line 58 and the import at line 6.

The in-feed slot in the two category grids is one card among many; the grid layout is unchanged when it goes.

The `Fjalla One` stylesheet and the `mysidia_one_click_handler` script that Lighthouse observed on article pages are injected by AdSense and disappear with it. No action needed.

`global.css` contains no `.ad-slot` or `adsbygoogle` rules. Nothing to remove there.

### 1.2 Fonts

Current request loads Cormorant Garamond in five variants, DM Sans in five, and Fraunces in seven (four upright, three italic). Six font files, 282KB on the homepage.

- **Cormorant Garamond** is used in exactly three places (`ArticleLayout.astro:159`, `RecipeLayout.astro:149`, `index.astro:252`), each a lede paragraph at regular weight with no italic class. Subset the request to `Cormorant+Garamond:wght@400`.
- **Fraunces** italic axis: the `italic` occurrences in the codebase are body-font emphasis (article `<em>` rendered through prose, two body-text spots on the homepage), not display headings. At implementation, grep for any element carrying both `font-display` (or `.font-display`) and `italic`; if none, drop the three Fraunces italic variants. Expected saving: one font file, roughly 66KB.
- **DM Sans** is the body font and stays as-is.
- The hardcoded Fraunces `<link rel="preload">` in `Layout.astro` points at a `v32` file that Google Fonts no longer serves (Lighthouse shows it requested with 0 bytes used). Remove it; the stylesheet preload already covers font discovery.
- `display=swap` stays.

### 1.3 CLS: identify, then fix

Per the project's debug-before-fix rule, no min-heights are added on guesswork.

1. **Confirm the page.** In Cloudflare Web Analytics, Core Web Vitals, group by path. Confirm the homepage is where CLS fails. (User step; the dashboard is not accessible from the repo.)
2. **Identify the elements.** Record a Chrome DevTools performance trace of the calculator interactions on the built preview: select each style card, toggle a preferment on and off, open the advanced tabs, change hydration. Read the layout-shift entries for the specific nodes and their shift scores. Candidates from the code, not conclusions: `#preferment-section` un-hiding inside the recipe card; `#ingredients-list`, `#instructions-list`, and the timeline being replaced via `innerHTML` at different heights; late font swap on slow connections.
3. **Fix only what the trace names.** Reserved `min-height` on a region that changes size, or a fixed-height container, applied to the identified nodes only.
4. **Re-measure** with the same trace. Field CLS in Cloudflare will take a week or two to reflect the change.

If step 1 shows the homepage is not the source, stop and re-plan this subsection.

### 1.4 Privacy policy

`src/pages/privacy.astro`:
- Delete the "Google AdSense" section (lines 40 to 55).
- Reword the intro at line 27 and the cookies paragraph at line 33 to reference analytics only.
- Add an "Email newsletter" paragraph: what is collected (email address), that Kit processes it on the site's behalf, that every email includes an unsubscribe link, and that no address is shared or sold.
- Add an "Amazon Associates" sentence: the site participates in the program, links to Amazon carry an affiliate tag, and Amazon's own privacy policy governs what happens on Amazon.

---

## Section 2: Newsletter

### 2.1 Provider

Kit (formerly ConvertKit), free tier: 10,000 subscribers, no card required. Chosen because it has a documented client-side subscribe path that works from a static site with no backend.

### 2.2 Wiring

New `src/config/newsletter.ts`:

```ts
export const KIT_FORM_ID = '';          // from Kit: Grow > Landing Pages & Forms > form ID
export const KIT_PUBLIC_API_KEY = '';   // from Kit: Settings > Developer > API Key (public, not the secret)
export const NEWSLETTER_ENABLED = KIT_FORM_ID.length > 0 && KIT_PUBLIC_API_KEY.length > 0;
```

Homepage section (`index.astro` lines 1164 to 1191): keep the existing markup and styling. Wrap the section so it renders only when `NEWSLETTER_ENABLED` is true. If the Kit values are empty at build time, the section is omitted entirely rather than shipping a form that goes nowhere. Remove the `newsletter-style` live-text update block (~line 2621) since it only decorates the heading; keep the heading static.

Submit handler (~line 3561): replace the toast-only handler with a client-side subscribe.

- **Primary path (verified against Kit's developer docs 2026-09-07):** `POST https://api.convertkit.com/v3/forms/{FORM_ID}/subscribe` with a JSON body `{ api_key: KIT_PUBLIC_API_KEY, email }`. The v3 `api_key` is Kit's public key and is documented as safe for browser use; `api_secret` is never shipped. Success is HTTP 200 with a `subscription` object. On success, show `showToast("You're in! Check your inbox to confirm.")` and clear the field. On a non-2xx or network error, show `showToast("Something went wrong. Try again in a moment.")`.
- **Known risk:** Kit marks v3 as "deprecated and will be sunset in the future" with no date given. v4 requires a secret API key or OAuth and has no client-side path, so v3 remains the only documented API route for a static site.
- **Fallback if v3 is sunset:** switch the form to a plain HTML POST to `https://app.kit.com/forms/{FORM_ID}/subscriptions` with field name `email_address`, the same endpoint Kit's own embed script uses. This lands the visitor on Kit's hosted confirmation page instead of showing the toast. Kit's embed also sends a reCAPTCHA `token` with its fetch-based submissions, so a fetch to this endpoint from our own code may be rejected without one; the plain form POST avoids that. The switch is a small handler change, not a redesign.
- No Kit JavaScript embed is loaded. The site stays free of third-party scripts.

Kit's default double opt-in stays on. The toast copy above tells the visitor to look for the confirmation email.

### 2.3 Inputs from the user

A Kit account, one form created in it, and the form ID plus the public API key pasted into `src/config/newsletter.ts`. Until then the section does not render.

---

## Section 3: Affiliates

### 3.1 Data model

First, in `src/data/recipes.ts`, add `export type ShapeFamily = 'dutch-oven' | 'steam-stone' | 'loaf-pan' | 'sheet-pan';` and use it for `StyleMeta.shapeFamily` (currently an inline union at line 71). This is a data file, not the homepage.

New `src/data/equipment.ts`:

```ts
import type { ShapeFamily } from './recipes';

export type Merchant = 'amazon' | 'direct';

export interface Product {
  id: string;
  name: string;
  blurb: string;
  merchant: Merchant;
  asin?: string;          // required when merchant === 'amazon'
  href?: string;          // required when merchant === 'direct'; the full affiliate URL that program issues
  merchantLabel?: string; // link text, e.g. 'Breadtopia'; defaults to 'Amazon' for amazon products
}

export const PRODUCTS: Record<string, Product> = { /* ten products, below, all merchant: 'amazon' today */ };

export type GearFamily = ShapeFamily | 'universal';
export const GEAR_SETS: Record<GearFamily, string[]> = {
  universal:     ['escali-scale', 'oxo-bench-scraper', 'thermapen'],
  'dutch-oven':  ['lodge-combo-cooker', 'banneton-set', 'ufo-lame'],
  'steam-stone': ['thermichef-steel', 'saint-germain-couche', 'ufo-lame'],
  'sheet-pan':   ['usa-pan-9x13'],
  'loaf-pan':    ['usa-pan-loaf'],
};

// Preserves the current homepage order exactly.
export const HOMEPAGE_PRODUCTS = [
  'lodge-combo-cooker', 'escali-scale', 'oxo-bench-scraper',
  'banneton-set', 'ufo-lame', 'thermapen',
];

export const TRACKING_IDS = {
  homepage:   'probuild20-20',
  recipe:     'probuild20-20',   // replace with tdf-recipe-20 once created
  calculator: 'probuild20-20',   // replace with tdf-calc-20 once created
} as const;

export function productUrl(p: Product, trackingId: string): string {
  if (p.merchant === 'amazon') return `https://www.amazon.com/dp/${p.asin}?tag=${trackingId}`;
  return p.href!;
}
```

All ten current products are `merchant: 'amazon'`. The `direct` shape exists so links from other programs (Brød & Taylor, Breadtopia, Challenger) can join the same gear lists later with a data-file edit and no model change. Card link text reads "View on {merchantLabel} →", so the destination is never obscured.

```ts

// Maps calculator style ids (index.astro breadStyles) to a gear family.
export const CALCULATOR_STYLE_FAMILY: Record<string, GearFamily> = {
  sourdough: 'dutch-oven', 'no-knead': 'dutch-oven',
  baguette: 'steam-stone', ciabatta: 'steam-stone',
  focaccia: 'sheet-pan',
  sandwich: 'loaf-pan', brioche: 'loaf-pan',
  custom: 'universal',
};
```

### 3.2 Products

The six existing products carry over with their current names and blurbs unchanged (they are on the ranking page). Prices are dropped everywhere.

| id | Name | ASIN | Family |
|---|---|---|---|
| `lodge-combo-cooker` | Lodge Combo Cooker | B0009JKG9M | dutch-oven |
| `escali-scale` | Escali Primo Scale | B0007GAWRS | universal |
| `oxo-bench-scraper` | OXO Bench Scraper | B00004OCNJ | universal |
| `banneton-set` | Banneton Basket Set | B08G4ZPZBZ | dutch-oven |
| `ufo-lame` | UFO Bread Lame | B08CTCHYDT | dutch-oven, steam-stone |
| `thermapen` | ThermoWorks Thermapen | B0DG71Q1LZ | universal |

Four new products, researched on Amazon 2026-09-07. Each is the top organic result Amazon surfaces for its category.

| id | Name | ASIN | Blurb |
|---|---|---|---|
| `thermichef-steel` | ThermiChef 16-Inch Baking Steel | B0BR5ZLMFP | Quarter-inch steel stores and transfers far more heat than a stone. Slide baguettes or ciabatta straight onto it for a fast, crisp bottom crust. Made in the USA. |
| `saint-germain-couche` | Saint Germain Bakery Couche | B06XXXQVNZ | Heavy French flax linen holds shaped baguettes and ciabatta in place while they proof, and wicks just enough moisture to set the skin for scoring. |
| `usa-pan-9x13` | USA Pan 9x13 Rectangular Pan | B0029JOC6I | Aluminized steel with a corrugated base bakes an even, deeply browned focaccia bottom. The two-inch sides give a high-hydration dough room to rise. |
| `usa-pan-loaf` | USA Pan 9x5 Loaf Pan | B002UNMZOO | Commercial-grade aluminized steel in the standard 9x5 size. Straight walls and a corrugated base produce a tall, evenly browned sandwich or brioche loaf. |

### 3.3 Components

`src/components/EquipmentGrid.astro`
- Props: `productIds: string[]`, `trackingId: string`, `heading?: string`, `intro?: string`, `compact?: boolean`, `disclosure?: boolean` (default `true`).
- Renders each product as a text-only card: name, blurb, and a "View on Amazon →" link with `target="_blank"` and `rel="noopener noreferrer sponsored"`, using the existing `.card` styling from the homepage grid. The `compact` variant renders a tighter list for the calculator column.
- Renders `<AffiliateDisclosure compact={compact} />` beneath the grid when `disclosure` is true. The calculator block passes `disclosure={false}` for its five lists and renders one compact disclosure itself.

`src/components/AffiliateDisclosure.astro`
- Props: `compact?: boolean`, `hasDirect?: boolean` (computed by `EquipmentGrid` as whether any product in its list is `merchant: 'direct'`).
- Full variant: the existing homepage disclosure text, unchanged.
- Compact variant: one line, "As an Amazon Associate, we earn from qualifying purchases."
- When `hasDirect` is true, both variants append: "Some links go to other retailers who also pay us a commission." With all-Amazon lists (every list today) the sentence is omitted so the disclosure stays accurate. This single line satisfies Amazon's required wording and the FTC's disclosure rule for any other program.

### 3.4 Placements

**Homepage `#equipment` section** (`index.astro` 1362 to 1426). Replace the hardcoded six cards and disclosure with `<EquipmentGrid productIds={HOMEPAGE_PRODUCTS} trackingId={TRACKING_IDS.homepage} heading="Essential Bread Equipment" intro="The right tools make all the difference" />`. Output: same six products, same order, same heading and intro, same disclosure. The only visible difference is that the price line is gone.

**Recipe pages** (`RecipeLayout.astro`). Insert after the "What to expect" paragraph and before the "Open in calculator" CTA (around line 168):

```astro
<EquipmentGrid
  productIds={[...GEAR_SETS.universal, ...GEAR_SETS[styleMeta.shapeFamily]]}
  trackingId={TRACKING_IDS.recipe}
  heading="What you'll need for this bake"
/>
```

Four variants across 60 pages (one per `shapeFamily`).

**Calculator results panel** (`index.astro`, right column, below `#recipe-card`). An `<aside id="gear-block" data-style-family={JSON.stringify(CALCULATOR_STYLE_FAMILY)}>` containing:
- Heading "Gear for this bake".
- `<EquipmentGrid compact disclosure={false} productIds={GEAR_SETS.universal} trackingId={TRACKING_IDS.calculator} />`, always visible.
- Four wrappers, one per family: `<div data-gear-family="dutch-oven" class="hidden">` (likewise `steam-stone`, `sheet-pan`, `loaf-pan`), each containing `<EquipmentGrid compact disclosure={false} productIds={GEAR_SETS[family]} trackingId={TRACKING_IDS.calculator} />`. The `dutch-oven` wrapper starts without `hidden`, matching the calculator's initial sourdough selection.
- One `<AffiliateDisclosure compact />`.

Everything is server-rendered; no `innerHTML`.

JavaScript: the calculator script is a processed TypeScript module (it uses `as HTMLInputElement` casts), so `define:vars` is not available to it. Instead, `updateUI()` (line 2243) reads the style-to-family map once from `#gear-block`'s `data-style-family` attribute via `JSON.parse`, computes `family = map[state.style] ?? 'universal'`, and toggles `hidden` on the four `[data-gear-family]` wrappers so only the matching one shows. For `custom`, all four are hidden and the universal list remains. The toggle runs synchronously inside the click handler, within the 500ms input window that CLS excludes, so the varying list heights do not count against CLS.

### 3.5 Tracking IDs

The user creates two IDs in Associates Central (Account Settings, Manage Your Tracking IDs): `tdf-recipe-20` and `tdf-calc-20`, then updates `TRACKING_IDS`. Until then all three placements fall back to `probuild20-20` and nothing breaks. Associates reports break out clicks and orders per tracking ID, which is the only per-placement attribution Amazon offers.

### 3.6 Compliance checklist

- Disclosure present on every page that renders a link (homepage, all 60 recipe pages, calculator block).
- No prices displayed anywhere.
- No product images.
- `rel="sponsored"` on every affiliate link.
- Link text names the merchant, so destinations are never obscured.
- Privacy policy mentions the program (Section 1.4).
- Amazon Associate links never appear in newsletter emails; Amazon prohibits them in email, PDFs, and anything off-site. Gear links in emails point to recipe pages or to direct merchants whose programs allow it. This is a content rule for whoever writes the emails, not a code change.

---

## Verification

Run `npm run build` and `npm run preview`, then:

1. **Cleanup.** Homepage, one article, one recipe page, the recipes index, and one category index render with no "Advertisement" labels, no empty 260px boxes, and no console errors. View source confirms no `googlesyndication`, `doubleclick`, or `googletagservices` references.
2. **Performance.** Lighthouse mobile against the preview build on the same three URLs measured before (homepage, `/recipes/focaccia-75-same-day/`, `/fundamentals/hydration-60-to-90/`). Expect total transfer down by roughly 370KB and a higher performance score. Record the before and after numbers.
3. **CLS.** Chrome performance trace of the calculator interactions before and after the targeted fix; confirm the named elements no longer shift.
4. **Newsletter.** With Kit values set: submit a real address, confirm the success toast, confirm the double opt-in email arrives, confirm the address appears in Kit. With Kit values empty: confirm the section does not render.
5. **Affiliates.** Homepage grid shows the same six products in the same order with no prices. One recipe page per family (sourdough, baguette, focaccia, sandwich) shows universal plus the correct family set. In the calculator, switching through all eight styles swaps the family list correctly and `custom` shows universal only. Every link resolves on Amazon with the `tag` parameter intact and the correct tracking ID for its placement.
6. **Privacy.** Page renders, AdSense section gone, newsletter and Amazon paragraphs present.

Then the project's test-locally-before-pushing rule applies; the user pushes.

## Release and observation

Single release on a feature branch. After it ships, watch Search Console for two weeks before starting the next spec (dedicated calculator pages). Any movement on `bread calculator` or the homepage during that window is attributable to this release alone.

## Inputs required from the user

| Input | Where it goes | Until provided |
|---|---|---|
| Kit form ID and public API key | `src/config/newsletter.ts` | Newsletter section does not render |
| Two tracking IDs (`tdf-recipe-20`, `tdf-calc-20`) | `src/data/equipment.ts` | All placements use `probuild20-20` |
| Cloudflare CWV per-path confirmation | Gate for Section 1.3 step 2 | CLS work waits |

## Risks

- **Kit v3 sunset.** The primary subscribe path uses Kit's deprecated v3 API, with no sunset date announced. Mitigated by the documented fallback to a plain HTML form POST to Kit's embed endpoint, a small handler change.
- **Amazon ASIN rot.** Products go out of stock or get delisted. The data file makes swaps a one-line change. Check the four new ASINs resolve at implementation time.
- **CLS source is not the homepage.** Section 1.3 stops and re-plans rather than guessing.
- **Recipe-page block reads as templated.** Four distinct variants across 60 pages, each with product blurbs specific to the bake, and each block sits below substantial unique recipe content.
