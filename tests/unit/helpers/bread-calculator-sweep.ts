// The sweep behind tests/unit/bread-calculator-sweep.test.ts: every bread style crossed with
// hydration, whole grain, yeast type and amount, starter hydration, preferment type and amount,
// enrichments, and batch size. Each case is printed through the calculator's own code (see
// ./bread-calculator) and checked in grams and in ounces.
import {
  BREAD_STYLES,
  ENRICHMENT_WATER_CONTENT,
  applyStyle,
  convertToOz,
  createDefaultEnrichments,
  createDefaultState,
  formatPrefermentWeight,
  formatWeight,
  yieldText,
  type EnrichmentState,
  type PrefermentType,
  type RecipeState,
  type YeastType,
} from '../../../src/lib/bread-calculator';
import { printed, type Printed } from './bread-calculator';

export interface SweepCase {
  /** The inputs in words. Built only when a violation is kept as an example. */
  label: () => string;
  state: RecipeState;
  enrichments: EnrichmentState;
}

type Yeast = { type: YeastType; percent: number; starterHydration?: number } | 'style';

/** The style's own basics, the two ends of the hydration slider, and the top of the whole grain slider. */
const BASICS: Array<{ hydration?: number; wholeGrain?: number }> = [{}, { hydration: 55 }, { hydration: 90 }, { wholeGrain: 50 }];
const YEASTS: Yeast[] = [
  'style',
  ...[10, 20, 40].flatMap((percent) => [50, 100, 200].map((starterHydration) => ({ type: 'starter' as const, percent, starterHydration }))),
  ...[0.1, 1, 3].map((percent) => ({ type: 'instant' as const, percent })),
  ...[0.1, 1.25, 3].map((percent) => ({ type: 'active-dry' as const, percent })),
  ...[0.3, 3].map((percent) => ({ type: 'fresh' as const, percent })),
];
const PREFERMENTS: Array<{ type: PrefermentType; percent: number }> = [
  { type: 'none', percent: 20 },
  ...(['poolish', 'biga', 'pate-fermentee', 'levain'] as const).flatMap((type) => [15, 20, 40].map((percent) => ({ type, percent }))),
];
const SIZES: Array<[loaves: number, weight: number]> = [[1, 200], [1, 500], [2, 900], [3, 350], [12, 2000]];

function enrichmentSets(): Array<{ name: string; make: () => EnrichmentState }> {
  const set = (name: string, change: (e: EnrichmentState) => void) => ({
    name,
    make: () => {
      const e = createDefaultEnrichments();
      change(e);
      return e;
    },
  });
  return [
    set('none', () => {}),
    set('butter 5%', (e) => { e.fat = { enabled: true, type: 'butter', percent: 5 }; }),
    set('butter 25%', (e) => { e.fat = { enabled: true, type: 'butter', percent: 25 }; }),
    set('oil 5%', (e) => { e.fat = { enabled: true, type: 'oil', percent: 5 }; }),
    set('4 yolks', (e) => { e.eggs = { enabled: true, type: 'yolks', count: 4 }; }),
    set('milk 50% of liquid', (e) => { e.dairy = { enabled: true, type: 'whole-milk', percentOfLiquid: 50 }; }),
    set('cream 100% of liquid', (e) => { e.dairy = { enabled: true, type: 'cream', percentOfLiquid: 100 }; }),
    set('honey 20%', (e) => { e.sweet = { enabled: true, type: 'honey', percent: 20 }; }),
    set('butter 25% + 4 eggs + milk 50% + sugar 8%', (e) => {
      e.fat = { enabled: true, type: 'butter', percent: 25 };
      e.eggs = { enabled: true, type: 'whole', count: 4 };
      e.dairy = { enabled: true, type: 'whole-milk', percentOfLiquid: 50 };
      e.sweet = { enabled: true, type: 'sugar', percent: 8 };
    }),
  ];
}

