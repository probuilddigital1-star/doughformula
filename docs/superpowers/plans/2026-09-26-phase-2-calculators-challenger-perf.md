# Phase 2: Calculator Pages, Challenger, Bundled Fixes, Performance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two calculator pages from the approved spec, add Challenger Breadware as the first direct merchant, land three small fixes, and get homepage PageSpeed mobile to 88+.

**Architecture:** Plain Astro pages with one processed `<script>` each, backed by two pure TypeScript formula modules. Challenger joins `GEAR_SETS['dutch-oven']` as a `direct` product whose URL gets a per-placement `campaign` tag. The homepage's own gear aside filters to Amazon-only so its output does not change. Fonts move from Google Fonts to self-hosted latin-subset woff2 files in `public/fonts/`.

**Tech Stack:** Astro 5, Tailwind 4, Vitest 3 (unit, Astro container, and build-output tests), sharp (already installed via Astro) for images.

**Spec:** `docs/superpowers/specs/2026-09-09-calculator-pages-design.md` (with its 2026-09-09 amendments and the 2026-09-11 footer update).

## Global Constraints

- No em dashes (neither `—` nor `--`) in any copy. None of the banned phrases in the writing-style memory. No rule-of-three phrasing.
- Existing Amazon tracking ids stay exactly: `probuild20-20`, `tdf-recipe-20`, `tdf-calc-20`. Every existing ASIN stays exactly as it is.
- No new npm dependencies (spec decision 5). Font files are static assets, not a package.
- No price for Challenger anywhere on the site. $299 is reference only (docs).
- Challenger link format, exact:
  - recipe: `https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=recipe`
  - calculator: `https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=calculator`
- Every affiliate link: `rel="sponsored nofollow noopener noreferrer"`.
- No email or personal data in any PostHog event. PostHog's deferred loading in `Analytics.astro` is not changed.
- Homepage: the only visible changes are the footer (Tools group, Newsletter link) and the newsletter line. Hero markup changes are performance-only.
- Before every commit: `npm test` (runs unit tests, `astro build`, then build-output tests). All green or no commit.
- Commit in the chunks below. Never push. Never commit: `.claude/settings.local.json`, `Claude outputs/` (holds the signed agreement and W-9), the media-kit zip, the unzipped media-kit folder, or `src/assets/gear/` (see Findings).

## Findings from the pre-plan read (need your eyes)

1. **Gear items do not display images.** `EquipmentGrid.astro` renders name, blurb and a text link only, in both card and compact modes. Per your instruction, no image support gets added for Challenger, and `src/assets/gear/challenger-bread-pan.jpg` stays uncommitted.
2. **No folding proofer ASIN is recorded.** `docs/affiliate-programs.md` mentions the proofer only as a Brød & Taylor direct item, with no ASIN anywhere in the repo. Skipped.
3. **No Impact site-verification value is recorded** anywhere in the repo. Skipped.
4. **The homepage already has most of the hero work.** It ships webp at 480/768/1200/1600w, `sizes="100vw"`, width/height 1600x2400, `fetchpriority="high"` and a matching preload. The 1.8 MB (4000x6000) source never ships. The largest shipped file is 278 KB (1600w) and a typical phone gets the 92 KB 768w file. Task 10 tightens this, but the big remaining costs are likely fonts and the hero text animation. Task 9 measures before changing anything.
5. **Challenger would reach the homepage by default.** The homepage calculator aside renders `GEAR_SETS['dutch-oven']` on load. Adding Challenger to that set would put a Challenger link on the homepage. That breaks the spec's "footer links are the only homepage change" rule. Plan: the homepage aside switches to an Amazon-only view of the sets, so its rendered HTML stays byte-identical. **Decision for you (Q1).**
6. **Layout emits a site-wide `WebApplication` JSON-LD on every page.** Without a change the calculator pages would carry two `WebApplication` blocks. Plan: `Layout.astro` gets an optional `schema` prop that replaces the default block when passed. Every existing page renders exactly as before.
7. `lighthouse-prod.json` in the repo is from January and has null scores, so it can't serve as a baseline. Task 9 takes a fresh one.
8. The spec's status line says "no implementation until the Search Console observation window is declared closed." I'm reading your kickoff as that declaration.

## Questions to settle at approval

- **Q1 (homepage and Challenger):** keep Challenger off the homepage aside (recommended, matches the spec), or let it show there with `campaign=calculator`?
- **Q2 (Challenger blurb):** proposed copy: *"Cast iron made for bread. The dough goes onto a low, flat base, and the deep lid traps steam over a round or oval loaf."* Approve or give me yours.
- **Q3 (Lighthouse tool):** Task 9 runs `npx lighthouse` against `astro preview` (a temporary download, not saved to package.json, uses your installed Chrome). OK?

## File map

