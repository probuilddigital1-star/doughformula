# Programmatic Recipe Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate ~58 recipe pages at build time from a fixed (style × hydration × schedule) matrix, each with real ingredient/schedule/method data plus deterministically-selected hand-authored variant prose, plus a filterable hub at `/recipes/` and URL-param integration with the existing homepage calculator.

**Architecture:** A `src/data/` layer defines the matrix and prose banks. A `src/lib/` layer provides pure functions for slug ↔ combo conversion, recipe formula computation, and deterministic variant selection. A `src/components/` layer provides recipe-specific UI primitives. A new `RecipeLayout.astro` assembles them. A dynamic route at `src/pages/recipes/[slug].astro` enumerates the matrix and generates one page per combo. The existing homepage calculator gets a small URL-param parsing addition; it is otherwise untouched.

**Tech Stack:** Astro 5, Tailwind v4, TypeScript, the existing `@astrojs/sitemap` integration. No new dependencies.

**Note on testing:** The project has no unit-test framework. Each task's verification gate is `npm run build` succeeding plus `grep` checks against `dist/` to confirm expected markup. A few pure-logic modules include inline `console.assert` smoke checks that run at build time via Astro's frontmatter execution; these are NOT replacements for unit tests but they catch the most obvious regressions during iteration.

**Spec reference:** `docs/superpowers/specs/2026-05-04-programmatic-recipe-pages-design.md`

---

## File Map

**New files:**

| Path | Responsibility |
|---|---|
| `src/data/recipes.ts` | Matrix definition, skip list, per-style metadata, related-article mappings |
| `src/data/recipe-copy.ts` | Variant paragraph banks (all hand-authored prose) |
| `src/lib/recipe-formula.ts` | Pure computations: ingredients, schedule, method, recipeMeta |
| `src/lib/recipe-copy-pick.ts` | Deterministic variant selector (hash-based) |
| `src/lib/recipe-slug.ts` | Slug ↔ combo conversion helpers |
| `src/components/RecipeStatBlock.astro` | At-a-glance stats |
| `src/components/RecipeIngredients.astro` | Ingredient table with grams + percentages |
| `src/components/RecipeSchedule.astro` | Visual fermentation timeline |
| `src/components/RecipeCard.astro` | Card for grids and related-recipe sections |
| `src/layouts/RecipeLayout.astro` | Shared template wiring components + AdSense + JSON-LD |
| `src/pages/recipes/index.astro` | Hub with filterable grid |
| `src/pages/recipes/[slug].astro` | Dynamic route generating individual recipe pages |

**Modified files:**

| Path | Why |
|---|---|
| `src/components/SiteNav.astro` | Add "Recipes" nav link |
| `src/components/SiteFooter.astro` | Add "Recipes" footer link |
| `src/pages/index.astro` | Add URL-param parsing on calculator init |
| `src/layouts/ArticleLayout.astro` | Add "Related recipes" section |
| `src/content/styles/sourdough-for-beginners.md` | Inline link to matching recipe |
| `src/content/styles/classic-french-baguette.md` | Inline link to matching recipe |
| `src/content/styles/ciabatta-explained.md` | Inline link to matching recipe |
| `src/content/styles/country-loaf-pain-de-campagne.md` | Inline link to matching recipe |
| `src/content/styles/high-hydration-focaccia.md` | Inline link to matching recipe |

---

## Phase 1 — Data and pure logic foundation

### Task 1: Recipe matrix, types, and per-style metadata

**Files:**
- Create: `src/data/recipes.ts`

- [ ] **Step 1: Create `src/data/recipes.ts`**

Create with exactly this content:

```ts
export const STYLES = [
  'sourdough',
  'baguette',
  'focaccia',
  'sandwich',
  'ciabatta',
  'brioche',
  'no-knead',
  'country-loaf',
] as const;

export const HYDRATIONS = [65, 75, 82] as const;

export const SCHEDULES = ['same-day', 'overnight', 'slow'] as const;

export type Style = (typeof STYLES)[number];
export type Hydration = (typeof HYDRATIONS)[number];
export type Schedule = (typeof SCHEDULES)[number];

export interface Combo {
  style: Style;
  hydration: Hydration;
  schedule: Schedule;
}

// Combos that are not generated. Reasoning kept in comments.
const SKIPS: ReadonlyArray<{ style: Style; schedule: Schedule; reason: string }> = [
  { style: 'sourdough', schedule: 'same-day', reason: 'Wild yeast needs longer schedule.' },
  { style: 'brioche', schedule: 'slow', reason: 'Enriched dough does not tolerate 24-48hr cold ferment.' },
  { style: 'sandwich', schedule: 'slow', reason: 'Commercial yeast overproofs at slow schedule.' },
  { style: 'no-knead', schedule: 'same-day', reason: 'Definitionally a long autolyse.' },
];

export function isSkipped(c: Combo): boolean {
  return SKIPS.some((s) => s.style === c.style && s.schedule === c.schedule);
}

export function allCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const style of STYLES) {
    for (const hydration of HYDRATIONS) {
      for (const schedule of SCHEDULES) {
        const c: Combo = { style, hydration, schedule };
        if (!isSkipped(c)) combos.push(c);
      }
    }
  }
  return combos;
}

export interface StyleMeta {
  displayName: string;
  cuisine: string;          // for schema.org recipeCuisine
  saltPercent: number;       // baker's percentage
  yeastType: 'starter' | 'instant' | 'enriched';
  hasOliveOil?: boolean;
  hasButter?: boolean;
  hasEggs?: boolean;
  hasMilk?: boolean;
  wholeGrainPercent?: number;
  bakeTemperatureF: number;
  bakeMinutes: number;
  difficulty: 1 | 2 | 3;
  // Article slugs (in src/content/styles/) relevant to this style. May be empty.
  relatedArticles: string[];
}

export const STYLE_META: Record<Style, StyleMeta> = {
  sourdough: {
    displayName: 'Sourdough',
    cuisine: 'European',
    saltPercent: 2,
    yeastType: 'starter',
    bakeTemperatureF: 500,
    bakeMinutes: 45,
    difficulty: 3,
    relatedArticles: ['sourdough-for-beginners'],
  },
  baguette: {
    displayName: 'Baguette',
    cuisine: 'French',
    saltPercent: 2,
    yeastType: 'instant',
    bakeTemperatureF: 475,
    bakeMinutes: 24,
    difficulty: 3,
    relatedArticles: ['classic-french-baguette'],
  },
  focaccia: {
    displayName: 'Focaccia',
    cuisine: 'Italian',
    saltPercent: 2.2,
    yeastType: 'instant',
    hasOliveOil: true,
    bakeTemperatureF: 425,
    bakeMinutes: 22,
    difficulty: 1,
    relatedArticles: ['high-hydration-focaccia'],
  },
  sandwich: {
    displayName: 'Sandwich Loaf',
    cuisine: 'American',
    saltPercent: 2,
    yeastType: 'instant',
    hasButter: true,
    hasMilk: true,
    bakeTemperatureF: 375,
    bakeMinutes: 35,
    difficulty: 1,
    relatedArticles: [],
  },
  ciabatta: {
    displayName: 'Ciabatta',
    cuisine: 'Italian',
    saltPercent: 2,
    yeastType: 'instant',
    hasOliveOil: true,
    bakeTemperatureF: 475,
    bakeMinutes: 22,
    difficulty: 3,
    relatedArticles: ['ciabatta-explained'],
  },
  brioche: {
    displayName: 'Brioche',
    cuisine: 'French',
    saltPercent: 1.8,
    yeastType: 'enriched',
    hasButter: true,
    hasEggs: true,
    hasMilk: true,
    bakeTemperatureF: 350,
    bakeMinutes: 35,
    difficulty: 3,
    relatedArticles: [],
  },
  'no-knead': {
    displayName: 'No-Knead Loaf',
    cuisine: 'European',
    saltPercent: 2,
    yeastType: 'instant',
    bakeTemperatureF: 475,
    bakeMinutes: 45,
    difficulty: 1,
    relatedArticles: [],
  },
  'country-loaf': {
    displayName: 'Country Loaf',
    cuisine: 'French',
    saltPercent: 2,
    yeastType: 'starter',
    wholeGrainPercent: 25,
    bakeTemperatureF: 475,
    bakeMinutes: 45,
    difficulty: 3,
    relatedArticles: ['country-loaf-pain-de-campagne'],
  },
};
```

- [ ] **Step 2: Build to verify the module compiles**

Run:
```bash
npm run build
```
Expected: build succeeds. The new module is not yet imported anywhere, so it just type-checks.

- [ ] **Step 3: Commit**

```bash
git add src/data/recipes.ts
git commit -m "Add recipe matrix, types, and per-style metadata"
```

---

### Task 2: Slug ↔ combo helpers

**Files:**
- Create: `src/lib/recipe-slug.ts`

- [ ] **Step 1: Create `src/lib/recipe-slug.ts`**

