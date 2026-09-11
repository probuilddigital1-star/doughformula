# Calculator Pages Design (Phase 2)

**Date:** 2026-09-09
**Status:** Approved with amendments 2026-09-09. Spec only; no implementation until the Search Console observation window for the cleanup-and-affiliates release is declared closed.
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

## Decisions (approved 2026-09-09)

Items 1 to 5 were the drafting judgment calls, approved as written. Items 6 to 8 are the approval amendments.

1. **URLs:** `/hydration-calculator/` and `/bakers-percentage-calculator/`, top level, no `/tools/` prefix. Short, exact-match slugs; the site has no existing tools section to nest under.
2. **Salt lives on the baker's percentage page**, as its own section with an anchor (`#salt`), an H2 that names the query ("Salt in bread calculator"), and its own FAQ entry. Salt is a baker's-percentage line, so a third page would be thin.
3. **Internal linking touches the site footer.** The two pages get a "Tools" group in `SiteFooter.astro`, which renders on every page including the homepage. That is the one homepage change in this spec: two footer links.
4. **The windowpane article edit** from the earlier plan is not in this spec; see Out of scope for the task.
5. **No new dependencies.** Plain Astro pages with a processed TypeScript script each, matching how the homepage calculator is built.
6. **Affiliate placement on both pages.** The calculator gear block, built from the same `EquipmentGrid` and `AffiliateDisclosure` components and using `TRACKING_IDS.calculator` exactly as the homepage does, sits directly below the tool panel and above the prose, with its disclosure. A build-output test covers it (see Verification).
7. **Hydration page default tab.** "Water from flour" is the selected tab on load.
8. **Newsletter on both pages.** The newsletter section renders in the same position it holds on the homepage (after the tool section, before the explanatory content), gated by `NEWSLETTER_ENABLED` like everywhere else.

## Pages

### `/hydration-calculator/`

**Targets:** `bread hydration calculator`, `dough hydration calculator`, `bread calculator hydration`, `sourdough hydration calculator`.

**Title:** `Bread Hydration Calculator | The Dough Formula`
**H1:** `Bread Hydration Calculator`
**Meta description:** `Work out water from flour and hydration, hydration from a recipe, or the flour and water split for a target dough weight. Accounts for starter water.`

**Tool (three modes, one form, switched by tabs; "Water from flour" is the default tab on load):**
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
- **Page structure, top to bottom:** site header; H1 and a one-sentence intro; tool panel (`.card`); gear block; newsletter section (only when `NEWSLETTER_ENABLED`); prose; FAQ; site footer. This mirrors the homepage, where the newsletter follows the calculator section and precedes the explanatory content.
- **Gear block:** new `src/components/CalculatorGearBlock.astro` reproducing the homepage aside's markup: `<aside id="gear-block">`, heading "Gear for this bake", the universal compact `EquipmentGrid`, one family compact `EquipmentGrid` (prop `family: GearFamily`, default `'dutch-oven'`, the homepage's initial state; these pages have no style selector, so there is no toggle script and no hidden wrappers), and one `<AffiliateDisclosure compact hasDirect={hasDirectMerchant(ALL_GEAR_PRODUCT_IDS)} />`. Every grid passes `disclosure={false}` and `trackingId={TRACKING_IDS.calculator}`. The homepage keeps its inline aside unchanged; adopting the component there is a separate like-for-like task, not part of this spec.
- **Newsletter section:** new `src/components/NewsletterSection.astro` reproducing the homepage section exactly (same heading and copy, `id="newsletter-form"`, `data-kit-form-id` and `data-kit-api-key` attributes from `src/config/newsletter.ts`, `name="email"` on the input) wrapped in `{NEWSLETTER_ENABLED && (...)}`, with the Kit submit handler in the component's own `<script>` so it runs on any page that includes it. The homepage keeps its inline section and handler unchanged in this spec; consolidating the two copies onto the component is a later like-for-like task.
- **Schema:** each page emits `WebApplication` JSON-LD (`applicationCategory: "UtilityApplication"`, `operatingSystem: "Any"`, `offers` free) plus `FAQPage` JSON-LD from its FAQ list, and `BreadcrumbList` (Home → page).
- **Formulas:** `src/lib/hydration.ts` and `src/lib/bakers-percentage.ts`, pure functions with unit tests. They are new modules; nothing is extracted from `index.astro`.
- **Cannibalization safeguards:** neither page uses "bread calculator" as a heading or title term; each links up to the homepage as the full calculator; the homepage links down to them only via the footer Tools group; both pages are self-canonical. Neither page repeats the homepage's "Understanding Baker's Percentages" copy.
- **Writing:** the project's hard bans apply to every sentence (no em dashes, none of the listed phrases, no rule-of-three constructions).