| File | Change |
|---|---|
| `docs/affiliate-programs.md` | Challenger section rewritten (live program); commit includes the existing uncommitted ThermoWorks edit |
| `src/data/equipment.ts` | `campaignBase` + `merchantId` fields, Challenger product, `placementForTrackingId` moved here, Amazon-only homepage view |
| `src/config/analytics.ts` | re-export `placementForTrackingId`; `data-merchant` uses `merchantId`; `calculatorHandoff` promoted to `EVENTS` |
| `src/components/Analytics.astro` | delegated listener for `a[data-handoff]` |
| `src/components/SiteFooter.astro` | Tools group; Newsletter link |
| `src/pages/index.astro` | newsletter line; gear aside uses Amazon-only view; hero tweaks (Task 10) |
| `src/layouts/Layout.astro` | optional `schema` prop; self-hosted fonts |
| `src/lib/hydration.ts`, `src/lib/bakers-percentage.ts`, `src/lib/handoff.ts` | new pure modules |
| `src/components/CalculatorGearBlock.astro`, `src/components/NewsletterSection.astro` | new, per spec |
| `src/pages/hydration-calculator.astro`, `src/pages/bakers-percentage-calculator.astro` | new pages |
| `src/content/fundamentals/hydration-60-to-90.md`, `.../bakers-percentages-explained.md`, `src/content/ingredients/role-of-salt-in-bread.md` | one additive cross-link sentence each (spec, Internal linking) |
| `public/fonts/*.woff2`, `src/styles/fonts.css` | self-hosted fonts |
| tests | see each task |

## Approval amendments (2026-09-26)

Answers: Q1 keep Challenger off the homepage. Q2 blurb: "Cast iron with a shallow base you load dough onto instead of dropping it into a hot pot. The tall lid traps steam over a round or oval loaf." Q3 Lighthouse via npx, mobile, 3 runs per measurement, median, for the homepage and one recipe page, before and after. Q4 Tools replaces Built For and the footer stays at four columns. Built For has no links, so nothing moves. Guard baseline: 2.3 (Aug 12 to Sep 8) and 2.2 (Sep 9 to 23), threshold 3.2 for two weekly windows in a row.

**Section E supersedes Task 2's placement design.** Challenger is not added to `GEAR_SETS` at all. It appears only as a featured card, and never in a plain text list:

- `equipment.ts`: `FEATURED_GEAR: Partial<Record<GearFamily, string>> = { 'dutch-oven': 'challenger-bread-pan' }`. `GEAR_SETS` and the homepage stay exactly as they are, so the homepage is Amazon-only with no filtering. `HOMEPAGE_GEAR_SETS` is dropped.
- `Product` gains `imageAlt?: string`. `FeaturedGearCard.astro` maps product id to its imported image (`src/assets/gear/challenger-bread-pan.jpg`) and renders only for `merchant: 'direct'` products that have one. The card shows a "Featured pick" label, the photo (`<Image>`, webp, `widths` at 1x and 2x of the display width, explicit width/height, `loading="lazy"`), the name, the blurb and a "See it at Challenger" button.
- Placements: `Placement` adds `'recipe_step'`. `campaignUrl(p, placement)` builds `campaignBase + '&campaign=' + placement.replace('_', '-')`, so `recipe_step` becomes `campaign=recipe-step`. `affiliateLinkAttributes(p, trackingId, placement?)` takes an optional placement override.
- `EquipmentGrid` gains `directNearby?: boolean`, which adds the "other retailers" line when a featured direct card sits in the same placement.
- Recipe pages (dutch-oven family only): the card goes above the "What you'll need" grid, and that grid's disclosure passes `directNearby`.
- Calculator gear block: the card goes above the compact lists, and the block disclosure's `hasDirect` is true when a featured card renders.
- E2: `ScheduleStep` gains `gearMention?: 'challenger'`, set on the bake step for the dutch-oven family in all three schedules. `RecipeSchedule` appends "A bread pan like the <a>Challenger</a> works here too." The `action` string is unchanged, so Recipe JSON-LD and the method text don't carry the link.

**Revised commit sequence**

1. `docs: record Challenger Breadware program terms` (Task 1)
2. `feat(gear): Challenger featured card on Dutch oven recipe pages` (Task 2 + E1 on recipe pages, image committed)
3. `feat(recipes): Challenger mention in the Dutch oven bake step` (E2)
4. `feat(footer): add Newsletter link; reword newsletter line` (Task 3)
5. `feat(calc): hydration and baker's percentage formula modules` (Task 4)
6. `feat(calc): shared gear block with featured card, newsletter section, hand-off event` (Task 5 + E1 on calculators)
7. `feat(calc): add /hydration-calculator/` (Task 6)
8. `feat(calc): add /bakers-percentage-calculator/ with salt section` (Task 7)
9. `content: cross-link three articles to the calculator pages` (Task 8)
10. `perf: self-host fonts` (Task 9)
11. `perf: tighten hero image delivery` (Task 10)

## Commit sequence (original, superseded above)

1. `docs: record Challenger Breadware program terms` (Task 1)
2. `feat(gear): add Challenger Bread Pan as a direct merchant with campaign-tagged links` (Task 2)
3. `feat(footer): add Newsletter link; reword newsletter line` (Task 3; the Tools links land with the pages they point to, in commits 6 and 7, so no commit ships a 404)
4. `feat(calc): hydration and baker's percentage formula modules` (Task 4)
5. `feat(calc): shared gear block, newsletter section, hand-off event` (Task 5)
6. `feat(calc): add /hydration-calculator/` (Task 6)
7. `feat(calc): add /bakers-percentage-calculator/ with salt section` (Task 7)
8. `content: cross-link three articles to the calculator pages` (Task 8)
9. `perf: self-host fonts` (Task 9)
10. `perf: tighten hero image delivery` (Task 10)