```ts
import type { Combo, Style, Hydration, Schedule } from '../data/recipes';
import { STYLES, HYDRATIONS, SCHEDULES } from '../data/recipes';

export function comboToSlug(c: Combo): string {
  return `${c.style}-${c.hydration}-${c.schedule}`;
}

export function slugToCombo(slug: string): Combo | null {
  // Style strings can contain hyphens (e.g. "no-knead", "country-loaf").
  // Schedule strings can contain hyphens (e.g. "same-day").
  // Strategy: greedy-match styles longest-first, then expect a 2-digit hydration, then schedule.
  const stylesByLength = [...STYLES].sort((a, b) => b.length - a.length);
  for (const style of stylesByLength) {
    if (slug.startsWith(style + '-')) {
      const rest = slug.slice(style.length + 1);
      // rest is "<hydration>-<schedule>"
      const match = rest.match(/^(\d{2,3})-(.+)$/);
      if (!match) continue;
      const hyd = Number(match[1]);
      const sched = match[2];
      if (
        (HYDRATIONS as readonly number[]).includes(hyd) &&
        (SCHEDULES as readonly string[]).includes(sched)
      ) {
        return {
          style: style as Style,
          hydration: hyd as Hydration,
          schedule: sched as Schedule,
        };
      }
    }
  }
  return null;
}

export function comboTitle(c: Combo, displayName: string, scheduleLabel: string): string {
  return `${c.hydration}% Hydration ${scheduleLabel} ${displayName}`;
}

export const SCHEDULE_LABELS: Record<Schedule, string> = {
  'same-day': 'Same-Day',
  overnight: 'Overnight',
  slow: 'Slow-Fermented',
};
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Smoke-check the round-trip**

Create a temporary file `verify-slug.mjs` at the repo root:

```js
import { allCombos } from './src/data/recipes.ts';
import { comboToSlug, slugToCombo } from './src/lib/recipe-slug.ts';

let fail = 0;
for (const c of allCombos()) {
  const slug = comboToSlug(c);
  const back = slugToCombo(slug);
  if (!back || back.style !== c.style || back.hydration !== c.hydration || back.schedule !== c.schedule) {
    console.error('Round-trip failed:', c, slug, back);
    fail++;
  }
}
console.log(`Tested ${allCombos().length} combos; ${fail} failed.`);
```

Run with the project's TypeScript-aware runner:
```bash
npx tsx verify-slug.mjs
```

Expected: `Tested 58 combos; 0 failed.` (or whatever the actual count is — should match `allCombos().length`).

**Then delete the file:**
```bash
rm verify-slug.mjs
```

If `tsx` is not available, skip this step — Task 11's build will exercise the same code path.

- [ ] **Step 4: Commit**

```bash
git add src/lib/recipe-slug.ts
git commit -m "Add recipe slug conversion helpers"
```

---

### Task 3: Deterministic variant selector

**Files:**
- Create: `src/lib/recipe-copy-pick.ts`

- [ ] **Step 1: Create `src/lib/recipe-copy-pick.ts`**

```ts
import type { Combo } from '../data/recipes';

// Non-cryptographic deterministic hash. Same input -> same output every build.
function stringHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function comboKey(c: Combo): string {
  return `${c.style}|${c.hydration}|${c.schedule}`;
}

export function pickVariant<T>(bank: readonly T[], c: Combo): T {
  if (bank.length === 0) {
    throw new Error('pickVariant: empty bank');
  }
  return bank[stringHash(comboKey(c)) % bank.length];
}
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/recipe-copy-pick.ts
git commit -m "Add deterministic variant selector for recipe copy"
```

---

### Task 4: Recipe formula module

**Files:**
- Create: `src/lib/recipe-formula.ts`

- [ ] **Step 1: Create `src/lib/recipe-formula.ts`**

```ts
import type { Combo } from '../data/recipes';
import { STYLE_META } from '../data/recipes';

const TOTAL_DOUGH_GRAMS = 1000; // Fixed yield target for all recipes.

export interface Ingredient {
  name: string;
  grams: number;
  bakerPercent: number;
}

export interface ScheduleStep {
  when: string;       // e.g. "Day 1, 8:00 AM" or "Hour 0"
  action: string;      // e.g. "Mix flour and water; autolyse 30 minutes"
}

export interface MethodStep {
  text: string;
}

export interface RecipeMeta {
  totalTimeISO: string;     // ISO 8601 duration, e.g. "PT12H"
  activeTimeISO: string;
  totalTimeLabel: string;   // human-readable, e.g. "12 hours"
  activeTimeLabel: string;
  yieldGrams: number;
  difficulty: 1 | 2 | 3;
}

export function computeIngredients(c: Combo): Ingredient[] {
  const meta = STYLE_META[c.style];
  const hyd = c.hydration / 100;

  // Derive flour weight so flour + water + salt + extras ≈ TOTAL_DOUGH_GRAMS.
  // Sum of multipliers for the simple lean dough = 1 + hyd + (salt%/100) + (yeast%/100)
  const yeastPercent = yeastPercentForStyleAndSchedule(c);
  const oilPercent = meta.hasOliveOil ? 5 : 0;
  const butterPercent = meta.hasButter ? 12 : 0;
  const eggPercent = meta.hasEggs ? 18 : 0;
  const milkPercent = meta.hasMilk ? (meta.hasEggs ? 12 : 25) : 0;

  const totalPercent =
    100 +
    c.hydration -
    milkPercent + // milk replaces water 1:1 for hydration purposes
    meta.saltPercent +
    yeastPercent +
    oilPercent +
    butterPercent +
    eggPercent +
    milkPercent;

  const flour = Math.round((TOTAL_DOUGH_GRAMS / totalPercent) * 100);
  const water = Math.round(flour * (c.hydration - milkPercent) / 100);
  const salt = round1(flour * meta.saltPercent / 100);
  const yeast = round1(flour * yeastPercent / 100);

  const ingredients: Ingredient[] = [];

  if (meta.wholeGrainPercent && meta.wholeGrainPercent > 0) {
    const whole = Math.round(flour * meta.wholeGrainPercent / 100);
    const white = flour - whole;
    ingredients.push({ name: 'Bread flour', grams: white, bakerPercent: 100 - meta.wholeGrainPercent });
    ingredients.push({ name: 'Whole wheat flour', grams: whole, bakerPercent: meta.wholeGrainPercent });
  } else {
    ingredients.push({ name: 'Bread flour', grams: flour, bakerPercent: 100 });
  }

  ingredients.push({ name: 'Water', grams: water, bakerPercent: c.hydration - milkPercent });

  if (milkPercent > 0) {
    const milk = Math.round(flour * milkPercent / 100);
    ingredients.push({ name: 'Milk', grams: milk, bakerPercent: milkPercent });
  }

  ingredients.push({ name: 'Salt', grams: salt, bakerPercent: meta.saltPercent });

  if (meta.yeastType === 'starter') {
    ingredients.push({ name: 'Active sourdough starter (100% hydration)', grams: yeast, bakerPercent: yeastPercent });
  } else if (meta.yeastType === 'enriched') {
    ingredients.push({ name: 'Instant yeast', grams: yeast, bakerPercent: yeastPercent });
  } else {
    ingredients.push({ name: 'Instant yeast', grams: yeast, bakerPercent: yeastPercent });
  }

  if (meta.hasOliveOil) {
    const oil = Math.round(flour * oilPercent / 100);
    ingredients.push({ name: 'Olive oil', grams: oil, bakerPercent: oilPercent });
  }
  if (meta.hasButter) {
    const butter = Math.round(flour * butterPercent / 100);
    ingredients.push({ name: 'Butter (softened)', grams: butter, bakerPercent: butterPercent });
  }
  if (meta.hasEggs) {
    const eggs = Math.round(flour * eggPercent / 100);
    ingredients.push({ name: 'Eggs (whole)', grams: eggs, bakerPercent: eggPercent });
  }

  return ingredients;
}

function yeastPercentForStyleAndSchedule(c: Combo): number {
  const meta = STYLE_META[c.style];
  if (meta.yeastType === 'starter') return 20;       // 20% starter for sourdough/country-loaf
  if (meta.yeastType === 'enriched') return 1.2;     // brioche
  // instant yeast — vary by schedule to compensate
  switch (c.schedule) {
    case 'same-day': return 0.8;
    case 'overnight': return 0.3;
    case 'slow': return 0.15;
  }
}

export function computeSchedule(c: Combo): ScheduleStep[] {
  const meta = STYLE_META[c.style];

  if (c.schedule === 'same-day') {
    return [
      { when: 'Hour 0', action: 'Mix flour, water, yeast. Autolyse 20 minutes.' },
      { when: 'Hour 0:20', action: 'Add salt, mix until smooth.' },
      { when: 'Hour 0:30', action: 'First fold.' },
      { when: 'Hour 1:00', action: 'Second fold.' },
      { when: 'Hour 1:30', action: 'Third fold.' },
      { when: 'Hour 2:00', action: 'Bulk ferment until visibly puffy.' },
      { when: 'Hour 3:30', action: 'Pre-shape, rest 20 minutes.' },
      { when: 'Hour 4:00', action: 'Final shape, proof 45-60 minutes.' },
      { when: 'Hour 5:00', action: `Score and bake at ${meta.bakeTemperatureF}°F for ${meta.bakeMinutes} minutes.` },
    ];
  }

  if (c.schedule === 'overnight') {
    return [
      { when: 'Day 1, 6:00 PM', action: 'Mix flour and water. Autolyse 30 minutes.' },
      { when: 'Day 1, 6:30 PM', action: meta.yeastType === 'starter' ? 'Add starter and salt. Mix until combined.' : 'Add yeast and salt. Mix until smooth.' },
      { when: 'Day 1, 7:00 PM', action: 'Stretch and fold every 30 minutes for 2 hours.' },
      { when: 'Day 1, 9:00 PM', action: 'Bulk ferment 1-2 more hours at room temperature.' },
      { when: 'Day 1, 10:30 PM', action: 'Shape, place in banneton or proofing vessel, refrigerate overnight.' },
      { when: 'Day 2, 7:00 AM', action: 'Pull from refrigerator. Preheat oven and Dutch oven (or stone) to bake temperature.' },
      { when: 'Day 2, 8:00 AM', action: `Score and bake at ${meta.bakeTemperatureF}°F covered for 25 minutes, uncovered for the remaining ${Math.max(0, meta.bakeMinutes - 25)} minutes.` },
    ];
  }

  // slow (24-48hr)
  return [
    { when: 'Day 1, evening', action: 'Mix flour and water. Autolyse 1 hour.' },
    { when: 'Day 1, evening', action: meta.yeastType === 'starter' ? 'Add starter and salt. Mix gently.' : 'Add yeast and salt. Mix gently.' },
    { when: 'Day 1, evening', action: 'Three folds, 30 minutes apart.' },
    { when: 'Day 1, night', action: 'Refrigerate the bulk dough overnight.' },
    { when: 'Day 2, morning', action: 'Pull from refrigerator. Bench rest 1 hour.' },
    { when: 'Day 2, midday', action: 'Pre-shape, rest 30 minutes, final shape into banneton.' },
    { when: 'Day 2, afternoon', action: 'Refrigerate the shaped loaf overnight.' },
    { when: 'Day 3, morning', action: 'Pull, preheat oven and baking vessel.' },
    { when: 'Day 3, morning', action: `Score and bake at ${meta.bakeTemperatureF}°F covered for 25 minutes, uncovered for the remaining ${Math.max(0, meta.bakeMinutes - 25)} minutes.` },
  ];
}