## Internal linking

- `SiteFooter.astro`: a "Tools" group with "Bread Calculator" (`/#calculator`), "Hydration Calculator", "Baker's Percentage Calculator".
- **Homepage footer caveat (noted 2026-09-11, no implementation yet).** The homepage does not rely on `SiteFooter.astro` for its footer: `index.astro` carries its own inline footer inside `<main>` (link groups, Stay Updated, copyright). `Layout.astro` still renders `SiteFooter.astro` after the slot on every page, so the built homepage currently shows both, the inline footer first and the shared one beneath it. A "Tools" group added only to `SiteFooter.astro` therefore lands in the homepage's second, lower footer, not in its primary link groups. Before the Tools group ships, either add it to both footers, or switch the homepage to `SiteFooter.astro` alone by removing the inline footer as a separate like-for-like task (same links, same copy, same newsletter call to action).
- Article cross-links, one sentence each, additive: `hydration-60-to-90` → hydration page; `bakers-percentages-explained` and `role-of-salt-in-bread` → baker's percentage page (salt anchor).
- Recipe pages: no change.
- Sitemap: automatic via `@astrojs/sitemap`.

## Verification

1. Unit tests for both formula modules (including the starter-water case and rounding).
2. Build-output tests: both pages exist, titles and H1s exact, `FAQPage` and `WebApplication` JSON-LD parse, the hand-off links carry the expected parameters, footer links present on the homepage and a recipe page, no "bread calculator" phrase in either page's title or H1.
3. Build-output tests for the gear block on both pages: `id="gear-block"` and "Gear for this bake" present; the three universal product names present; every link in the block carries `?tag=${TRACKING_IDS.calculator}` and a `rel` containing both `sponsored` and `nofollow`; exactly one "As an Amazon Associate I earn from qualifying purchases." inside the block; the block sits after the tool panel and before the prose in document order. The existing site-wide compliance test (`tests/dist/compliance.test.ts`) picks both pages up automatically; its minimum page count rises from 61 to 63.
4. Build-output tests for the newsletter section on both pages, branching on `NEWSLETTER_ENABLED` the way `tests/dist/newsletter.test.ts` does for the homepage: present with its data attributes when configured, absent otherwise, and positioned after the gear block and before the prose.
3. Lighthouse mobile on both pages: performance at or above the homepage's post-cleanup score (67).
4. Search Console URL Inspection on both pages after deploy; request indexing.

## Success criteria and observation

- Within eight weeks of indexing: `bread hydration calculator` and at least one baker's-percentage spelling on page one; CTR at or above 10% for any of the target queries that reaches the top four.
- The homepage's position for `bread calculator` stays within ±1 of its pre-launch 28-day average. If it drops more than that for two consecutive weeks, the footer links are the first suspect and come out.

## Out of scope

Any homepage title change, `noindex` or consolidation of recipe pages, and the calculator-in-article embed approach considered and rejected in the September 7 brainstorm.

**Windowpane article edit: a separate five-line task.** It did not ship in the cleanup-and-affiliates release; `src/content/techniques/windowpane-test.md` is unchanged since `9d774ea` and has no `faq` frontmatter. Target query: `windowpane test definition`, 110 impressions at position 7.0 with zero clicks.

1. Prepend one definition-first paragraph above the existing opening, leaving the current text intact below it: what the windowpane test is, in one sentence, then what a passing stretch looks like.
2. Add three or four `faq` entries to the frontmatter (what the test is, when in bulk to do it, what a torn window means, whether it applies to high-hydration doughs). `ArticleLayout.astro` already renders `faq` and emits `FAQPage` JSON-LD; `src/content/config.ts` already accepts the field.
3. Leave `title` and `description` unchanged; the page ranks on them.
4. Apply the writing bans: no em dashes, none of the listed phrases, no rule-of-three constructions.
5. Verify with the build-output page walk and a Search Console URL inspection after deploy; watch the query's CTR for four weeks.

Pointer: the on-page workstream deferred in `docs/superpowers/specs/2026-09-07-cleanup-and-affiliates-design.md` (Scope, "Out"), where the September 7 discussion ruled the edit additive-only.
