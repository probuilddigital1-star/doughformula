# Programmatic Recipe Pages Design

**Date:** 2026-05-04
**Goal:** Expand The Dough Formula's keyword footprint by generating ~50 recipe pages at build time from a fixed matrix of (bread style × hydration tier × schedule). Each page targets a specific long-tail recipe query, embeds the calculator's formula output as static numbers, and links to the live calculator pre-loaded with the matching state.

## Context

The site currently has one calculator (homepage) and 22 hand-authored articles. Article search intent is informational ("what is bakers percentage", "why is my crumb gummy"). The calculator is a tool but only one page; it does not capture transactional/recipe-intent queries like "75% hydration overnight sourdough recipe" or "same-day baguette."

Programmatic recipe pages fill that gap. They sit alongside articles as a separate content layer, target recipe-intent queries, and act as funnels into the live calculator.

## Strategy

**Templated programmatic generation with real per-page substance.** Each page is rendered from one shared template, but the substance per page is genuinely different:

- Real ingredient gram weights computed from baker's-percentage formula
- Real fermentation timeline computed from style + schedule
- Real method steps composed from style-base steps + schedule modifiers
- Variant intro / framing / results paragraphs picked deterministically from a hand-authored library

The framing prose does not carry the page on its own. The page is useful because the recipe data is real and complete. This keeps each page well clear of "doorway page" / thin-content territory.

**No AI-generated copy at build time.** All variant prose is hand-authored once, applying the project's writing-style hard bans (see `~/.claude/.../memory/feedback_writing_style.md`). Determinism: same combo → same paragraphs → same page on every build.

## Matrix Definition

**Three dimensions, hardcoded:**

- **Bread styles (8):** `sourdough`, `baguette`, `focaccia`, `sandwich`, `ciabatta`, `brioche`, `no-knead`, `country-loaf`. Mirrors the calculator's existing styles, replacing the calculator's `custom` placeholder with `country-loaf` (a real style with real recipe content).
- **Hydration tiers (3):** `65` (low: 60-67% range), `75` (mid: 68-77% range), `82` (high: 78-90% range). Each tier maps to a single canonical percentage used in the formula.
- **Schedule (3):** `same-day` (4-6 hr active fermentation), `overnight` (8-16 hr cold or room-temp), `slow` (24-48 hr cold ferment).

**Skip list (invalid combinations):**

| Style | Skip schedules | Reason |
|---|---|---|
| `sourdough` | `same-day` | Wild-yeast fermentation requires longer schedule |
| `brioche` | `slow` | Enriched dough doesn't tolerate 24-48hr cold ferment |
| `sandwich` | `slow` | Commercial yeast at slow schedule overproofs / loses structure |
| `no-knead` | `same-day` | Definitionally a long autolyse / room-temp ferment |

8 styles × 3 hydration × 3 schedule = 72 raw combos. After ~14 skips, **~58 final pages** (subject to small adjustment during data-table authoring).

## URL Structure

Flat slug: **`/recipes/[style]-[hydration]-[schedule]/`**

Examples:
- `/recipes/sourdough-75-overnight/`
- `/recipes/baguette-65-same-day/`
- `/recipes/focaccia-82-overnight/`
- `/recipes/country-loaf-75-slow/`

Slug pattern: `<style>-<hydration>-<schedule>` where `<schedule>` is the dimension key with hyphens preserved (`same-day`, `overnight`, `slow`). Lowercase, no trailing slash configured by Astro's standard trailingSlash behavior on this site.

Hub: `/recipes/` (index page with filterable grid).

## Page Template

Every recipe page renders these sections in order, inside a new `RecipeLayout.astro`:

