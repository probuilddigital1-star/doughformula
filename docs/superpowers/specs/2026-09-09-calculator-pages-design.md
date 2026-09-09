# Calculator Pages Design (Phase 2)

**Date:** 2026-09-09
**Status:** Draft for review. No implementation until the Search Console observation window for the cleanup-and-affiliates release is declared closed.
**Goal:** Capture the calculator-intent queries the homepage half-ranks for by adding two dedicated single-purpose calculator pages, additively, without changing any ranking signal on the homepage.

## Context

Six months of Search Console data (2026-03-05 to 2026-09-04) show the homepage holding position 5.4 for `bread calculator` while losing a cluster of related tool queries to page two:

| Query cluster | Impressions | Position | Clicks |
|---|---|---|---|
| `bread hydration calculator`, `dough hydration calculator` | 391 + 65 | 12.8, 22.1 | 0 |
| `baker's percentage calculator` (three spellings) | 165 | 14.0 to 34.1 | 5 |
| `salt in bread calculator` | 63 | 7.9 | 0 |

The same data shows what happens when a tool query reaches the top four: `bread dough calculator` converts at 20.4% and `bread recipe calculator` at 25.9%. One URL cannot rank top-three for several distinct calculator intents, and the three baker's-percentage spellings splitting across positions 14 to 34 is a cannibalization signature. Dedicated pages fix both.

The constraint from the previous release carries forward: nothing on the homepage that ranks changes. The homepage is not refactored to share code with the new pages; each page carries its own small formula.

## Decisions to confirm

These are the judgment calls made in drafting. Each is a one-line change if you want it otherwise.

1. **URLs:** `/hydration-calculator/` and `/bakers-percentage-calculator/`, top level, no `/tools/` prefix. Short, exact-match slugs; the site has no existing tools section to nest under.
2. **Salt lives on the baker's percentage page**, as its own section with an anchor (`#salt`), an H2 that names the query ("Salt in bread calculator"), and its own FAQ entry. Salt is a baker's-percentage line, so a third page would be thin.
3. **Internal linking touches the site footer.** The two pages get a "Tools" group in `SiteFooter.astro`, which renders on every page including the homepage. That is the one homepage change in this spec: two footer links. If you would rather keep the homepage byte-identical, the alternative is article-only linking, which is weaker.
4. **The windowpane article edit** from the earlier plan is not in this spec; it is a separate five-line task.
5. **No new dependencies.** Plain Astro pages with a processed TypeScript script each, matching how the homepage calculator is built.

## Pages

### `/hydration-calculator/`

**Targets:** `bread hydration calculator`, `dough hydration calculator`, `bread calculator hydration`, `sourdough hydration calculator`.

**Title:** `Bread Hydration Calculator | The Dough Formula`
**H1:** `Bread Hydration Calculator`
**Meta description:** `Work out water from flour and hydration, hydration from a recipe, or the flour and water split for a target dough weight. Accounts for starter water.`

**Tool (three modes, one form, switched by tabs):**
1. *Water from flour:* flour grams and hydration percent in, water grams out.
2. *Hydration from a recipe:* flour and water grams in (optional starter grams and starter hydration), total hydration percent out, with the starter's flour and water shown separately.
3. *Split a dough weight:* total dough grams and hydration percent in, flour and water grams out.

Inputs use the site's existing `.input` styling. Results update on every input event; no submit button. Rounding: grams to the nearest gram, percent to one decimal.

**Hand-off:** an "Open in the full bread calculator" button builds `/?hydration={h}&weight={w}#calculator` from the current values, using the URL parameters `loadFromURL()` already supports. This is the page's one link to the homepage and it names the homepage as the full tool, which is the hierarchy signal that keeps the two from competing.

**Prose (400 to 600 words, site voice):** what hydration means in one paragraph, why starter water counts, what 65 / 75 / 82 feel like to handle (linking the three recipe hydration tiers), and when to change hydration versus flour. Links to `/fundamentals/hydration-60-to-90/` and to the sourdough and focaccia recipe pages.

**FAQ (rendered, with `FAQPage` JSON-LD):** How do I calculate hydration? Does starter count toward hydration? What hydration should I use for sourdough? Why does my 75% dough feel like 85%? Can I change hydration after mixing?