---

### Task 1: Affiliate programs doc

**Files:** Modify `docs/affiliate-programs.md`

- [ ] **Step 1:** Summary table, Challenger row: `| Challenger Breadware | Cast-iron bread pan, high ticket | Own portal (AffiliateWP) | 10% | not stated | not stated | primary (signed agreement) |`
- [ ] **Step 2:** Replace the `### Challenger Breadware` section body with:
  - **Status:** active since 2026-09-25 (agreement signed as ProBuild Digital)
  - **Program page:** https://challengerbreadware.com/affiliate-area/
  - **Runs through:** own AffiliateWP portal
  - **Commission:** 10% per sale
  - **Product:** The Challenger Bread Pan, $299 at signup (reference only; no price on the site)
  - **Link format:** `https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=<placement>`, with campaign tags `recipe` (recipe pages) and `calculator` (calculator gear blocks)
  - **Images:** official media kit images only
  - **Restrictions:** no paid search bidding on the Challenger brand
  - **On the site:** `challenger-bread-pan` in `GEAR_SETS['dutch-oven']` (sourdough, country loaf, no-knead recipe pages; both calculator pages). Kept off the homepage aside.
- [ ] **Step 3:** In Recommendation item 3, replace the ~6% estimate with the confirmed terms: 10% of $299, about $30 per sale. No Amazon comparison, since I can't verify the Lodge price. Update the research-date line to note the Challenger update on 2026-09-26.
- [ ] **Step 4:** Scan the new text for em dashes. `npm test`. Commit together with the plan file:

```bash
git add docs/affiliate-programs.md docs/superpowers/plans/2026-09-26-phase-2-calculators-challenger-perf.md
git commit -m "docs: record Challenger Breadware program terms"
```

### Task 2: Challenger in the data model

**Files:** Modify `src/data/equipment.ts`, `src/config/analytics.ts`, `src/pages/index.astro:1162-1180`. Tests: `tests/unit/equipment.test.ts`, `tests/unit/analytics.test.ts`, `tests/components/equipment.test.ts`, `tests/dist/affiliates.test.ts`

**Interfaces produced:** `Product.campaignBase?: string`, `Product.merchantId?: string`, `placementForTrackingId(id): Placement` (now in equipment.ts, re-exported by analytics.ts), `HOMEPAGE_GEAR_SETS`, `HOMEPAGE_GEAR_IDS`.

- [ ] **Step 1: Failing unit tests** (`tests/unit/equipment.test.ts`):

```ts
import { PRODUCTS, GEAR_SETS, HOMEPAGE_GEAR_SETS, HOMEPAGE_GEAR_IDS, TRACKING_IDS, productUrl, hasDirectMerchant } from '../../src/data/equipment';

const BASE = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital';

describe('Challenger Bread Pan', () => {
  const p = PRODUCTS['challenger-bread-pan'];
  it('is a direct merchant with the challenger merchant id', () => {
    expect(p.merchant).toBe('direct');
    expect(p.merchantId).toBe('challenger');
    expect(p.merchantLabel).toBe('Challenger');
    expect(p.asin).toBeUndefined();
  });
  it('tags the recipe placement', () => {
    expect(productUrl(p, TRACKING_IDS.recipe)).toBe(`${BASE}&campaign=recipe`);
  });
  it('tags the calculator placement', () => {
    expect(productUrl(p, TRACKING_IDS.calculator)).toBe(`${BASE}&campaign=calculator`);
  });
  it('sits alongside the Lodge in the dutch-oven set', () => {
    expect(GEAR_SETS['dutch-oven']).toEqual(['lodge-combo-cooker', 'challenger-bread-pan', 'banneton-set', 'ufo-lame']);
  });
  it('carries no price in its copy', () => {
    expect(`${p.name} ${p.blurb}`).not.toMatch(/\$\d/);
  });
});

describe('homepage gear view', () => {
  it('is Amazon only and otherwise identical to GEAR_SETS', () => {
    expect(HOMEPAGE_GEAR_SETS['dutch-oven']).toEqual(['lodge-combo-cooker', 'banneton-set', 'ufo-lame']);
    expect(HOMEPAGE_GEAR_SETS['steam-stone']).toEqual(GEAR_SETS['steam-stone']);
    expect(hasDirectMerchant(HOMEPAGE_GEAR_IDS)).toBe(false);
  });
});
```

Also assert every existing ASIN and all three `TRACKING_IDS` values literally (guards the "keep exactly" rule). In `tests/unit/analytics.test.ts`: `affiliateLinkAttributes(PRODUCTS['challenger-bread-pan'], TRACKING_IDS.recipe)` gives `data-merchant: 'challenger'`, `data-placement: 'recipe'`; Amazon products still give `data-merchant: 'amazon'`.

- [ ] **Step 2:** `npx vitest run tests/unit` fails on the missing product and exports.
- [ ] **Step 3: Implement** in `equipment.ts`:

```ts
export interface Product {
  // ...existing fields...
  /** Direct merchants with per-placement tracking: the affiliate URL without its campaign
   *  parameter. productUrl appends &campaign=<placement>. */
  campaignBase?: string;
  /** Direct merchants: short id reported as `merchant` on affiliate_click, e.g. 'challenger'. */
  merchantId?: string;
}

'challenger-bread-pan': {
  id: 'challenger-bread-pan',
  name: 'Challenger Bread Pan',
  blurb: '<Q2 copy>',
  merchant: 'direct',
  merchantId: 'challenger',
  merchantLabel: 'Challenger',
  campaignBase: 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital',
},

'dutch-oven': ['lodge-combo-cooker', 'challenger-bread-pan', 'banneton-set', 'ufo-lame'],

export type Placement = 'homepage' | 'recipe' | 'calculator' | 'unknown';
export function placementForTrackingId(trackingId: string): Placement { /* moved verbatim */ }

export function productUrl(p: Product, trackingId: string): string {
  if (p.merchant === 'amazon') return `https://www.amazon.com/dp/${p.asin}?tag=${trackingId}`;
  if (p.campaignBase) return `${p.campaignBase}&campaign=${placementForTrackingId(trackingId)}`;
  return p.href!;
}

/** The homepage aside shows Amazon only, so adding a direct merchant to a gear set never
 *  changes the homepage (spec: the footer is the one homepage change). */
export const HOMEPAGE_GEAR_SETS = Object.fromEntries(
  Object.entries(GEAR_SETS).map(([k, ids]) => [k, ids.filter((id) => PRODUCTS[id].merchant === 'amazon')]),
) as Record<GearFamily, string[]>;
export const HOMEPAGE_GEAR_IDS: string[] = [...new Set(Object.values(HOMEPAGE_GEAR_SETS).flat())];
```

Update the file's header comment ("All ten products are Amazon today") to be accurate. In `analytics.ts`: drop the local `Placement`/`placementForTrackingId`, `export { placementForTrackingId, type Placement } from '../data/equipment'`, and set `'data-merchant': p.merchant === 'amazon' ? 'amazon' : (p.merchantId ?? 'direct')`. In `index.astro` gear aside: `GEAR_SETS[...]` becomes `HOMEPAGE_GEAR_SETS[...]` and `hasDirectMerchant(ALL_GEAR_PRODUCT_IDS)` becomes `hasDirectMerchant(HOMEPAGE_GEAR_IDS)`.

- [ ] **Step 4: Component test** (`tests/components/equipment.test.ts`): rendering `EquipmentGrid` with `['lodge-combo-cooker','challenger-bread-pan']` and `TRACKING_IDS.recipe` gives the `campaign=recipe` href, `rel="sponsored nofollow noopener noreferrer"`, `data-merchant="challenger"`, "View on Challenger", and the disclosure contains "Some links go to other retailers who also pay me a commission."
- [ ] **Step 5: Build-output tests** (`tests/dist/affiliates.test.ts`), new describe `Challenger on recipe pages`:
  - for one built page each of sourdough, country-loaf and no-knead (find via `allDistHtml()` filtered on `/recipes/` path and the style slug): contains the exact recipe URL (HTML-escaped `&amp;campaign=recipe`), `rel` contains `sponsored` and `nofollow`, `data-placement="recipe"`, `data-merchant="challenger"`, and the "other retailers" sentence. The Lodge Amazon link is still present on the same page.
  - a baguette, focaccia and sandwich recipe page contain no `challengerbreadware.com` and no "other retailers" sentence.
  - `index.html` contains no `challengerbreadware.com` and no "other retailers" sentence.
  - No built page contains `challengerbreadware.com` without `ref=probuilddigital&amp;campaign=` (sweep over `allDistHtml()`).
- [ ] **Step 6:** `npm test`, all green. Commit:

```bash
git add src/data/equipment.ts src/config/analytics.ts src/pages/index.astro tests/unit tests/components tests/dist/affiliates.test.ts
git commit -m "feat(gear): add Challenger Bread Pan as a direct merchant with campaign-tagged links"
```

### Task 3: Footer and newsletter line

**Files:** Modify `src/components/SiteFooter.astro`, `src/pages/index.astro:1192`. Test: `tests/dist/homepage-footer.test.ts`

- [ ] **Step 1: Failing tests.** For `index.html` and one recipe page, slice from `<footer` to `</footer>` and assert:
  - a `Tools` heading; `href="/#calculator"` with text "Bread Calculator"; `href="/hydration-calculator/"` "Hydration Calculator"; `href="/bakers-percentage-calculator/"` "Baker&#39;s Percentage Calculator" (match Astro's escaping as built)
  - `href="https://thedoughformula.kit.com"` with text "Newsletter"
  - homepage (when `NEWSLETTER_ENABLED`): contains "An occasional email when a new recipe or tool goes up. Unsubscribe anytime." and not "weekly tips".
- [ ] **Step 2: Implement.** The grid is `md:grid-cols-4` with brand, Guides, Company, Built For. Replace the "Built For" column (its one sentence restates the brand blurb) with the Tools group, keeping four columns and the layout unchanged:

```astro
<div>
  <h3 class="text-xs uppercase tracking-[0.2em] font-medium mb-4 text-[var(--accent-gold)]">Tools</h3>
  <ul class="space-y-2 text-sm">
    <li><a href="/#calculator" class="hover:text-[var(--accent-gold)]">Bread Calculator</a></li>
    <li><a href="/hydration-calculator/" class="hover:text-[var(--accent-gold)]">Hydration Calculator</a></li>
    <li><a href="/bakers-percentage-calculator/" class="hover:text-[var(--accent-gold)]">Baker's Percentage Calculator</a></li>
  </ul>