export function composeMethod(c: Combo): MethodStep[] {
  // For now, the method mirrors the schedule. Future expansion can add style-specific tweaks.
  return computeSchedule(c).map((s) => ({ text: `${s.when}: ${s.action}` }));
}

export function recipeMeta(c: Combo): RecipeMeta {
  const meta = STYLE_META[c.style];
  let totalHours: number;
  let activeMinutes: number;

  switch (c.schedule) {
    case 'same-day':
      totalHours = 5;
      activeMinutes = 60;
      break;
    case 'overnight':
      totalHours = 14;
      activeMinutes = 75;
      break;
    case 'slow':
      totalHours = 36;
      activeMinutes = 90;
      break;
  }

  return {
    totalTimeISO: `PT${totalHours}H`,
    activeTimeISO: `PT${activeMinutes}M`,
    totalTimeLabel: totalHours >= 24 ? `${totalHours} hours (over ~${Math.round(totalHours / 24) + 1} days)` : `${totalHours} hours`,
    activeTimeLabel: `${activeMinutes} minutes`,
    yieldGrams: TOTAL_DOUGH_GRAMS,
    difficulty: meta.difficulty,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/recipe-formula.ts
git commit -m "Add recipe formula module: ingredients, schedule, method, meta"
```

---

### Task 5: Variant copy library — author all 50 paragraphs

**Files:**
- Create: `src/data/recipe-copy.ts`

This task is primarily a writing task. All paragraphs follow the writing-style hard bans recorded in `~/.claude/.../memory/feedback_writing_style.md`. **Apply those rules. Do not deviate from the prose below — it has been authored to comply.**

- [ ] **Step 1: Create `src/data/recipe-copy.ts` with the full variant library**

```ts
import type { Style, Hydration, Schedule, Combo } from './recipes';

export const styleIntros: Record<Style, string[]> = {
  sourdough: [
    "Sourdough relies on wild yeast cultured from a starter, and that starter does most of the work. The long ferment pulls real flavor out of the flour, gives you a chewy, open crumb, and produces the sour notes that commercial yeast can't match.",
    "A loaf of sourdough is a record of time. Hours of cold fermentation deepen the flavor, the gluten develops without aggressive kneading, and the finished crust holds the dark color of a slow, hot bake.",
  ],
  baguette: [
    "The classic French baguette runs on contrast: a thin shattering crust, an open chewy interior, and very little else getting in the way. Done right, the dough is barely handled and the oven does the rest.",
    "A real baguette comes from a brief mix, gentle folds, and a steamy bake hot enough to blister the crust. The shape is honest, the score lines open as the dough springs, and the inside stays light.",
  ],
  focaccia: [
    "Focaccia is the easiest yes in this matrix. High hydration, generous olive oil, finger-dimples that hold flaky salt, and a soft open crumb that takes any topping you put on it.",
    "A flat, oil-rich loaf that bakes in a sheet pan and rewards short proofing with maximum crumb. Olive oil pools in the dimples, herbs fragrance the surface, and the bottom crust crisps in pooled fat.",
  ],
  sandwich: [
    "A sandwich loaf is the daily driver. Soft, even crumb that slices clean, gentle flavor that does not fight the fillings, and a tight enough texture to hold up to butter, mustard, or anything else.",
    "Built for the toaster and the lunchbox. Milk and butter soften the crumb, a longer proof in the loaf pan keeps the structure even, and the finished loaf slices to whatever thickness you need.",
  ],
  ciabatta: [
    "Ciabatta is wet dough that fights you and wins. High hydration, a biga preferment, minimal shaping, and a finished loaf riddled with the irregular holes that hold olive oil and tomato.",
    "The Italian answer to the baguette: rougher, wetter, more dramatic. A long fermentation in the biga gives flavor, the high hydration produces the open crumb, and the rustic shape comes from the dough itself, not the baker.",
  ],
  brioche: [
    "Brioche is bread that thinks it's pastry. Eggs, butter, and milk soften the crumb to almost cake, but the gluten still has work to do. The cold ferment after mixing keeps the butter from melting out before the bake.",
    "A rich, golden enriched dough with a long, slow incorporation of butter. The crumb is tight and tender, the crust browns quickly from the egg wash, and the loaf keeps for days without going stale the way leaner breads do.",
  ],
  'no-knead': [
    "No-knead bread proves that time replaces effort. A wet dough, twelve to eighteen hours on the counter, no folding, no shaping beyond a quick form, and a Dutch oven hot enough to give it a real crust.",
    "The recipe Mark Bittman made famous for a reason. Mix, wait, shape, wait, bake covered, bake uncovered. The slow autolyse develops the gluten by itself, and the result is genuinely good bread from very little fuss.",
  ],
  'country-loaf': [
    "A country loaf blends bread flour with whole grains for a hearty crumb that still holds a sandwich together. The whole-grain flour brings flavor and color, the white flour keeps the structure, and the long ferment makes them work together.",
    "The pain de campagne approach: not pure white, not aggressively whole-grain, but a balanced mix that bakes into something with depth. Slightly tangier than a plain loaf, slightly sweeter than pure sourdough, and a workhorse for the kitchen.",
  ],
};

export const hydrationFraming: Record<Hydration, string[]> = {
  65: [
    "At 65% hydration, the dough is firm and forgiving. It shapes cleanly, holds its form during proof, and produces a tighter, more even crumb. Good for beginners, sandwich loaves, and anything you want to slice neatly.",
    "A 65% dough is what a new baker should start on. The flour-to-water ratio is generous to flour, so the dough behaves predictably, takes shape readily, and bakes into a structured loaf without surprises.",
  ],
  75: [
    "75% hydration sits in the middle for a reason. The dough is soft enough for an open crumb, firm enough to handle, and hits the sweet spot for most artisan styles. Most home bakers spend most of their time here.",
    "At 75%, you get real artisan crumb without fighting the dough. It's wet enough for visible holes in the cut loaf, dry enough that you can shape it on a lightly floured counter without the dough sticking to everything.",
  ],
  82: [
    "At 82% hydration, the dough barely holds its own shape. The reward is dramatic: large irregular holes, a crisp blistered crust, and the flavor that comes from very wet doughs that have spent a long time fermenting. The cost is technique.",
    "A high-hydration dough wants to flatten on the counter. You manage it with folds instead of kneading, with a banneton instead of free-standing proof, and with a hot Dutch oven or stone that can hold the shape until the spring sets.",
  ],
};

export const scheduleFraming: Record<Schedule, string[]> = {
  'same-day': [
    "A same-day schedule fits a Saturday afternoon. Mix in the morning, bake by dinner, and use commercial yeast at a percentage that matches the timeline. Flavor is honest but less developed; structure is reliable.",
    "Same-day means start to finish in roughly four to six hours. The recipe leans on commercial yeast at a higher percentage and a warm bulk fermentation. You won't get cold-ferment depth, but the loaf is on the table the day you decide to bake.",
  ],
  overnight: [
    "The overnight schedule is the home baker's standard. Mix in the evening, cold-ferment in the refrigerator overnight, shape and bake the next morning. Flavor improves dramatically with time, and the schedule fits a normal life.",
    "Overnight fermentation is where flavor lives. The dough goes in the refrigerator after a brief room-temperature ferment, the cold slows the yeast and lets enzymes do their work, and the loaf you bake the next day tastes like it cost more than it did.",
  ],
  slow: [
    "The slow schedule is for bakers who plan ahead. Mix Friday, fold and refrigerate, shape Saturday, ferment again, bake Sunday. The time produces depth that a shorter schedule simply can't reach, and the dough is a pleasure to handle by the end.",
    "A 24 to 48 hour ferment is the professional approach scaled to a home kitchen. The dough rests in the refrigerator for most of its life, gluten develops without effort, and the bake produces a crust and crumb that read as serious bread.",
  ],
};

interface ResultDescriptor {
  match: (c: Combo) => boolean;
  text: string;
}

const LEAN: Style[] = ['sourdough', 'baguette', 'country-loaf', 'no-knead'];
const SOFT: Style[] = ['sandwich', 'brioche'];
const ITALIAN: Style[] = ['focaccia', 'ciabatta'];

// Order matters: more specific matchers come first.
export const resultDescriptors: ResultDescriptor[] = [
  {
    match: (c) => LEAN.includes(c.style) && c.hydration === 82 && c.schedule === 'slow',
    text: "A dramatic open crumb riddled with irregular holes, a blistered dark crust, and the kind of complex tangy flavor only long ferments produce. This is artisan bread at its peak.",
  },
  {
    match: (c) => LEAN.includes(c.style) && c.hydration === 82 && c.schedule === 'overnight',
    text: "A genuinely open, irregular crumb with a glossy interior and a thin crisp crust. The overnight cold ferment adds depth without the time commitment of a multi-day schedule.",
  },
  {
    match: (c) => LEAN.includes(c.style) && c.hydration === 65,
    text: "Expect a tight, controlled crumb and a robust crust. The loaf slices cleanly and holds together for sandwiches; not the most dramatic interior, but the most reliable.",
  },
  {
    match: (c) => LEAN.includes(c.style) && c.hydration === 75,
    text: "A balanced open crumb with visible holes and a chewy texture. The crust is thin but sturdy, and the flavor is a clean read on the flour and ferment.",
  },
  {
    match: (c) => LEAN.includes(c.style) && c.hydration === 82,
    text: "A dramatically open crumb with large holes throughout. The crust crisps and blisters at high temperature; the interior reads as professional artisan bread.",
  },
  {
    match: (c) => SOFT.includes(c.style) && c.hydration === 65,
    text: "A close, even crumb that slices to whatever thickness you need. Soft and pull-apart, with a thin tender crust browned by the enrichment.",
  },
  {
    match: (c) => SOFT.includes(c.style) && c.hydration === 75,
    text: "A softer crumb than the low-hydration version, with slightly more open texture but the same tender pull. Good for both sandwiches and the toaster.",
  },
  {
    match: (c) => SOFT.includes(c.style) && c.hydration === 82,
    text: "An almost custardy interior, very open and tender. Brioche at this hydration leans toward bread pudding territory; sandwich loaves get a slightly delicate slice.",
  },
  {
    match: (c) => ITALIAN.includes(c.style) && c.hydration === 65,
    text: "A denser version of the style than purists would shape. The dough handles easily and bakes into a structured loaf, but you give up some of the open-crumb drama the higher hydrations bring.",
  },
  {
    match: (c) => ITALIAN.includes(c.style) && c.hydration === 75,
    text: "A focaccia with a soft dimpled interior and crisp oiled bottom; or a ciabatta with visible holes and a light chewy crumb. The standard expression of the style.",
  },
  {
    match: (c) => ITALIAN.includes(c.style) && c.hydration === 82,
    text: "Maximum open crumb with large irregular holes throughout. The crust crisps in pooled olive oil; the interior is light and airy.",
  },
  {
    // Fallback for any combo not caught above.
    match: () => true,
    text: "A solid, dependable loaf for this combination. The flavor reflects the flour and ferment; the crumb reflects the hydration; the crust reflects the bake.",
  },
];

export const styleMethodTweaks: Record<Style, string> = {
  sourdough:
    "The starter has to be active and bubbly within four to six hours of feeding. If it doubles in that window, it's ready. A sluggish starter produces a sluggish loaf, regardless of schedule or hydration.",
  baguette:
    "Pre-shape gently after the bulk ferment, rest for 20 minutes, then final-shape with light tension. Score the loaf with a curved lame held at a shallow angle so the cuts open in long, asymmetric ears.",
  focaccia:
    "Pour the dough into a generously oiled pan, oil your hands, and dimple the surface with all ten fingers right before the final proof. Drizzle more oil over the dimples just before baking.",
  sandwich:
    "Roll the bulk-fermented dough into a tight log, tucking the seam under, and place seam-side down in a buttered loaf pan. Proof until the dough crests just above the rim, then bake.",
  ciabatta:
    "Don't try to shape ciabatta with your hands. Turn the bulk-fermented dough onto a heavily floured counter, divide with a bench scraper, and lift each portion gently onto the peel. The shape is whatever the dough wants to be.",
  brioche:
    "Add the cold butter in small pieces with the mixer running on low. Wait for each addition to fully incorporate before adding the next. The dough will look broken before it comes back together; trust the process.",
  'no-knead':
    "Mix until the flour is just hydrated, cover, and walk away for 12 to 18 hours. When you return, the dough should be wet and sticky, dotted with bubbles. Shape gently on a floured surface, rest, and bake covered in a Dutch oven.",
  'country-loaf':
    "Hydrate the whole-grain portion separately for 30 minutes before adding the white flour. The whole grains absorb water more slowly, and pre-soaking them gives a more even final hydration in the dough.",
};

export function selectResultDescriptor(c: Combo): string {
  for (const d of resultDescriptors) {
    if (d.match(c)) return d.text;
  }
  // The matcher list ends with a `match: () => true` fallback, so this is unreachable.
  return resultDescriptors[resultDescriptors.length - 1].text;
}
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/data/recipe-copy.ts
git commit -m "Add variant prose library for recipe pages"
```

---

## Phase 2 — Components

### Task 6: RecipeStatBlock component

**Files:**
- Create: `src/components/RecipeStatBlock.astro`

- [ ] **Step 1: Create `src/components/RecipeStatBlock.astro`**

```astro
---
import type { RecipeMeta } from '../lib/recipe-formula';

interface Props {
  meta: RecipeMeta;
  hydrationPercent: number;
}

const { meta, hydrationPercent } = Astro.props;

const difficultyLabel = ['Beginner', 'Intermediate', 'Advanced'][meta.difficulty - 1];
const difficultyMarks = '⌬'.repeat(meta.difficulty) + '○'.repeat(3 - meta.difficulty);
---

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-10 p-6 rounded-xl bg-[var(--cream-warm)] border border-[var(--border-light)]">
  <div>
    <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium mb-1">Total time</p>
    <p class="font-display text-lg">{meta.totalTimeLabel}</p>
  </div>
  <div>
    <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium mb-1">Active</p>
    <p class="font-display text-lg">{meta.activeTimeLabel}</p>
  </div>
  <div>
    <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium mb-1">Hydration</p>
    <p class="font-display text-lg">{hydrationPercent}%</p>
  </div>
  <div>
    <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium mb-1">Difficulty</p>
    <p class="font-display text-lg" title={difficultyLabel}>{difficultyMarks}</p>
  </div>
</div>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeStatBlock.astro
git commit -m "Add RecipeStatBlock at-a-glance component"
```

---

### Task 7: RecipeIngredients component

**Files:**
- Create: `src/components/RecipeIngredients.astro`

- [ ] **Step 1: Create `src/components/RecipeIngredients.astro`**

```astro
---
import type { Ingredient } from '../lib/recipe-formula';

interface Props {
  ingredients: Ingredient[];
}

const { ingredients } = Astro.props;
---

<section class="my-10 max-w-2xl mx-auto">
  <h2 class="font-display text-2xl mb-6">Ingredients</h2>
  <p class="text-sm text-[var(--crust-brown)] mb-4">For approximately 1 kg total dough weight.</p>
  <table class="w-full text-left">
    <thead>
      <tr class="border-b border-[var(--border-light)]">
        <th class="py-2 font-medium text-sm uppercase tracking-wider text-[var(--accent-gold)]">Ingredient</th>
        <th class="py-2 font-medium text-sm uppercase tracking-wider text-[var(--accent-gold)] text-right">Grams</th>
        <th class="py-2 font-medium text-sm uppercase tracking-wider text-[var(--accent-gold)] text-right">Baker's %</th>
      </tr>
    </thead>
    <tbody>
      {ingredients.map((i) => (
        <tr class="border-b border-[var(--border-light)]">
          <td class="py-3">{i.name}</td>
          <td class="py-3 text-right font-mono">{i.grams} g</td>
          <td class="py-3 text-right font-mono text-[var(--crust-brown)]">{i.bakerPercent}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeIngredients.astro
git commit -m "Add RecipeIngredients table component"
```

---

### Task 8: RecipeSchedule component

**Files:**
- Create: `src/components/RecipeSchedule.astro`

- [ ] **Step 1: Create `src/components/RecipeSchedule.astro`**

```astro
---
import type { ScheduleStep } from '../lib/recipe-formula';

interface Props {
  schedule: ScheduleStep[];
}

const { schedule } = Astro.props;
---

<section class="my-10 max-w-2xl mx-auto">
  <h2 class="font-display text-2xl mb-6">Schedule</h2>
  <ol class="space-y-4">
    {schedule.map((step) => (
      <li class="flex gap-4 pb-4 border-b border-[var(--border-light)] last:border-b-0">
        <div class="flex-shrink-0 w-32 text-sm font-medium text-[var(--accent-gold)] uppercase tracking-wider">
          {step.when}
        </div>
        <div class="flex-1 text-[var(--espresso)]">
          {step.action}
        </div>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeSchedule.astro
git commit -m "Add RecipeSchedule timeline component"
```

---

### Task 9: RecipeCard component

**Files:**
- Create: `src/components/RecipeCard.astro`

- [ ] **Step 1: Create `src/components/RecipeCard.astro`**

```astro
---
import type { Combo } from '../data/recipes';
import { STYLE_META } from '../data/recipes';
import { comboToSlug, comboTitle, SCHEDULE_LABELS } from '../lib/recipe-slug';
import type { RecipeMeta } from '../lib/recipe-formula';

interface Props {
  combo: Combo;
  meta: RecipeMeta;
}

const { combo, meta } = Astro.props;
const styleMeta = STYLE_META[combo.style];
const slug = comboToSlug(combo);
const title = comboTitle(combo, styleMeta.displayName, SCHEDULE_LABELS[combo.schedule]);
---

<a
  href={`/recipes/${slug}/`}
  class="card block p-6 hover:shadow-md transition-all"
  data-style={combo.style}
  data-hydration={combo.hydration}
  data-schedule={combo.schedule}
>
  <div class="flex items-center gap-3 mb-3">
    <span class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium">
      Recipe
    </span>
    <span class="text-xs text-[var(--crust-brown)]">
      {meta.totalTimeLabel}
    </span>
  </div>
  <h3 class="font-display text-xl mb-2 leading-snug">{title}</h3>
  <p class="text-[var(--crust-brown)] text-sm leading-relaxed mb-3">
    {styleMeta.cuisine} style · {meta.difficulty === 1 ? 'Beginner' : meta.difficulty === 2 ? 'Intermediate' : 'Advanced'}
  </p>
  <p class="text-xs text-[var(--crust-brown)]">{combo.hydration}% hydration</p>
</a>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeCard.astro
git commit -m "Add RecipeCard component for grids and related sections"
```

---

### Task 10: RecipeLayout

**Files:**
- Create: `src/layouts/RecipeLayout.astro`

- [ ] **Step 1: Create `src/layouts/RecipeLayout.astro`**

```astro
---
import Layout from './Layout.astro';
import AdUnit from '../components/AdUnit.astro';
import ArticleCard from '../components/ArticleCard.astro';
import RecipeCard from '../components/RecipeCard.astro';
import RecipeStatBlock from '../components/RecipeStatBlock.astro';
import RecipeIngredients from '../components/RecipeIngredients.astro';
import RecipeSchedule from '../components/RecipeSchedule.astro';
import { AD_SLOTS, ADSENSE_CLIENT } from '../config/ads';
import type { Combo } from '../data/recipes';
import { STYLE_META, allCombos } from '../data/recipes';
import type { Ingredient, ScheduleStep, MethodStep, RecipeMeta } from '../lib/recipe-formula';
import { recipeMeta as computeMeta } from '../lib/recipe-formula';
import { comboToSlug, comboTitle, SCHEDULE_LABELS } from '../lib/recipe-slug';
import { getCollection } from 'astro:content';

interface Props {
  combo: Combo;
  ingredients: Ingredient[];
  schedule: ScheduleStep[];
  method: MethodStep[];
  meta: RecipeMeta;
  intro: string;
  hydrationFraming: string;
  scheduleFraming: string;
  resultDescriptor: string;
  styleTweak: string;
}

const { combo, ingredients, schedule, method, meta, intro, hydrationFraming, scheduleFraming, resultDescriptor, styleTweak } = Astro.props;

const styleMeta = STYLE_META[combo.style];
const scheduleLabel = SCHEDULE_LABELS[combo.schedule];
const title = comboTitle(combo, styleMeta.displayName, scheduleLabel);
const description = `${intro.split('. ')[0]}.`;

// Calculator deep-link
const calcStyleParam = combo.style === 'no-knead' ? 'noknead' : combo.style === 'country-loaf' ? 'custom' : combo.style;
const calculatorHref = `/?style=${calcStyleParam}&hydration=${combo.hydration}#calculator`;

// Related recipes: same style different schedule, same schedule different style, same style different hydration.
const all = allCombos();
const sameStyleDiffSched = all.find(
  (x) => x.style === combo.style && x.schedule !== combo.schedule && x.hydration === combo.hydration,
);
const sameSchedDiffStyle = all.find(
  (x) => x.schedule === combo.schedule && x.style !== combo.style && x.hydration === combo.hydration,
);
const sameStyleDiffHyd = all.find(
  (x) => x.style === combo.style && x.hydration !== combo.hydration && x.schedule === combo.schedule,
);
const relatedCombos = [sameStyleDiffSched, sameSchedDiffStyle, sameStyleDiffHyd].filter((x): x is Combo => Boolean(x));
const relatedMetas: RecipeMeta[] = relatedCombos.map((c) => computeMeta(c));

// Related articles
type AnyArticle = Awaited<ReturnType<typeof getCollection>>[number];
const stylesArticles = await getCollection('styles');
const fundamentalsArticles = await getCollection('fundamentals');
const relatedArticleSlugs = styleMeta.relatedArticles;
const relatedArticles: AnyArticle[] = stylesArticles.filter((a) => relatedArticleSlugs.includes(a.slug));
// Pad with general fundamentals if we don't have enough style-specific articles.
if (relatedArticles.length < 2) {
  const padding = fundamentalsArticles
    .filter((a) => ['bakers-percentages-explained', 'hydration-60-to-90', 'what-fermentation-actually-does'].includes(a.slug))
    .slice(0, 2 - relatedArticles.length);
  relatedArticles.push(...padding);
}
const relatedArticleWordCounts = relatedArticles.map((a) => a.body.trim().split(/\s+/).length);

// JSON-LD
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thedoughformula.com/' },
    { '@type': 'ListItem', position: 2, name: 'Recipes', item: 'https://thedoughformula.com/recipes/' },
    { '@type': 'ListItem', position: 3, name: title, item: `https://thedoughformula.com/recipes/${comboToSlug(combo)}/` },
  ],
};

const recipeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: title,
  description,
  image: 'https://thedoughformula.com/og-image.jpg',
  recipeIngredient: ingredients.map((i) => `${i.grams} g ${i.name}`),
  recipeInstructions: method.map((s) => ({ '@type': 'HowToStep', text: s.text })),
  totalTime: meta.totalTimeISO,
  prepTime: meta.activeTimeISO,
  cookTime: `PT${styleMeta.bakeMinutes}M`,
  recipeYield: '1 loaf, ~900g baked',
  recipeCategory: 'Bread',
  recipeCuisine: styleMeta.cuisine,
  keywords: `${styleMeta.displayName.toLowerCase()}, ${combo.hydration}% hydration, ${combo.schedule} schedule`,
};

// Compose the body for the word-count floor check (~250 word minimum).
const bodyWords = (intro + ' ' + hydrationFraming + ' ' + scheduleFraming + ' ' + resultDescriptor + ' ' + styleTweak)
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;
if (bodyWords < 250) {
  throw new Error(`Recipe page ${comboToSlug(combo)} has only ${bodyWords} words of unique prose (minimum 250). Expand variant copy.`);
}
---

<Layout title={`${title} Recipe | The Dough Formula`} description={description}>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(breadcrumbJsonLd)} />
    <script type="application/ld+json" set:html={JSON.stringify(recipeJsonLd)} />
  </Fragment>

  <main id="main-content" class="py-10 md:py-16">
    <article class="container">
      <nav aria-label="Breadcrumb" class="text-sm text-[var(--crust-brown)] mb-8 max-w-3xl mx-auto">
        <a href="/" class="hover:text-[var(--espresso)]">Home</a>
        <span class="mx-2">/</span>
        <a href="/recipes/" class="hover:text-[var(--espresso)]">Recipes</a>
        <span class="mx-2">/</span>
        <span class="text-[var(--espresso)]">{title}</span>
      </nav>

      <header class="max-w-3xl mx-auto mb-8">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">
          Recipe · {styleMeta.displayName} · {scheduleLabel}
        </p>
        <h1 class="font-display text-4xl md:text-5xl leading-tight mb-5">
          {title}
        </h1>
        <p class="font-editorial text-lg text-[var(--crust-brown)] leading-relaxed">
          {intro}
        </p>
      </header>

      <div class="prose">
        <RecipeStatBlock meta={meta} hydrationPercent={combo.hydration} />

        <p>{hydrationFraming}</p>
        <p>{scheduleFraming}</p>

        <RecipeIngredients ingredients={ingredients} />
        <RecipeSchedule schedule={schedule} />

        <h2>Method tips for this style</h2>
        <p>{styleTweak}</p>

        <h2>What to expect</h2>
        <p>{resultDescriptor}</p>
      </div>

      <div class="max-w-3xl mx-auto my-10 text-center">
        <a href={calculatorHref} class="btn btn-primary inline-block">
          Open in calculator with these settings
        </a>
      </div>

      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>

      {relatedCombos.length > 0 && (
        <section class="mt-20 max-w-5xl mx-auto">
          <h2 class="font-display text-2xl md:text-3xl mb-6 text-center">More Recipes</h2>
          <div class="grid md:grid-cols-3 gap-4">
            {relatedCombos.map((c, i) => (
              <RecipeCard combo={c} meta={relatedMetas[i]} />
            ))}
          </div>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section class="mt-16 max-w-5xl mx-auto">
          <h2 class="font-display text-2xl md:text-3xl mb-6 text-center">Related Guides</h2>
          <div class="grid md:grid-cols-3 gap-4">
            {relatedArticles.map((a, i) => (
              <ArticleCard article={a as any} readingMinutes={Math.max(1, Math.ceil(relatedArticleWordCounts[i] / 200))} />
            ))}
          </div>
        </section>
      )}
    </article>
  </main>

  <script define:vars={{ midSlot: AD_SLOTS.articleMid, client: ADSENSE_CLIENT }}>
    (function () {
      if (!midSlot) return;
      const prose = document.querySelector('.prose');
      if (!prose) return;
      const firstH2 = prose.querySelector('h2');
      if (!firstH2) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'ad-slot my-12 mx-auto';
      wrapper.setAttribute('data-nosnippet', '');
      wrapper.style.minHeight = '260px';

      const label = document.createElement('p');
      label.className = 'text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3';
      label.textContent = 'Advertisement';
      wrapper.appendChild(label);

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', midSlot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      wrapper.appendChild(ins);

      firstH2.before(wrapper);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    })();
  </script>
</Layout>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds (the layout is not yet consumed by any route, so the import-only build passes).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/RecipeLayout.astro
git commit -m "Add RecipeLayout combining components with AdSense and JSON-LD"
```

---

## Phase 3 — Pages

### Task 11: Dynamic recipe route

**Files:**
- Create: `src/pages/recipes/[slug].astro`

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p src/pages/recipes
```

Create `src/pages/recipes/[slug].astro` with:

```astro
---
import RecipeLayout from '../../layouts/RecipeLayout.astro';
import { allCombos } from '../../data/recipes';
import { comboToSlug } from '../../lib/recipe-slug';
import { computeIngredients, computeSchedule, composeMethod, recipeMeta } from '../../lib/recipe-formula';
import { pickVariant } from '../../lib/recipe-copy-pick';
import {
  styleIntros,
  hydrationFraming,
  scheduleFraming,
  styleMethodTweaks,
  selectResultDescriptor,
} from '../../data/recipe-copy';

export async function getStaticPaths() {
  const combos = allCombos();
  // Slug uniqueness assertion at build time
  const slugs = new Set<string>();
  for (const c of combos) {
    const slug = comboToSlug(c);
    if (slugs.has(slug)) {
      throw new Error(`Duplicate slug generated: ${slug}`);
    }
    slugs.add(slug);
  }
  return combos.map((combo) => ({
    params: { slug: comboToSlug(combo) },
    props: { combo },
  }));
}

const { combo } = Astro.props;

const ingredients = computeIngredients(combo);
const schedule = computeSchedule(combo);
const method = composeMethod(combo);
const meta = recipeMeta(combo);

const intro = pickVariant(styleIntros[combo.style], combo);
const hydFrame = pickVariant(hydrationFraming[combo.hydration], combo);
const schedFrame = pickVariant(scheduleFraming[combo.schedule], combo);
const styleTweak = styleMethodTweaks[combo.style];
const resultDescriptor = selectResultDescriptor(combo);
---

<RecipeLayout
  combo={combo}
  ingredients={ingredients}
  schedule={schedule}
  method={method}
  meta={meta}
  intro={intro}
  hydrationFraming={hydFrame}
  scheduleFraming={schedFrame}
  resultDescriptor={resultDescriptor}
  styleTweak={styleTweak}
/>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds. The build output should now include lines like `▶ src/pages/recipes/[slug].astro` followed by ~58 generated `index.html` files under `dist/recipes/`.

- [ ] **Step 3: Verify the recipe pages were generated**

```bash
ls dist/recipes | head -20
ls dist/recipes | wc -l
```
Expected: ~58 directories (one per combo). Each directory contains an `index.html`.

- [ ] **Step 4: Verify a sample page has expected content**

```bash
grep -c '@type":"Recipe"' dist/recipes/sourdough-75-overnight/index.html
grep -c 'class="adsbygoogle"' dist/recipes/sourdough-75-overnight/index.html
grep -c 'Open in calculator' dist/recipes/sourdough-75-overnight/index.html
```
Expected: 1, 1, 1 respectively (Recipe schema present, end-of-recipe ad rendered, calculator CTA present).

- [ ] **Step 5: Commit**

```bash
git add src/pages/recipes/[slug].astro
git commit -m "Generate recipe pages from combo matrix"
```

---

### Task 12: Recipes hub with filterable grid

**Files:**
- Create: `src/pages/recipes/index.astro`

- [ ] **Step 1: Create `src/pages/recipes/index.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import RecipeCard from '../../components/RecipeCard.astro';
import AdUnit from '../../components/AdUnit.astro';
import { AD_SLOTS } from '../../config/ads';
import { allCombos, STYLES, HYDRATIONS, SCHEDULES, STYLE_META } from '../../data/recipes';
import { recipeMeta } from '../../lib/recipe-formula';
import { SCHEDULE_LABELS } from '../../lib/recipe-slug';

const combos = allCombos();
const combosWithMeta = combos.map((c) => ({ combo: c, meta: recipeMeta(c) }));
---

<Layout
  title="Bread Recipes | The Dough Formula"
  description="Filterable bread recipes by style, hydration, and schedule. Each recipe links to the live baker's percentage calculator."
>
  <main id="main-content" class="py-16">
    <div class="container">
      <header class="text-center mb-14 max-w-2xl mx-auto">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">
          The Dough Formula Recipes
        </p>
        <h1 class="font-display text-4xl md:text-5xl mb-5">Bread Recipes</h1>
        <p class="text-[var(--crust-brown)] leading-relaxed">
          Pick a bread style, a hydration level, and a schedule. Every recipe shows real gram weights, a real timeline, and a button to open the live calculator with these settings preloaded.
        </p>
      </header>

      <div class="max-w-6xl mx-auto mb-10">
        <div class="flex flex-wrap gap-6 items-start text-sm">
          <fieldset class="space-y-2">
            <legend class="font-medium text-[var(--accent-gold)] uppercase tracking-wider text-xs mb-2">Style</legend>
            {STYLES.map((s) => (
              <label class="flex items-center gap-2 mr-4">
                <input type="checkbox" class="filter-input" data-filter-style={s} />
                <span>{STYLE_META[s].displayName}</span>
              </label>
            ))}
          </fieldset>
          <fieldset class="space-y-2">
            <legend class="font-medium text-[var(--accent-gold)] uppercase tracking-wider text-xs mb-2">Hydration</legend>
            {HYDRATIONS.map((h) => (
              <label class="flex items-center gap-2 mr-4">
                <input type="checkbox" class="filter-input" data-filter-hydration={h} />
                <span>{h}%</span>
              </label>
            ))}
          </fieldset>
          <fieldset class="space-y-2">
            <legend class="font-medium text-[var(--accent-gold)] uppercase tracking-wider text-xs mb-2">Schedule</legend>
            {SCHEDULES.map((s) => (
              <label class="flex items-center gap-2 mr-4">
                <input type="checkbox" class="filter-input" data-filter-schedule={s} />
                <span>{SCHEDULE_LABELS[s]}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <div id="recipe-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {combosWithMeta.map(({ combo, meta }, i) => {
          return [
            <RecipeCard combo={combo} meta={meta} />,
            i === 2 && combosWithMeta.length >= 4 ? (
              <AdUnit slot={AD_SLOTS.categoryInFeed} class="card !p-6 !my-0" minHeight="200px" />
            ) : null,
          ];
        })}
      </div>
    </div>
  </main>

  <script is:inline>
    (() => {
      const grid = document.getElementById('recipe-grid');
      if (!grid) return;
      const inputs = document.querySelectorAll('.filter-input');
      function apply() {
        const styleSel = new Set(Array.from(document.querySelectorAll('[data-filter-style]:checked')).map((el) => el.dataset.filterStyle));
        const hydSel = new Set(Array.from(document.querySelectorAll('[data-filter-hydration]:checked')).map((el) => el.dataset.filterHydration));
        const schedSel = new Set(Array.from(document.querySelectorAll('[data-filter-schedule]:checked')).map((el) => el.dataset.filterSchedule));
        const cards = grid.querySelectorAll('a.card');
        cards.forEach((card) => {
          const s = card.dataset.style;
          const h = card.dataset.hydration;
          const sc = card.dataset.schedule;
          const visible =
            (styleSel.size === 0 || styleSel.has(s)) &&
            (hydSel.size === 0 || hydSel.has(h)) &&
            (schedSel.size === 0 || schedSel.has(sc));
          card.style.display = visible ? '' : 'none';
        });
      }
      inputs.forEach((i) => i.addEventListener('change', apply));
    })();
  </script>
</Layout>
```

- [ ] **Step 2: Build to verify**

Run:
```bash
npm run build
```
Expected: build succeeds. New page `/recipes/index.html` should exist in `dist/`.

- [ ] **Step 3: Verify the hub renders cards and the in-feed ad**

```bash
grep -c 'a class="card block p-6"' dist/recipes/index.html
grep -c 'class="ad-slot' dist/recipes/index.html
```
Expected: ~58 article-card matches, 1 ad-slot match.

- [ ] **Step 4: Commit**

```bash
git add src/pages/recipes/index.astro
git commit -m "Add recipes hub with filterable grid"
```

---

### Task 13: Calculator URL-param parsing

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Locate the calculator init script**

Run:
```bash
grep -n "selectStyle\|breadStyles\|currentStyle\|init" src/pages/index.astro | head -30
```

Identify the JS block that initializes the calculator and selects the default bread style. The relevant function is whatever sets the initial bread-style state on page load.

- [ ] **Step 2: Add URL-param parsing at the start of the calculator init**

In `src/pages/index.astro`, find the `<script is:inline>` block (or similar) that initializes the calculator. Inside that block, near the top of the IIFE/init function, add:

```js
const params = new URLSearchParams(window.location.search);
const styleParam = params.get('style');
const hydParam = params.get('hydration');
let initialStyleId = 'sourdough';
if (styleParam) {
  // Map URL-friendly slugs to the calculator's internal IDs.
  const map = {
    'sourdough': 'sourdough',
    'baguette': 'baguette',
    'focaccia': 'focaccia',
    'sandwich': 'sandwich',
    'ciabatta': 'ciabatta',
    'brioche': 'brioche',
    'no-knead': 'noknead',
    'noknead': 'noknead',
    'country-loaf': 'custom',
    'custom': 'custom',
  };
  if (map[styleParam]) initialStyleId = map[styleParam];
}
let initialHydration = null;
if (hydParam) {
  const h = parseInt(hydParam, 10);
  if (!isNaN(h) && h >= 50 && h <= 95) initialHydration = h;
}
```

Then where the calculator picks its default style (the existing code that sets the initial preset), replace that defaulting line so it uses `initialStyleId`. Where the calculator sets the initial hydration value, add a check: if `initialHydration !== null`, use that value.

The exact lines to modify depend on the current calculator's code structure. The implementer must find the specific lines and integrate the parsing without breaking existing behavior. **If the current code does not have a clear initial-style-id line, add the URL-param parsing as a top-of-script block and emit a `console.log` so the implementer can verify the values are read correctly without breaking the calculator.** A failure mode of "URL param ignored, calculator opens with default" is acceptable — a failure mode of "calculator broken" is not.

- [ ] **Step 3: Build and verify the calculator still works**

Run:
```bash
npm run build && npm run preview
```

In the preview browser:
1. Load the homepage. Calculator should function exactly as before (default bread style, default hydration).
2. Load `http://localhost:4321/?style=focaccia&hydration=82#calculator`. Calculator should open with focaccia preselected and hydration at 82%.
3. Load `http://localhost:4321/?style=invalid-style`. Calculator should fall back to default sourdough (no error in console).

If any of these fail, investigate before continuing. The acceptance criterion is "calculator unbroken; URL params apply when valid; ignored when invalid."

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Read style and hydration URL params on calculator init"
```

---

## Phase 4 — Cross-linking

### Task 14: Add Recipes to nav and footer

**Files:**
- Modify: `src/components/SiteNav.astro`
- Modify: `src/components/SiteFooter.astro`

- [ ] **Step 1: Update SiteNav.astro**

In `src/components/SiteNav.astro`, locate the desktop nav block:

```astro
    <div class="hidden md:flex items-center gap-8">
      <a href="/guides/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">Guides</a>
      <a href="/about/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">About</a>
```

Insert a `Recipes` link between `Guides` and `About`:

```astro
    <div class="hidden md:flex items-center gap-8">
      <a href="/guides/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">Guides</a>
      <a href="/recipes/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">Recipes</a>
      <a href="/about/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">About</a>
```

Also locate the mobile nav block:

```astro
    <div class="container flex flex-col py-4 gap-4">
      <a href="/guides/" class="py-2">Guides</a>
      <a href="/about/" class="py-2">About</a>
      <a href="/contact/" class="py-2">Contact</a>
```

Insert `Recipes`:

```astro
    <div class="container flex flex-col py-4 gap-4">
      <a href="/guides/" class="py-2">Guides</a>
      <a href="/recipes/" class="py-2">Recipes</a>
      <a href="/about/" class="py-2">About</a>
      <a href="/contact/" class="py-2">Contact</a>
```

- [ ] **Step 2: Update SiteFooter.astro**

In `src/components/SiteFooter.astro`, locate the "Guides" column:

```astro
      <div>
        <h3 class="text-xs uppercase tracking-[0.2em] font-medium mb-4 text-[var(--accent-gold)]">Guides</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/fundamentals/" class="hover:text-[var(--accent-gold)]">Fundamentals</a></li>
          <li><a href="/techniques/" class="hover:text-[var(--accent-gold)]">Techniques</a></li>
          <li><a href="/ingredients/" class="hover:text-[var(--accent-gold)]">Ingredients</a></li>
          <li><a href="/styles/" class="hover:text-[var(--accent-gold)]">Bread Styles</a></li>
          <li><a href="/troubleshooting/" class="hover:text-[var(--accent-gold)]">Troubleshooting</a></li>
        </ul>
      </div>
```

Add a `<li>` for `Recipes` at the bottom of the list:

```astro
          <li><a href="/troubleshooting/" class="hover:text-[var(--accent-gold)]">Troubleshooting</a></li>
          <li><a href="/recipes/" class="hover:text-[var(--accent-gold)]">Recipes</a></li>
        </ul>
      </div>
```

- [ ] **Step 3: Build and verify**

Run:
```bash
npm run build
grep -c 'href="/recipes/"' dist/index.html
```
Expected: at least 2 matches (one in nav, one in footer).

- [ ] **Step 4: Commit**

```bash
git add src/components/SiteNav.astro src/components/SiteFooter.astro
git commit -m "Add Recipes link to nav and footer"
```

---

### Task 15: Article-side "Related recipes" section

**Files:**
- Modify: `src/layouts/ArticleLayout.astro`

- [ ] **Step 1: Add related-recipes mapping helper**

Open `src/layouts/ArticleLayout.astro`. After the existing imports in the frontmatter, add an import and a small helper:

```astro
import RecipeCard from '../components/RecipeCard.astro';
import { allCombos } from '../data/recipes';
import { recipeMeta as computeRecipeMeta } from '../lib/recipe-formula';

// Map article slugs to (style, hydration, schedule) tuples that should appear as "related recipes".
// Two combos per mapped article. Articles not in the map get an empty list (no Related Recipes section rendered).
const ARTICLE_TO_RECIPES: Record<string, Array<{ style: string; hydration: number; schedule: string }>> = {
  'sourdough-for-beginners': [
    { style: 'sourdough', hydration: 75, schedule: 'overnight' },
    { style: 'sourdough', hydration: 65, schedule: 'overnight' },
  ],
  'classic-french-baguette': [
    { style: 'baguette', hydration: 65, schedule: 'overnight' },
    { style: 'baguette', hydration: 75, schedule: 'overnight' },
  ],
  'ciabatta-explained': [
    { style: 'ciabatta', hydration: 82, schedule: 'overnight' },
    { style: 'ciabatta', hydration: 75, schedule: 'overnight' },
  ],
  'country-loaf-pain-de-campagne': [
    { style: 'country-loaf', hydration: 75, schedule: 'overnight' },
    { style: 'country-loaf', hydration: 82, schedule: 'slow' },
  ],
  'high-hydration-focaccia': [
    { style: 'focaccia', hydration: 82, schedule: 'overnight' },
    { style: 'focaccia', hydration: 75, schedule: 'same-day' },
  ],
  'bakers-percentages-explained': [
    { style: 'sourdough', hydration: 75, schedule: 'overnight' },
    { style: 'baguette', hydration: 65, schedule: 'overnight' },
  ],
  'hydration-60-to-90': [
    { style: 'sourdough', hydration: 65, schedule: 'overnight' },
    { style: 'sourdough', hydration: 82, schedule: 'overnight' },
  ],
};

const relatedRecipeKeys = ARTICLE_TO_RECIPES[article.slug] ?? [];
const allCombosList = allCombos();
const relatedRecipes = relatedRecipeKeys
  .map((k) => allCombosList.find((c) => c.style === k.style && c.hydration === k.hydration && c.schedule === k.schedule))
  .filter((c): c is NonNullable<typeof c> => Boolean(c));
const relatedRecipeMetas = relatedRecipes.map((c) => computeRecipeMeta(c));
```

- [ ] **Step 2: Render the Related Recipes section between the prose and the AdUnit**

In the same file, locate the existing block:

```astro
      <div class="prose">
        <slot />
      </div>

      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>
```

Insert a `Related Recipes` section between the closing `</div>` of `.prose` and the AdUnit wrapper:

```astro
      <div class="prose">
        <slot />
      </div>

      {relatedRecipes.length > 0 && (
        <section class="mt-16 max-w-5xl mx-auto">
          <h2 class="font-display text-2xl md:text-3xl mb-6 text-center">Related Recipes</h2>
          <div class="grid md:grid-cols-2 gap-4">
            {relatedRecipes.map((c, i) => (
              <RecipeCard combo={c} meta={relatedRecipeMetas[i]} />
            ))}
          </div>
        </section>
      )}

      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>
```

- [ ] **Step 3: Build and verify**

Run:
```bash
npm run build
grep -c "Related Recipes" dist/styles/sourdough-for-beginners/index.html
grep -c "Related Recipes" dist/troubleshooting/flat-loaves-five-causes/index.html
```
Expected: 1 for sourdough-for-beginners (mapped), 0 for flat-loaves-five-causes (not mapped).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/ArticleLayout.astro
git commit -m "Add Related Recipes section to articles with mapped slugs"
```

---

### Task 16: Inline links from /styles/ articles to matching recipes

**Files:**
- Modify: `src/content/styles/sourdough-for-beginners.md`
- Modify: `src/content/styles/classic-french-baguette.md`
- Modify: `src/content/styles/ciabatta-explained.md`
- Modify: `src/content/styles/country-loaf-pain-de-campagne.md`
- Modify: `src/content/styles/high-hydration-focaccia.md`

For each of the five style articles, add an inline paragraph linking to the most relevant recipe page. The paragraph should be added near the END of the article body, before any final closing thoughts. The exact location within each article is left to the implementer's judgment, as long as it reads naturally in the article's flow.

Each article gets a paragraph following this pattern (substitute the actual recipe target):

> If you want a working recipe with real gram weights and a complete schedule, see the [recipe page for 75% hydration overnight sourdough](/recipes/sourdough-75-overnight/).

- [ ] **Step 1: Edit `src/content/styles/sourdough-for-beginners.md`**

Open the file. Find a natural place near the end of the article body (typically the last 1-2 paragraphs before any sign-off). Insert a new paragraph:

```markdown
For a working recipe with real gram weights and a complete schedule, see the [75% hydration overnight sourdough recipe](/recipes/sourdough-75-overnight/).
```

- [ ] **Step 2: Edit `src/content/styles/classic-french-baguette.md`**

Insert near the end:

```markdown
For a complete recipe with measured ingredients and timing, see the [65% hydration overnight baguette recipe](/recipes/baguette-65-overnight/).
```

- [ ] **Step 3: Edit `src/content/styles/ciabatta-explained.md`**

Insert near the end:

```markdown
For a measured recipe with real gram weights, see the [82% hydration overnight ciabatta recipe](/recipes/ciabatta-82-overnight/).
```

- [ ] **Step 4: Edit `src/content/styles/country-loaf-pain-de-campagne.md`**

Insert near the end:

```markdown
For a working recipe scaled to a 1kg dough, see the [75% hydration overnight country loaf recipe](/recipes/country-loaf-75-overnight/).
```

- [ ] **Step 5: Edit `src/content/styles/high-hydration-focaccia.md`**

Insert near the end:

```markdown
For a measured recipe with timing and gram weights, see the [82% hydration overnight focaccia recipe](/recipes/focaccia-82-overnight/).
```

- [ ] **Step 6: Build and verify the links land in the rendered HTML**

Run:
```bash
npm run build
grep -c '/recipes/sourdough-75-overnight/' dist/styles/sourdough-for-beginners/index.html
grep -c '/recipes/baguette-65-overnight/' dist/styles/classic-french-baguette/index.html
grep -c '/recipes/ciabatta-82-overnight/' dist/styles/ciabatta-explained/index.html
grep -c '/recipes/country-loaf-75-overnight/' dist/styles/country-loaf-pain-de-campagne/index.html
grep -c '/recipes/focaccia-82-overnight/' dist/styles/high-hydration-focaccia/index.html
```
Expected: each returns at least 1.

- [ ] **Step 7: Commit**

```bash
git add src/content/styles/sourdough-for-beginners.md src/content/styles/classic-french-baguette.md src/content/styles/ciabatta-explained.md src/content/styles/country-loaf-pain-de-campagne.md src/content/styles/high-hydration-focaccia.md
git commit -m "Link style articles to their matching recipe pages"
```

---

## Phase 5 — Verification

### Task 17: Final verification, manual spot-check, and deployment

**Files:** none modified — this is a verification gate.

- [ ] **Step 1: Clean build**

```bash
rm -rf dist && npm run build
```
Expected: build succeeds. Page count should be ~91 (32 from before + ~58 new recipe pages + 1 recipes hub = ~91).

- [ ] **Step 2: Verify all generated recipe pages exist**

```bash
ls dist/recipes | wc -l
```
Expected: ~58-59 (one directory per combo, plus the `index.html` for the hub if it lands in the same listing). Confirm the count matches the size of `allCombos()` from `src/data/recipes.ts`.

- [ ] **Step 3: Verify each page passes the word-count floor**

The build will throw if any page has fewer than 250 words of unique prose. If the build succeeded in Step 1, this passed.

- [ ] **Step 4: Verify schema markup on a representative page**

```bash
grep -A 50 '"@type":"Recipe"' dist/recipes/sourdough-75-overnight/index.html | head -60
```
Expected: a complete Recipe JSON-LD block with `name`, `description`, `recipeIngredient`, `recipeInstructions`, `totalTime`, `recipeYield`, etc.

- [ ] **Step 5: Verify navigation includes Recipes**

```bash
grep -c 'href="/recipes/"' dist/index.html
```
Expected: at least 2 (nav + footer).

- [ ] **Step 6: Verify article-side related recipes**

```bash
grep -c "Related Recipes" dist/styles/sourdough-for-beginners/index.html
grep -c "Related Recipes" dist/about/index.html
```
Expected: 1 for sourdough-for-beginners (in mapping), 0 for about (not an article).

- [ ] **Step 7: Verify article inline links**

```bash
grep -c '/recipes/' dist/styles/sourdough-for-beginners/index.html
```
Expected: at least 1 (likely 3-5: inline link + Related Recipes cards + nav/footer).

- [ ] **Step 8: Manual browser walkthrough**

```bash
npm run preview
```

Open the preview URL and walk through:

1. **Recipes hub (`/recipes/`):** ~58 cards visible. Filters work — tick "Sourdough", grid filters to sourdough recipes only. Tick "82" hydration, filters further. Untick all, all cards return.
2. **A representative recipe (e.g., `/recipes/sourdough-75-overnight/`):**
   - Page renders with the variant intro paragraph, hydration framing, schedule framing, ingredients table with real grams, schedule timeline, method tweaks, what-to-expect.
   - Stat block shows total time, active time, hydration, difficulty.
   - "Open in calculator" button is present.
   - Mid-content + end-of-content AdSense slots render (placeholders or real ads depending on AdSense fill).
   - Related Recipes section shows 2-3 sibling combos.
   - Related Guides section shows 2-3 article cards.
3. **Click "Open in calculator":** lands on homepage with calculator preselected to sourdough at 75% hydration. Verify calculator opens with the correct preset.
4. **Sourdough article (`/styles/sourdough-for-beginners/`):**
   - Article renders normally.
   - Near the end of the body, the inline link to the recipe is present and reads naturally.
   - Below the article body, before "Keep Reading", the new "Related Recipes" section shows 2 recipe cards.
5. **An unrelated article (`/troubleshooting/flat-loaves-five-causes/`):**
   - No "Related Recipes" section (article slug not in the mapping).
   - All other sections render normally.
6. **Calculator default behavior:**
   - Loading `/` with no query params: calculator opens with its default style (sourdough). Unchanged from baseline.
   - Loading `/?style=invalid-style`: falls back to default. No console errors.
7. **Hard-bans spot-check:** Read the rendered prose on 5 different recipe pages. Confirm no banned phrases appear.

Stop the preview server when done.

- [ ] **Step 9: Confirm no uncommitted changes**

```bash
git status
```
Expected: clean working tree (besides `.claude/settings.local.json` which is unrelated to this work).

- [ ] **Step 10: Lighthouse spot-check (optional but recommended)**

Run Lighthouse against one representative recipe page (`/recipes/sourdough-75-overnight/`) on mobile. Compare top metrics to an article page baseline:
- LCP should be in the same ballpark as `/troubleshooting/flat-loaves-five-causes/` (within ±10%).
- CLS should be ≤ 0.1.

If LCP is significantly worse on recipe pages than article pages, investigate before deploying. Most likely cause would be the larger-than-expected page size from the schedule + ingredients tables; if so, consider deferring some content or breaking the timeline into a collapsed-by-default block.

- [ ] **Step 11: Merge to main and push**

If on a feature branch / worktree:

```bash
git checkout main
git pull --ff-only
git merge --no-ff <feature-branch> -m "Merge programmatic-recipe-pages: ~58 recipes from style x hydration x schedule matrix"
npm run build
git push
```

(If the implementation was done directly on main, just push.)

The site auto-deploys on push. Verify after deploy:
1. `https://thedoughformula.com/recipes/` loads.
2. `https://thedoughformula.com/recipes/sourdough-75-overnight/` loads.
3. AdSense slots fill on the new recipe pages within 24 hours of deploy.
4. Google Search Console (within 48 hours of deploy) shows the new pages being crawled.

---

## Self-Review Notes

**Spec coverage:**

- Matrix definition + skip list + 8 styles → Task 1 ✓
- Slug ↔ combo conversion → Task 2 ✓
- Deterministic variant selection → Task 3 ✓
- Recipe formula (ingredients, schedule, method, meta) → Task 4 ✓
- Variant copy library (~50 paragraphs, hard-bans applied) → Task 5 ✓
- Components (StatBlock, Ingredients, Schedule, Card) → Tasks 6-9 ✓
- RecipeLayout assembly + JSON-LD + AdSense slots → Task 10 ✓
- Dynamic route generating ~58 pages → Task 11 ✓
- Recipes hub with filterable grid → Task 12 ✓
- Calculator URL-param integration → Task 13 ✓
- Nav + footer Recipes link → Task 14 ✓
- Article-side Related Recipes → Task 15 ✓
- Inline links from /styles/ articles → Task 16 ✓
- Final verification + manual spot-check + deploy → Task 17 ✓
- Word-count floor enforcement → built into RecipeLayout (Task 10), runs at every recipe build
- Slug uniqueness assertion → built into `[slug].astro` (Task 11)
- Related-articles fallback for styles without articles → built into RecipeLayout (Task 10)

**Placeholder scan:** No "TBD" / "implement later" references. The Task 13 calculator integration has a partial freedom in "where exactly to insert the URL-param parse" because the existing calculator's exact init structure is not enumerated in this plan; the implementer must inspect and decide. The plan provides the exact JS code to insert and the failure-mode contract ("calculator works, params apply when valid"), so this is judgment within bounded acceptance criteria, not a placeholder.

**Type consistency:**
- `Combo`, `Style`, `Hydration`, `Schedule` defined in Task 1, used consistently in all subsequent tasks.
- `Ingredient`, `ScheduleStep`, `MethodStep`, `RecipeMeta` defined in Task 4, used in Tasks 6-11.
- `comboToSlug`, `slugToCombo`, `comboTitle`, `SCHEDULE_LABELS` defined in Task 2, used in Tasks 9, 10, 11, 12.
- `pickVariant`, `comboKey` defined in Task 3, used in Task 11.
- `styleIntros`, `hydrationFraming`, `scheduleFraming`, `styleMethodTweaks`, `selectResultDescriptor` defined in Task 5, used in Task 11.
- `STYLE_META`, `allCombos`, `STYLES`, `HYDRATIONS`, `SCHEDULES`, `isSkipped` defined in Task 1, used in Tasks 4, 9, 10, 11, 12.
- `AD_SLOTS`, `ADSENSE_CLIENT` (existing) imported in Task 10 and Task 12.
- `AdUnit` (existing component) imported in Task 10 and Task 12.

All names match across tasks.