### `/bakers-percentage-calculator/`

**Targets:** `baker's percentage calculator`, `bakers percentage calculator`, `baker's percentages calculator`, `bakers math calculator`, `bread ratio calculator`, `salt in bread calculator`.

**Title:** `Baker's Percentage Calculator | The Dough Formula`
**H1:** `Baker's Percentage Calculator`
**Meta description:** `Convert any bread recipe to baker's percentages, or turn percentages into gram weights for a chosen flour amount. Includes a salt calculator.`

**Tool (two modes):**
1. *Recipe to percentages:* rows of ingredient name plus grams (flour rows flagged), percentages out with flour summing to 100%.
2. *Percentages to grams:* flour grams plus a percentage per ingredient in, grams out.
Rows can be added and removed; defaults show a four-line sourdough (flour, water, salt, starter).

**Salt section (`#salt`):** H2 `Salt in bread calculator`. Flour grams in, salt grams out at a chosen percent (default 2.0%, range 1.5 to 2.5), with one sentence on what moves at each end of the range. Links to `/ingredients/role-of-salt-in-bread/`.

**Hand-off:** "Open in the full bread calculator" passing `hydration` (computed from the rows) and `weight` (total dough) via the same URL parameters.

**Prose:** why flour is always 100%, how percentages let you scale and compare, one worked example, and where the system bends (preferments, enriched doughs). Links to `/fundamentals/bakers-percentages-explained/` and `/fundamentals/preferments-101/`.

**FAQ:** What is a baker's percentage? Why is flour 100%? How do I convert a recipe? How much salt per 500g of flour? How do I handle a preferment?

## Shared elements

- **Layout:** `Layout.astro` with the site header and footer, `container` widths, `.card` for the tool panel, Fraunces headings. No new fonts or CSS files.
- **Schema:** each page emits `WebApplication` JSON-LD (`applicationCategory: "UtilityApplication"`, `operatingSystem: "Any"`, `offers` free) plus `FAQPage` JSON-LD from its FAQ list, and `BreadcrumbList` (Home → page).
- **Formulas:** `src/lib/hydration.ts` and `src/lib/bakers-percentage.ts`, pure functions with unit tests. They are new modules; nothing is extracted from `index.astro`.
- **Cannibalization safeguards:** neither page uses "bread calculator" as a heading or title term; each links up to the homepage as the full calculator; the homepage links down to them only via the footer Tools group; both pages are self-canonical. Neither page repeats the homepage's "Understanding Baker's Percentages" copy.
- **Writing:** the project's hard bans apply to every sentence (no em dashes, none of the listed phrases, no rule-of-three constructions).

## Internal linking

- `SiteFooter.astro`: a "Tools" group with "Bread Calculator" (`/#calculator`), "Hydration Calculator", "Baker's Percentage Calculator".
- Article cross-links, one sentence each, additive: `hydration-60-to-90` → hydration page; `bakers-percentages-explained` and `role-of-salt-in-bread` → baker's percentage page (salt anchor).
- Recipe pages: no change.
- Sitemap: automatic via `@astrojs/sitemap`.

## Verification

1. Unit tests for both formula modules (including the starter-water case and rounding).
2. Build-output tests: both pages exist, titles and H1s exact, `FAQPage` and `WebApplication` JSON-LD parse, the hand-off links carry the expected parameters, footer links present on the homepage and a recipe page, no "bread calculator" phrase in either page's title or H1.
3. Lighthouse mobile on both pages: performance at or above the homepage's post-cleanup score (67).
4. Search Console URL Inspection on both pages after deploy; request indexing.

## Success criteria and observation

- Within eight weeks of indexing: `bread hydration calculator` and at least one baker's-percentage spelling on page one; CTR at or above 10% for any of the target queries that reaches the top four.
- The homepage's position for `bread calculator` stays within ±1 of its pre-launch 28-day average. If it drops more than that for two consecutive weeks, the footer links are the first suspect and come out.

## Out of scope

The windowpane article addition, any homepage title change, `noindex` or consolidation of recipe pages, and the calculator-in-article embed approach considered and rejected in the September 7 brainstorm.