1. **Header** — recipe title, eyebrow tag (`Recipe · <Style> · <Schedule>`), one-paragraph intro (variant copy)
2. **At-a-glance stat block** (`RecipeStatBlock.astro`) — total time, active hands-on time, hydration %, dough yield in grams, difficulty (1-3 indicator marks)
3. **Ingredients** (`RecipeIngredients.astro`) — table of ingredients with grams + baker's percentages. Includes style-specific extras: olive oil for focaccia, butter and eggs for brioche, etc.
4. **Schedule timeline** (`RecipeSchedule.astro`) — visual time table. Same-day shows hour-by-hour; overnight shows day 1 → day 2 with cold-ferment overnight; slow shows day 1 / 2 / 3.
5. **Method** — step-by-step list. Each step pulls from a style-base step list with schedule-aware modifiers. ~6-10 steps per recipe.
6. **What to expect** — short paragraph describing crumb, crust, flavor for this combo (variant copy).
7. **Mid-content AdSense slot** — same `AdUnit` pattern as articles (`AD_SLOTS.articleMid` reused via auto-injection script before the "What to expect" section).
8. **"Open in calculator" CTA** — large button linking to `/?style=<style>&hydration=<hydration>` (homepage with URL params; preloads the live calculator with this combo's state).
9. **End-of-content AdSense slot** — `AD_SLOTS.articleEnd` static placement.
10. **Related recipes** — 3 cards. Selection rule: 1 card from same style + different schedule, 1 from same schedule + different style, 1 from same style + different hydration. Falls back to the hub's general grid if matches don't exist.
11. **Related guides** — 2-3 article cards selected per style. Mapping defined in `src/data/recipes.ts`.

## Variant Copy Library

**File:** `src/data/recipe-copy.ts`

Pure TypeScript module exporting paragraph banks:

```ts
export const styleIntros: Record<Style, string[]>;     // 8 × 2 = 16 paragraphs
export const hydrationFraming: Record<Hydration, string[]>;  // 3 × 2 = 6 paragraphs
export const scheduleFraming: Record<Schedule, string[]>;    // 3 × 2 = 6 paragraphs
export const resultDescriptors: ResultBlock[];          // ~12 conditional blocks
export const styleMethodTweaks: Record<Style, string>; // 8 paragraphs (~25-40 words each)
```

**Selection function** (in `src/lib/recipe-copy-pick.ts`):

```ts
export function pickVariant<T>(bank: T[], combo: Combo): T {
  const hash = stringHash(`${combo.style}-${combo.hydration}-${combo.schedule}`);
  return bank[hash % bank.length];
}
```

`stringHash` is a simple deterministic non-cryptographic hash. Same combo → same hash → same variant on every build.

**Total volume:** ~50 short paragraphs across the banks (~30-40 words each → ~1,800 words of original prose).

**Authoring rules:** Every paragraph passes through the hard-bans filter. Self-review pass after authoring before commit.

## Recipe Formula Module

**File:** `src/lib/recipe-formula.ts`

Pure functions, no I/O:

```ts
export function computeIngredients(combo: Combo): Ingredient[]
export function computeSchedule(combo: Combo): ScheduleStep[]
export function composeMethod(combo: Combo): MethodStep[]
export function recipeMeta(combo: Combo): { totalTimeISO, activeTimeISO, yieldGrams, difficulty: 1|2|3 }
```

The ingredient calculation reuses the same baker's-percentage logic as the homepage calculator. The schedule generator outputs labeled time blocks (e.g., `{ when: "Day 1, 8am", action: "Mix flour and water; autolyse" }`).

**Yield is fixed per recipe at 1000g total dough.** All gram amounts derive from that target. Future versions can support yield as a fourth matrix dimension; out of scope here.

## Calculator Integration

**No refactor of the existing calculator.** Recipe pages display pre-computed static numbers. A "Open in calculator" button on each recipe page links to `/?style=<style>&hydration=<percent>`. The homepage gets a ~10-line enhancement to read those URL params on load and preset the calculator's bread-style selection + hydration value.

**Param schema:**
- `style` — one of the 8 known style IDs
- `hydration` — integer percentage (`65`, `75`, `82`)

**Failure mode:** if the URL param is missing, malformed, or unknown, the calculator falls back to its existing default (Sourdough, default hydration). No errors thrown; recipe page CTA still functional.

## Schema & SEO

**Recipe JSON-LD on every recipe page:**

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "<combo title>",
  "description": "<combo meta description>",
  "image": "https://thedoughformula.com/og-image.jpg",
  "recipeIngredient": ["<grams> g <name>", ...],
  "recipeInstructions": [{ "@type": "HowToStep", "text": "..." }, ...],
  "totalTime": "PT<...>",       // ISO 8601 from recipeMeta
  "prepTime":  "PT<...>",
  "cookTime":  "PT<...>",
  "recipeYield": "1 loaf, ~900g baked",
  "recipeCategory": "Bread",
  "recipeCuisine": "<style-specific>",
  "keywords": "<style>, <hydration>% hydration, <schedule>"
}
```

Plus the existing `BreadcrumbList` JSON-LD (Home → Recipes → <Recipe Title>).

**Per-page meta tags (passed to `Layout.astro`):**
- `title` — `"<Hydration>% Hydration <Schedule> <Style> Recipe | The Dough Formula"`
- `description` — composed from the variant intro's first sentence (deterministic, unique per page)
- `canonical` — self-canonicalizing (Astro's existing pattern)
- `og:title`, `og:description` — match `title`/`description`
- `og:image` — falls back to the existing site OG image (`/og-image.jpg` already configured in `Layout.astro`). Per-style imagery is deferred to a future polish task.

**Sitemap:** all recipe pages indexable. `@astrojs/sitemap` already configured; new routes pick up automatically.

## Navigation & Internal Linking

**Top nav (`SiteNav.astro`):** add `Recipes` link between `Guides` and `About`. Mobile menu gets the same.

**Footer (`SiteFooter.astro`):** add `Recipes` link in the existing "Guides" column or as a new column (decided during implementation).

**Recipes hub (`/recipes/`):** grid of all recipe cards using the new `RecipeCard.astro`. Filters: style (multi-select), schedule (multi-select), hydration (multi-select). Filters are client-side via `[data-*]` attributes + tiny vanilla JS — no framework, no state library.

**Article-side linking:** modify `ArticleLayout.astro` to render a small "Related recipes" section between the article body and the existing "Keep Reading" related-articles section. Selection rule: each article has 1-3 manually-mapped recipe slugs in the article frontmatter (or computed from category). New articles can specify in frontmatter; existing articles get sensible defaults from a category-to-recipe mapping in `src/data/recipes.ts`.

**Recipe-side linking:** "Related recipes" + "Related guides" sections per page (specified in template above).

**Existing `/styles/` articles:** during implementation, add inline links from each style article's body to its primary matching recipe. This is small per-article hand-editing (5 articles).

## AdSense Integration

Recipe pages reuse the article ad pattern via the existing `AdUnit` component and slot IDs:

- **Mid-recipe slot** — auto-injected before the first `<h2>` inside the recipe content (uses the same script pattern `ArticleLayout.astro` uses; the recipe layout includes the same injection script). Slot ID: `AD_SLOTS.articleMid`.
- **End-of-recipe slot** — static placement after the method, before the related-recipes section. Slot ID: `AD_SLOTS.articleEnd`.

**Recipes hub (`/recipes/`):** in-feed ad after the third card on the grid, only when more than 4 recipes are visible (after filtering). Slot ID: `AD_SLOTS.categoryInFeed`. Same pattern as the existing category-index pages.

No new AdSense ad units required.

## File Structure

**New files:**

- `src/data/recipes.ts` — matrix definition, skip list, per-style metadata (names, descriptions, default temperatures, related-article mappings, related-recipe rules)
- `src/data/recipe-copy.ts` — variant paragraph banks (all hand-authored prose)
- `src/lib/recipe-formula.ts` — pure ingredient/schedule/method/meta computations
- `src/lib/recipe-copy-pick.ts` — deterministic variant selector
- `src/lib/recipe-slug.ts` — slug ↔ combo conversion helpers
- `src/layouts/RecipeLayout.astro` — shared template (mirrors `ArticleLayout.astro` shape)
- `src/components/RecipeStatBlock.astro` — at-a-glance stats
- `src/components/RecipeIngredients.astro` — ingredient table
- `src/components/RecipeSchedule.astro` — visual timeline
- `src/components/RecipeCard.astro` — for grids and related-recipe sections
- `src/pages/recipes/index.astro` — hub with filterable grid
- `src/pages/recipes/[slug].astro` — dynamic route generating individual recipe pages

**Modified files:**

- `src/components/SiteNav.astro` — add `Recipes` nav link
- `src/components/SiteFooter.astro` — add `Recipes` footer link
- `src/pages/index.astro` — add URL-param parsing on calculator init (~10 lines, isolated to a small block in the existing initialization JS)
- `src/layouts/ArticleLayout.astro` — add "Related recipes" section
- 5 article files in `src/content/styles/*.md` — add inline link to matching recipe (small per-article edit during implementation)

**Untouched:**

- The homepage calculator's core JS state management, sliders, output rendering
- All other article files
- AdSense config (`src/config/ads.ts` is reused as-is)
- `astro.config.mjs`

## Quality Safeguards

Built into the implementation, not optional:

- **Hard-bans rules** applied to every paragraph in `recipe-copy.ts`. Self-review pass before commit.
- **Per-page word-count floor** — at build time, the dynamic route asserts each generated page composes at least 250 words of unique-by-combo prose (variants + dynamic data). Below threshold throws a build error.
- **Slug uniqueness** — at build time, assert no two combos map to the same slug. Throws if collision.
- **Matrix totality check** — at build time, assert every (style, hydration, schedule) combo is either generated OR explicitly in the skip list. No silent drops.
- **Manual spot-check** during testing — pick 5-10 representative pages across the matrix, read the rendered output, confirm prose reads naturally and dynamic data is correct.
- **Lighthouse spot-check** — run on one representative recipe page after deploy. Acceptance: no measurable regression vs. article-page baseline.

## Risks Acknowledged

| Risk | Severity | Mitigation |
|---|---|---|
| Google flags as doorway/thin pages | High if shortcut, low if executed as designed | Substantial real content per page (calculator output + schedule + variant copy + method); schema.org Recipe; word-count floor enforced at build time |
| Pages classified as duplicates of each other | Medium | Each page has unique title, meta description, intro paragraph (variant), recipe data, and schedule; deterministic variant selection prevents same-prose collisions |
| Existing calculator breaks during integration | Low | URL-param parse is isolated to ~10 lines in calc init; failure mode is silent fallback to defaults |
| AdSense policy concern from new pages | Low if we already passed review | All pages reuse approved ad slots with the same `AdUnit` component; no new ad behavior; word-count floor protects against thin-content flag |
| Build time bloat | Low | ~58 pages added to a 32-page build → ~90 pages; Astro handles this in seconds |
| Variant prose still reads templated despite hard-bans | Medium | Hand-authored, multiple variants per parameter level, deterministic selection; spot-check during testing |

## Out of Scope

- AI-generated copy at build time
- Per-recipe hero photography (uses a generic per-style image; future polish)
- User reviews / star ratings on recipe pages
- Yield as a matrix dimension (fixed at 1000g total dough; future expansion)
- A/B testing copy variants
- Refactoring the homepage calculator's state management
- Multi-language support
- Recipe import/export (JSON, mealie, etc.)
- Print-friendly stylesheet for recipe pages (could be a small future addition)