</div>
```

Add `<li><a href="https://thedoughformula.kit.com" class="hover:text-[var(--accent-gold)]">Newsletter</a></li>` to Company, after Contact. Same-tab link, no `rel` beyond default (first-party newsletter host). If you'd rather keep "Built For", say so and Tools becomes a fifth column instead.

Replace the homepage line with `An occasional email when a new recipe or tool goes up. Unsubscribe anytime.`

- [ ] **Step 3:** This commit contains only the Newsletter link, the new line and their tests. The Tools group markup above goes in with Task 6 (first two links) and Task 7 (third link), each with its own test.
- [ ] **Step 4:** `npm test`. Commit `feat(footer): add Newsletter link; reword newsletter line`.

### Task 4: Formula modules

**Files:** Create `src/lib/hydration.ts`, `src/lib/bakers-percentage.ts`, `src/lib/handoff.ts`. Tests: `tests/unit/hydration.test.ts`, `tests/unit/bakers-percentage.test.ts`, `tests/unit/handoff.test.ts`. `vitest run tests/unit` already collects them.

**Interfaces produced:**

```ts
// hydration.ts: grams round to whole grams, percents to one decimal (spec)
export function roundG(n: number): number;            // Math.round
export function roundPct(n: number): number;          // Math.round(n * 10) / 10
export function waterFromFlour(flourG: number, hydrationPct: number): number;
export interface RecipeHydration { hydration: number; starterFlour: number; starterWater: number; totalFlour: number; totalWater: number; }
export function hydrationFromRecipe(i: { flour: number; water: number; starter?: number; starterHydration?: number }): RecipeHydration;
export function splitDough(totalG: number, hydrationPct: number): { flour: number; water: number };

// bakers-percentage.ts
export type RowKind = 'flour' | 'water' | 'starter' | 'other';
export interface Row { name: string; kind: RowKind; grams: number; }
export function toPercentages(rows: Row[]): { name: string; kind: RowKind; pct: number }[];  // flour rows sum to 100
export function toGrams(flourG: number, rows: { name: string; kind: RowKind; pct: number }[]): Row[];
export function rowsHydration(rows: Row[], starterHydration?: number): number;  // starter split per hydrationFromRecipe, default 100%
export function saltGrams(flourG: number, pct: number): number;  // pct clamped to 1.5..2.5
export const DEFAULT_ROWS: Row[];  // Bread flour 500 / Water 350 / Salt 10 / Starter 100

// handoff.ts: builds the homepage URL loadFromURL() already reads
export function handoffHref(h: { hydration: number; weight: number }): string;
// '/?hydration=75&weight=900#calculator'; hydration clamped to 50..95 (loadFromURL ignores values outside),
// weight rounded to an integer; non-finite input falls back to the homepage defaults 75 and 900.
```

- [ ] **Step 1: Failing tests.** Cases (write them all out as `it` blocks):
  - `waterFromFlour(500, 75)` → 375; `waterFromFlour(333, 68)` → 226 (226.44).
  - starter case: `hydrationFromRecipe({ flour: 450, water: 300, starter: 100, starterHydration: 100 })` → starterFlour 50, starterWater 50, totalFlour 500, totalWater 350, hydration 70.
  - starter at 50% hydration: `{ flour: 450, water: 300, starter: 90, starterHydration: 50 }` → starterFlour 60, starterWater 30, hydration 64.8 (330/510 = 64.705… rounds to 64.7: assert 64.7).
  - no starter: `{ flour: 500, water: 350 }` → 70.
  - zero flour → hydration 0, no NaN.
  - `splitDough(900, 75)` → flour 514, water 386 (sum stays 900: water is `total - flour`, not rounded separately).
  - `toPercentages(DEFAULT_ROWS)` → 100, 70, 2, 20; two flour rows 400 + 100 → 80 and 20, summing to 100.
  - `toGrams(500, [{flour 100},{water 72},{salt 2}])` → 500, 360, 10.
  - `rowsHydration(DEFAULT_ROWS)` → 72.7 (400/550).
  - `saltGrams(500, 2)` → 10; `saltGrams(500, 1.5)` → 8 (7.5 rounds up); pct 3 clamps to 2.5 → 13.
  - `handoffHref({ hydration: 72.7, weight: 960 })` → `/?hydration=72.7&weight=960#calculator`; hydration 40 → 50; NaN → defaults.
- [ ] **Step 2:** run, fail. **Step 3:** implement the minimal functions above. **Step 4:** run, pass. `npm test`. Commit.

### Task 5: Shared components and the hand-off event

**Files:** Create `src/components/CalculatorGearBlock.astro`, `src/components/NewsletterSection.astro`. Modify `src/config/analytics.ts`, `src/components/Analytics.astro`, `src/layouts/Layout.astro`. Tests: `tests/components/calculator-blocks.test.ts`, `tests/unit/analytics.test.ts`, `tests/dist/analytics.test.ts`