/** How many cases sweepCases() yields. */
export const SWEEP_SIZE = BREAD_STYLES.length * BASICS.length * YEASTS.length * PREFERMENTS.length * SIZES.length * enrichmentSets().length;

export function* sweepCases(): Generator<SweepCase> {
  const enrich = enrichmentSets();
  for (const style of BREAD_STYLES) {
    for (const basics of BASICS) {
      for (const yeast of YEASTS) {
        for (const pref of PREFERMENTS) {
          for (const [numLoaves, loafWeight] of SIZES) {
            for (const en of enrich) {
              const state = createDefaultState();
              applyStyle(state, { ...style, style: style.id });
              if (basics.hydration !== undefined) state.hydration = basics.hydration;
              if (basics.wholeGrain !== undefined) state.wholeGrain = basics.wholeGrain;
              if (yeast !== 'style') {
                state.yeastType = yeast.type;
                state.yeastPercent = yeast.percent;
                if (yeast.starterHydration !== undefined) state.starterHydration = yeast.starterHydration;
              }
              state.prefermentType = pref.type;
              state.prefermentPercent = pref.percent;
              state.numLoaves = numLoaves;
              state.loafWeight = loafWeight;
              const label = () =>
                `${style.id}, ${numLoaves} x ${loafWeight} g, ${state.hydration}% hydration, ${state.wholeGrain}% whole grain, ${state.salt}% salt, ` +
                `${state.yeastType} ${state.yeastPercent}%${state.yeastType === 'starter' ? ` at ${state.starterHydration}%` : ''}, ` +
                `${pref.type === 'none' ? 'no preferment' : `${pref.type} ${pref.percent}%`}, enrichments: ${en.name}`;
              yield { label, state, enrichments: en.make() };
            }
          }
        }
      }
    }
  }
}

export interface Violation {
  case: string;
  detail: string;
}

/** Violations of one check, split into named groups so a test can say which groups are known. */
export class Tally {
  readonly groups = new Map<string, { count: number; examples: Violation[]; worst: number }>();
  /** `make` builds the example text; it is only called for the first few and for a new worst case. */
  add(group: string, make: () => Violation, size = 0): void {
    let g = this.groups.get(group);
    if (!g) {
      g = { count: 0, examples: [], worst: 0 };
      this.groups.set(group, g);
    }
    g.count++;
    if (Math.abs(size) > Math.abs(g.worst)) {
      g.worst = size;
      g.examples.unshift(make());
      g.examples.length = Math.min(g.examples.length, 3);
    } else if (g.examples.length < 3) {
      g.examples.push(make());
    }
  }
  count(group: string): number {
    return this.groups.get(group)?.count ?? 0;
  }
  /** A readable summary of every group, for assertion messages. */
  describe(): string {
    return [...this.groups.entries()]
      .map(([name, g]) => `${name}: ${g.count} case(s), e.g. ${g.examples[0].case} -> ${g.examples[0].detail}`)
      .join('\n');
  }
}

export interface SweepResult {
  cases: number;
  /** 1. Printed rows sum to the stated total within 2 g. */
  rowsSum: Tally;
  /** 2. Each printed percentage matches its grams divided by total flour. */
  percentages: Tally;
  /** 3. No negative, NaN, or blank values. */
  values: Tally;
  /** 4. Preferment flour and water are taken out of the main rows exactly once. */
  preferment: Tally;
  /** 5. Ounce values match the gram values. */
  ounces: Tally;
  /** 6. Effective hydration matches the water the enrichments are said to carry. */
  effectiveHydration: Tally;
}

const G_PER_OZ = 28.3495;
const BAD_TEXT = /NaN|Infinity|undefined|null/;
const flourRow = (name: string) => name.endsWith('Flour');
const ENRICHMENT_ROW = /^(Butter|Oil|Eggs|Egg Yolks|Egg Whites|Sugar|Honey|Maple|Malt)/;