- [ ] **Step 1: Failing tests.**
  - Unit: `EVENTS.calculatorHandoff === 'calculator_handoff'`; `RESERVED_EVENTS` is gone (the existing "reserved" test is rewritten, not deleted silently: it becomes "the hand-off event is live").
  - Component: `CalculatorGearBlock` renders `id="gear-block"`, "Gear for this bake", the three universal names, the Lodge, the Challenger with `campaign=calculator`, every `<a` carries `tdf-calc-20` or `campaign=calculator`, exactly one "As an Amazon Associate I earn from qualifying purchases.", and the "other retailers" line. `family="steam-stone"` renders no Challenger.
  - Component: `NewsletterSection` renders `id="newsletter-form"`, `data-kit-form-id`, `data-kit-api-key`, `name="email"`, and the new line (when `NEWSLETTER_ENABLED`).
  - Dist (`analytics.test.ts`): the Analytics script contains `calculator_handoff`, `a[data-handoff]`, `from_page`, `to_page`, `tab`, and does not reference `email` inside the hand-off branch (slice between `data-handoff` and the next `return;`).
- [ ] **Step 2: Implement.**

`analytics.ts`: move `calculatorHandoff: 'calculator_handoff'` into `EVENTS`; delete `RESERVED_EVENTS` and its comment.

`Analytics.astro`, inside the delegated click listener, after the affiliate branch:

```js
var handoff = el.closest('a[data-handoff]');
if (handoff) {
  var h = handoff.dataset;
  capture(events.calculatorHandoff, { from_page: h.fromPage, to_page: h.toPage, tab: h.tab });
  return;
}
```

Hand-off anchors carry `data-handoff data-from-page="hydration-calculator" data-to-page="homepage-calculator" data-tab="<active mode>"`. Each page's script rewrites `href` and `data-tab` on every input and tab change. The event holds only those three fixed strings plus the existing `path`. The listener runs in capture phase and never calls `preventDefault`, so navigation is unaffected.

`CalculatorGearBlock.astro` per spec Shared elements:

```astro
---
import EquipmentGrid from './EquipmentGrid.astro';
import AffiliateDisclosure from './AffiliateDisclosure.astro';
import { GEAR_SETS, TRACKING_IDS, hasDirectMerchant, type GearFamily } from '../data/equipment';
interface Props { family?: GearFamily }
const { family = 'dutch-oven' } = Astro.props;
const shown = [...GEAR_SETS.universal, ...GEAR_SETS[family]];
---
<aside id="gear-block" class="mt-6">
  <h2 class="font-medium text-lg mb-3">Gear for this bake</h2>
  <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS.universal} trackingId={TRACKING_IDS.calculator} />
  <div class="mt-2">
    <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS[family]} trackingId={TRACKING_IDS.calculator} />
  </div>
  <AffiliateDisclosure compact hasDirect={hasDirectMerchant(shown)} />
</aside>
```

(Deviation from spec, flagged: `hasDirect` is computed from the products actually shown rather than `ALL_GEAR_PRODUCT_IDS`, so the line is accurate for any family. The heading is `h2` rather than the homepage's `h4` to keep heading order valid on a page whose last heading is the H1.)

`NewsletterSection.astro`: the homepage section markup verbatim with the new line, wrapped in `{NEWSLETTER_ENABLED && (...)}`, plus the homepage's Kit submit handler moved into a component `<script>` that dispatches `df:newsletter-submitted`. It uses a small inline toast rather than the homepage's `showToast` (that function lives in the homepage script). The homepage keeps its own inline copy per the spec.

`Layout.astro`: add `schema?: object[]`. When passed, render one `<script type="application/ld+json">` per object instead of the default `jsonLd`. When absent, output is unchanged. A dist test asserts `index.html` still contains exactly one `"@type":"WebApplication"` with `"name":"The Dough Formula"`.

- [ ] **Step 3:** `npm test`. Commit `feat(calc): shared gear block, newsletter section, hand-off event`.

### Task 6: `/hydration-calculator/`

**Files:** Create `src/pages/hydration-calculator.astro`. Modify `SiteFooter.astro` (Tools group with Bread Calculator and Hydration Calculator links), `tests/dist/compliance.test.ts` (61 → 62). Create `tests/dist/calculator-pages.test.ts`.

- [ ] **Step 1: Failing dist tests** (`calculator-pages.test.ts`, describe per page, a `page()` helper reading `hydration-calculator/index.html`):
  - `<title>Bread Hydration Calculator | The Dough Formula</title>`; one `<h1>` with text `Bread Hydration Calculator`; meta description exact from spec.
  - canonical `https://thedoughformula.com/hydration-calculator/`.
  - title and H1 do not contain "bread calculator" (case-insensitive; "Bread Hydration Calculator" passes because the phrase is not contiguous).
  - Parse every `application/ld+json` block with `JSON.parse`. Exactly one each of `WebApplication` (`applicationCategory: "UtilityApplication"`, `operatingSystem: "Any"`, `offers.price: "0"`, `url` equal to the canonical), `FAQPage` (5 `Question`s whose names equal the spec's five questions and match the rendered FAQ headings), `BreadcrumbList` (2 items: Home `https://thedoughformula.com/`, then the page).
  - Tabs: three, "Water from flour" has `aria-selected="true"` on load, others `false`.
  - Hand-off anchor: `data-handoff`, `data-from-page="hydration-calculator"`, `data-to-page="homepage-calculator"`, `data-tab="water-from-flour"`, server-rendered `href` equals `handoffHref()` of the default inputs (500 g flour, 75%: `/?hydration=75&weight=875#calculator`).
  - Order: tool panel `id="tool"` < `id="gear-block"` < `id="newsletter"` (when enabled) < `id="guide"` (prose) < `id="faq"`.
  - Gear block checks from spec Verification 3 plus Challenger `campaign=calculator`, `data-placement="calculator"`, and the "other retailers" line inside the block.
  - Footer on homepage and one recipe page: Tools heading, `/#calculator`, `/hydration-calculator/`.
  - Links to `/fundamentals/hydration-60-to-90/`, a sourdough recipe page and a focaccia recipe page, and each target exists in dist.
  - The page does not contain "Understanding Baker&#39;s Percentages".
- [ ] **Step 2: Build the page.** Structure: `Layout` with `title`, `description`, `schema`; `<main id="main-content" class="container ...">`; H1 plus one-sentence intro; `<section id="tool" class="card">` with a `role="tablist"` of three `<button role="tab" data-mode="...">` (class `calc-mode-tab`, not `advanced-tab`, so the homepage's `calculator_tab` event doesn't fire here) and three `role="tabpanel"` panels using `.input` fields with `<label>`s and `inputmode="decimal"`. Results in an `aria-live="polite"` region. Mode 2 shows starter flour and starter water separately. Hand-off button (`btn btn-primary`) "Open in the full bread calculator". Then `<CalculatorGearBlock />`, `<NewsletterSection />`, `<section id="guide">` prose, `<section id="faq">` with `<h3>` questions. The page `<script>` imports from `src/lib/hydration.ts` and `src/lib/handoff.ts`, recomputes on every `input` event, and updates the hand-off `href` and `data-tab`. Server render shows the default results, so the page reads correctly before JS.
  - Copy: 400 to 600 words of prose per the spec's outline and the five FAQ answers, written to the Global Constraints. I'll read it back against the ban list before committing and include it in the final summary for your review.
- [ ] **Step 3:** Add the Tools group to the footer with only the links that resolve (Bread Calculator, Hydration Calculator).
- [ ] **Step 4:** `npm test`. Check at 375px in `astro preview` that nothing overflows horizontally. If something does, find the exact element first (memory: debug before fix). Commit `feat(calc): add /hydration-calculator/`.

### Task 7: `/bakers-percentage-calculator/`

**Files:** Create `src/pages/bakers-percentage-calculator.astro`. Modify `SiteFooter.astro` (third Tools link), `compliance.test.ts` (62 → 63), `calculator-pages.test.ts`.

- [ ] **Step 1: Failing dist tests,** mirroring Task 6 with the spec's title, H1, meta description and five FAQ questions, plus:
  - `id="salt"` on a section whose H2 text is `Salt in bread calculator`; salt input default `2.0`, `min="1.5"` `max="2.5"` `step="0.1"`; link to `/ingredients/role-of-salt-in-bread/`.
  - Default rows render Bread flour 500, Water 350, Salt 10, Starter 100, with percentages 100 / 70 / 2 / 20 in the server-rendered output.
  - Hand-off: `data-from-page="bakers-percentage-calculator"`, `data-tab="recipe-to-percentages"`, href `/?hydration=72.7&weight=960#calculator`.
  - Links to `/fundamentals/bakers-percentages-explained/` and `/fundamentals/preferments-101/`, both existing in dist.
  - Footer has the third Tools link on the homepage and a recipe page.
- [ ] **Step 2: Build the page.** Two mode tabs (Recipe to percentages, Percentages to grams). Rows are a `<template>`-cloned list with name, kind `<select>` (Flour, Water, Starter, Other), grams or percent, and a remove button. "Add ingredient" button. The flour-total line shows 100%. Salt section as specced, with one sentence per end of the range. Then gear block, newsletter, prose (why flour is 100%, scaling and comparing, one worked example, where the system bends), FAQ.
- [ ] **Step 3:** `npm test`, 375px check, commit `feat(calc): add /bakers-percentage-calculator/ with salt section`.

### Task 8: Article cross-links

**Files:** the three articles named in the spec. Test: add to `calculator-pages.test.ts`.

- [ ] One additive sentence each, no other text touched: `hydration-60-to-90` links `/hydration-calculator/`; `bakers-percentages-explained` links `/bakers-percentage-calculator/`; `role-of-salt-in-bread` links `/bakers-percentage-calculator/#salt`. Test that each built article contains its link. `git diff` must show only added lines in those files. `npm test`, commit.

### Task 9: Self-hosted fonts (measure first)

**Files:** Create `public/fonts/*.woff2`, `src/styles/fonts.css`. Modify `src/layouts/Layout.astro`, `src/styles/global.css` (import), `tests/dist/fonts.test.ts`.

- [ ] **Step 1: Baseline.** `npm run build && npx astro preview`, then `npx lighthouse http://localhost:4321/ --preset=perf --form-factor=mobile --output=json --output-path=<scratchpad>/lh-before.json` three times; record the median score, LCP, the LCP element and render-blocking items. The JSON stays in the scratchpad, not the repo.
- [ ] **Step 2: Get the files.** Request the exact current css2 URL from `Layout.astro` with a modern Chrome user agent. Keep only the `/* latin */` `@font-face` blocks. Download each referenced woff2 into `public/fonts/` with readable names (`fraunces-latin-normal.woff2`, `fraunces-latin-italic.woff2`, `dm-sans-latin-normal.woff2`, `dm-sans-latin-italic.woff2`, `cormorant-garamond-latin-{400,500,600,400italic,500italic}.woff2` or the variable equivalents Google returns). The Google files are already latin-subset. All three families are SIL OFL, which allows self-hosting. Grep `src/` for characters outside the latin range; if any render in these fonts, add `latin-ext` for that family only.
- [ ] **Step 3:** `src/styles/fonts.css` holds the `@font-face` blocks with `font-display: swap`, the same `unicode-range` and weight ranges, and `url('/fonts/...')`. Import it at the top of `global.css`. Add metric-matched fallbacks (`size-adjust`, `ascent-override`) for Fraunces and DM Sans over Georgia and Arial, so the swap doesn't shift layout.
- [ ] **Step 4:** `Layout.astro`: remove both `preconnect`s, the `preload as=style`, the print-media stylesheet and the `<noscript>`. Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for above-the-fold faces only. On the homepage those are Fraunces normal (nav wordmark, hero line 1), Fraunces italic (hero line 2) and DM Sans normal (hero kicker). Confirm against the baseline trace. If Fraunces normal and italic are separate ~100 KB variable files, preload only the hero's LCP face and report the trade-off.
- [ ] **Step 5: Rewrite `fonts.test.ts`:** no built page references `fonts.googleapis.com` or `fonts.gstatic.com`; the built CSS has `@font-face` for all three families, each with `font-display:swap`; every `/fonts/*.woff2` referenced by CSS or a preload exists in `dist/fonts/`; `index.html` has exactly the chosen preloads, all `crossorigin`; the Fraunces italic and Cormorant italic faces still exist (the reason the old test pinned the full request).
- [ ] **Step 6:** Re-run Lighthouse ×3. Record before and after in the commit message body. `npm test`, commit `perf: self-host fonts`.

### Task 10: Hero image

**Files:** Modify `src/pages/index.astro:10-18, 211-240`. Test: new `tests/dist/hero.test.ts`.

- [ ] **Step 1: Failing tests:** exactly one `<img` on the homepage has `fetchpriority="high"` and it is the hero; that image has `width` and `height` attributes, a `srcset` with at least 5 widths, and `sizes="100vw"`; every hero variant file in `dist/_astro` is ≤ 200 KB and the 768w file (or nearest) is ≤ 70 KB; no `hero-bread*.jpg` ships in dist; the preload `imagesrcset` equals the `<img>` `srcset`.
- [ ] **Step 2: Implement:** widths `[400, 640, 828, 1080, 1600]` (covering 360 to 414 px phones at 2 to 3x density, since the image fills the viewport width and height), `quality={60}`, keep webp, keep `width={1600} height={2400}`, keep `loading="eager"` and `fetchpriority="high"`, change `decoding="sync"` to `decoding="async"`. Check whether any other homepage `<img>` or preload claims `fetchpriority`; there should be none. Rebuild and eyeball the 1600w file at q60 for visible banding in the crust shadows. If it bands, 1600w stays at 70 and only the smaller widths drop.
- [ ] **Step 3:** Lighthouse ×3 again. **If the median is still under 88 and the LCP element is the hero `<h1>`,** the `animate-rise` opacity animation on it delays LCP until it runs. Changing that is a visible design change outside this brief, so I stop and bring you the numbers with a proposal rather than changing it.
- [ ] **Step 4:** `npm test`, commit `perf: tighten hero image delivery` with before/after numbers.

## Rollback guard (spec, Success criteria)

Baseline for the exact query `bread calculator`: homepage position **2.2**. After deploy, check Search Console weekly (Performance, query filter exact `bread calculator`, page `https://thedoughformula.com/`, 7-day windows). **If the position is worse than 3.2 for two consecutive weekly windows,** the footer Tools links are the first suspect and come out first: revert the Tools group in `SiteFooter.astro` only. The calculator pages, the hand-off buttons and the article cross-links stay. Re-measure for two more weeks before touching anything else.

## Verification before the final report

- `npm test` green on the final commit; `git status` shows only the files listed as never-commit.
- `astro preview`: both pages at 375px and 1280px, all tabs, the hand-off lands on the homepage calculator with the values applied, the newsletter form renders, and the Challenger link opens the product page with both params.
- Lighthouse medians before and after for the homepage and both calculator pages (spec floor for the calculator pages: 67; target for the homepage: 88).
- Plain-language summary: what changed, what was skipped and why (image, proofer, Impact tag, anything from Task 10 Step 3), and your to-dos (push; Search Console URL Inspection and request indexing on both pages; confirm AffiliateWP registers a test click with each campaign tag; PageSpeed on production after deploy; the weekly rollback check).