function checkCase(c: SweepCase, p: Printed, out: SweepResult): void {
  const { recipe, rows, state, enrichments, preferment } = p;
  const prefGroup = preferment ? `with ${state.prefermentType}` : 'no preferment';
  const v = (detail: () => string) => () => ({ case: c.label(), detail: detail() });

  // 1. Rows sum to the stated total.
  const gap = p.rowsTotal - recipe.totalDough;
  if (Math.abs(gap) > 2) {
    const addsWeight = enrichments.fat.enabled || enrichments.eggs.enabled || enrichments.sweet.enabled;
    out.rowsSum.add(
      addsWeight ? 'butter, oil, eggs or sweetener on' : 'no weight-adding enrichment',
      v(() => `header says ${recipe.totalDough} g, rows add up to ${p.rowsTotal} g (${gap > 0 ? '+' : ''}${gap} g)`),
      gap,
    );
  }

  // 2. Each printed percentage matches grams / total flour.
  for (const r of rows) {
    if (r.percent < 0) continue;
    const isEgg = r.name.startsWith('Egg');
    const expectedGrams = (r.percent / 100) * recipe.flourWeight;
    const actualPercent = (r.weight / recipe.flourWeight) * 100;
    // Grams are printed whole, so half a gram of drift is rounding. Eggs come as a count, so
    // their percentage is the rounded one.
    const off = isEgg ? Math.abs(actualPercent - r.percent) > 0.51 : Math.abs(r.weight - expectedGrams) > 0.51;
    if (off) {
      const group = flourRow(r.name) || r.name === 'Water' ? `${r.name === 'Water' ? 'Water' : 'flour'} row, ${prefGroup}` : `${r.name} row`;
      out.percentages.add(
        group,
        v(() => `${r.name} prints ${r.weight} g (${r.percent}%), but ${r.weight} g of ${recipe.flourWeight} g flour is ${actualPercent.toFixed(1)}%`),
        actualPercent - r.percent,
      );
    }
    // A whole-gram row can still misstate a small amount badly.
    if (r.percent > 0 && expectedGrams > 0 && !ENRICHMENT_ROW.test(r.name) && !flourRow(r.name) && r.name !== 'Water') {
      const rel = (r.weight - expectedGrams) / expectedGrams;
      if (Math.abs(rel) > 0.1) {
        out.percentages.add(
          `small amount rounded to a whole gram (${r.name.includes('Yeast') ? 'yeast' : r.name})`,
          v(() => `${r.name} ${r.percent}% of ${recipe.flourWeight} g flour is ${expectedGrams.toFixed(2)} g, printed as ${r.weight} g (${rel > 0 ? '+' : ''}${Math.round(rel * 100)}%)`),
          rel,
        );
      }
    }
  }

  // 3. No negative, NaN or blank values.
  for (const r of rows) {
    const text = formatWeight(state, r.weight);
    if (!Number.isFinite(r.weight) || BAD_TEXT.test(text) || text === 'g' || text === 'oz') {
      out.values.add('not a number', v(() => `${r.name}: ${text}`));
    } else if (r.weight < 0) {
      out.values.add('negative', v(() => `${r.name}: ${text}`));
    } else if (r.weight === 0) {
      out.values.add(`prints 0 g (${r.name.includes('Yeast') ? 'yeast' : r.name})`, v(() => `${r.name}: ${text} (${r.percent}%)`));
    }
    if (!Number.isFinite(r.percent)) out.values.add('not a number', v(() => `${r.name} percent: ${r.percent}`));
  }
  for (const r of p.prefermentRows) {
    const text = formatPrefermentWeight(r.weight);
    if (!Number.isFinite(r.weight) || BAD_TEXT.test(text)) out.values.add('not a number', v(() => `preferment ${r.name}: ${text}`));
    else if (r.weight < 0) out.values.add('negative', v(() => `preferment ${r.name}: ${text}`));
    else if (r.weight === 0) out.values.add('preferment row prints 0 g', v(() => `preferment ${r.name}: ${text}`));
  }
  if (BAD_TEXT.test(yieldText(state, recipe))) out.values.add('not a number', v(() => yieldText(state, recipe)));
  if (!Number.isFinite(recipe.effectiveHydration)) out.values.add('not a number', v(() => `effective hydration ${recipe.effectiveHydration}`));

  // 4. Preferment flour and water come out of the main rows exactly once.
  let flourInRows = 0;
  let waterInRows = 0;
  for (const r of rows) {
    if (flourRow(r.name)) flourInRows += r.weight;
    else if (r.name === 'Water') waterInRows += r.weight;
  }
  if (preferment) {
    const prefRow = rows.find((r) => r.name.startsWith('All of the '))!;
    if (flourInRows + preferment.flour !== recipe.flourWeight || waterInRows + preferment.water !== recipe.waterWeight) {
      out.preferment.add(
        'flour or water not removed exactly once',
        v(() => `flour ${flourInRows} + ${preferment.flour} vs ${recipe.flourWeight}; water ${waterInRows} + ${preferment.water} vs ${recipe.waterWeight}`),
      );
    }
    if (prefRow.weight !== preferment.flour + preferment.water) {
      out.preferment.add('preferment row is not its flour plus water', v(() => `${prefRow.name} ${prefRow.weight} g`));
    }
    // What the preferment box tells the baker to mix, against the "All of the ..." row.
    const boxTotal = p.prefermentRows.reduce((s, r) => s + r.weight, 0);
    const extra = boxTotal - prefRow.weight;
    if (Math.abs(extra) > 2) {
      out.preferment.add(
        `${state.prefermentType} box weighs more than the "All of the" row`,
        v(() => `box lists ${p.prefermentRows.map((r) => `${r.name} ${formatPrefermentWeight(r.weight)}`).join(', ')} = ${Math.round(boxTotal)} g, row says ${prefRow.weight} g`),
        extra,
      );
    }
    const prefYeast = p.prefermentRows.find((r) => r.name === 'Instant Yeast');
    if (prefYeast && prefYeast.weight / preferment.flour > 0.02) {
      out.preferment.add(
        `${state.prefermentType} asks for instant yeast above 2% of its flour`,
        v(() => `preferment box: Instant Yeast ${formatPrefermentWeight(prefYeast.weight)} for ${preferment.flour} g flour (${((prefYeast.weight / preferment.flour) * 100).toFixed(0)}%)`),
        prefYeast.weight / preferment.flour,
      );
    }
  } else if (flourInRows !== recipe.flourWeight || waterInRows !== recipe.waterWeight) {
    out.preferment.add('rows differ from the recipe without a preferment', v(() => `flour ${flourInRows}/${recipe.flourWeight}, water ${waterInRows}/${recipe.waterWeight}`));
  }

  // 5. Ounce values match the gram values.
  const ozState: RecipeState = { ...state, unit: 'oz' };
  let ozSum = 0;
  for (const r of rows) {
    const text = formatWeight(ozState, r.weight);
    const oz = parseFloat(text);
    ozSum += oz;
    // A tenth of an ounce is the printed step, so 0.05 oz off is rounding (0.06 leaves room
    // for the 28.35 the page divides by).
    if (!text.endsWith('oz') || !Number.isFinite(oz) || Math.abs(oz * G_PER_OZ - r.weight) > 0.06 * G_PER_OZ) {
      out.ounces.add('ounce value is not the gram value converted', v(() => `${r.name}: ${r.weight} g printed as ${text}`));
    }
    if (r.weight > 0 && oz === 0) {
      out.ounces.add('prints 0.0oz for a real amount', v(() => `${r.name}: ${r.weight} g printed as ${text}`));
    } else if (r.weight > 0 && Math.abs(oz * G_PER_OZ - r.weight) / r.weight > 0.1) {
      out.ounces.add(
        'tenth of an ounce is too coarse (more than 10% off)',
        v(() => `${r.name}: ${r.weight} g printed as ${text} (${(oz * G_PER_OZ).toFixed(1)} g)`),
        (oz * G_PER_OZ - r.weight) / r.weight,
      );
    }
  }
  const totalOz = parseFloat(convertToOz(recipe.totalDough));
  const gramsGapInOz = (p.rowsTotal - recipe.totalDough) / G_PER_OZ;
  // Rows rounded to a tenth of an ounce each can drift from the total; more than half an
  // ounce beyond what the gram rows already miss by is worth a look.
  if (Math.abs(ozSum - totalOz - gramsGapInOz) > 0.5) {
    out.ounces.add('ounce rows drift from the ounce total', v(() => `rows add up to ${ozSum.toFixed(1)} oz, header says ${totalOz} oz`), ozSum - totalOz - gramsGapInOz);
  }

  // 6. Effective hydration, recomputed from the printed grams and the water shares the
  //    Enrichments tab states (butter 15%, whole eggs 75%, whole milk 87%, and so on).
  const anyEnrichment = enrichments.fat.enabled || enrichments.eggs.enabled || enrichments.dairy.enabled || enrichments.sweet.enabled;
  if (anyEnrichment) {
    let water = recipe.waterWeight;
    if (enrichments.fat.enabled) water += recipe.enrichments.fat * ENRICHMENT_WATER_CONTENT[enrichments.fat.type];
    if (enrichments.eggs.enabled) water += recipe.enrichments.eggs * ENRICHMENT_WATER_CONTENT[enrichments.eggs.type];
    if (enrichments.sweet.enabled) water += recipe.enrichments.sweet * ENRICHMENT_WATER_CONTENT[enrichments.sweet.type];
    if (enrichments.dairy.enabled) {
      const dairy = (recipe.waterWeight * enrichments.dairy.percentOfLiquid) / 100;
      water += dairy * ENRICHMENT_WATER_CONTENT[enrichments.dairy.type] - dairy;
    }
    const expected = (water / recipe.flourWeight) * 100;
    if (Math.abs(expected - recipe.effectiveHydration) > 1) {
      out.effectiveHydration.add(
        'does not match the stated water shares',
        v(() => `shows ${recipe.effectiveHydration}%, the stated water shares give ${expected.toFixed(1)}%`),
        recipe.effectiveHydration - expected,
      );
    }
    // The milk the number counts has to be on the list for a baker to add it.
    if (enrichments.dairy.enabled && !rows.some((r) => /Milk|Buttermilk|Cream/.test(r.name))) {
      out.effectiveHydration.add(
        'milk or cream is counted but not on the ingredient list',
        v(() => `effective hydration ${recipe.effectiveHydration}% counts ${enrichments.dairy.percentOfLiquid}% of the liquid as ${enrichments.dairy.type}; rows are ${rows.map((r) => r.name).join(', ')}`),
      );
    }
  } else if (recipe.effectiveHydration !== Math.round((recipe.waterWeight / recipe.flourWeight) * 100)) {
    out.effectiveHydration.add('differs from plain hydration with no enrichments', v(() => `${recipe.effectiveHydration}%`));
  }
}

let cached: SweepResult | undefined;

/** Runs the whole sweep once and keeps the result for every test in the file. */
export function runSweep(): SweepResult {
  if (cached) return cached;
  const out: SweepResult = {
    cases: 0,
    rowsSum: new Tally(),
    percentages: new Tally(),
    values: new Tally(),
    preferment: new Tally(),
    ounces: new Tally(),
    effectiveHydration: new Tally(),
  };
  for (const c of sweepCases()) {
    out.cases++;
    checkCase(c, printed(c.state, c.enrichments), out);
  }
  cached = out;
  return out;
}
