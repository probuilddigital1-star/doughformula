// The homepage bread calculator's on-demand code: the bake schedule and its calendar file, the
// Copy text, and share links. Like ./bread-calculator.ts it is pure (nothing here touches the
// document) and the tests run it directly.
//
// It is a module of its own so that it stays out of the script every homepage visit runs.
// src/pages/index.astro fetches it once the page has loaded, and awaits it on a click.
import {
  FLOUR_DATA,
  PREFERMENT_DATA,
  STYLE_RECIPES,
  applyStyle,
  applyStyleEnrichments,
  applyYeastType,
  createDefaultEnrichments,
  createDefaultFlourBlend,
  createDefaultState,
  estimateFermentationTimes,
  estimatePrefermentTiming,
  fermentationPlan,
  flourShares,
  formatHourRange,
  formatWeight,
  ingredientRows,
  isValidBlend,
  prefermentRows,
  recipeTitle,
  starterHydrationNote,
  styleSteps,
  waterTempText,
  yeastBloomNote,
  yeastSliderRange,
  yieldText,
  type EnrichmentState,
  type FlourEntry,
  type FlourShare,
  type PrefermentType,
  type Recipe,
  type RecipeState,
  type YeastType,
} from './bread-calculator';

// ============================================
// Baking schedule
// ============================================

export interface ScheduleItem {
  time: string;
  task: string;
  duration: string;
  /** When the step starts. The calendar file is written from this. */
  start: Date;
}

/** A step's clock time, "1:45 PM". With `withDay`, the weekday goes in front: "Fri 1:45 PM". */
export function formatScheduleTime(date: Date, withDay = false): string {
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return withDay ? `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${time}` : time;
}

/**
 * How each style preheats and bakes (audit item J7). Oven temperatures and bake times are the
 * ones the style's own steps give; a test holds the two together. Minutes are [shortest,
 * longest]; the schedule gives each step its longest time.
 */
interface StyleBake {
  preheatTask: string;
  preheat: [number, number];
  bakeTask: string;
  bake: [number, number];
  /** The steps fold during the first rise. */
  folds: boolean;
}

const STYLE_BAKE: Record<string, StyleBake> = {
  'sourdough': { preheatTask: 'Preheat oven to 500°F with the Dutch oven inside', preheat: [45, 45], bakeTask: 'Bake in the Dutch oven, lid on 20 min, then lid off 25 min', bake: [45, 45], folds: true },
  'baguette': { preheatTask: 'Preheat oven to 475°F with a baking stone or sheet, and a pan for steam', preheat: [45, 45], bakeTask: 'Score and bake with steam', bake: [22, 25], folds: true },
  'focaccia': { preheatTask: 'Preheat oven to 425°F', preheat: [20, 30], bakeTask: 'Bake in the oiled pan', bake: [20, 25], folds: true },
  'sandwich': { preheatTask: 'Preheat oven to 375°F', preheat: [20, 30], bakeTask: 'Bake in the loaf pan', bake: [30, 35], folds: false },
  'ciabatta': { preheatTask: 'Preheat oven to 475°F with a baking stone or sheet, and a pan for steam', preheat: [45, 45], bakeTask: 'Bake with steam', bake: [20, 25], folds: true },
  'brioche': { preheatTask: 'Preheat oven to 350°F', preheat: [20, 30], bakeTask: 'Egg wash and bake in the loaf pan', bake: [35, 45], folds: false },
  'no-knead': { preheatTask: 'Preheat oven to 450°F with the Dutch oven inside', preheat: [30, 30], bakeTask: 'Bake in the Dutch oven, lid on 30 min, then lid off 15-20 min', bake: [45, 50], folds: false },
  'custom': { preheatTask: 'Preheat oven', preheat: [30, 30], bakeTask: 'Bake bread', bake: [35, 45], folds: false }
};

const minutesText = ([low, high]: [number, number]) => (low === high ? `${low} min` : `${low}-${high} min`);

/** The middle of a range of hours, to the quarter hour, in minutes. */
const slotMinutes = ([low, high]: [number, number]) => (Math.round(((low + high) / 2) * 4) / 4) * 60;

/**
 * The bake schedule, worked back from when the bread should be ready. The rise, proof and
 * fridge steps take the Timing tab's times (the middle of each range); the preheat and bake
 * follow the style. When the plan runs over more than one day, every time carries its day.
 */
export function generateBakingSchedule(state: RecipeState, targetDateTime: Date): ScheduleItem[] {
  const steps: Array<{ task: string; duration: string; minutes: number }> = [];
  const add = (task: string, duration: string, minutes: number) => steps.unshift({ task, duration, minutes });
  const bake = STYLE_BAKE[state.style] ?? STYLE_BAKE['custom'];
  const plan = fermentationPlan(state);
  const shown = estimateFermentationTimes(state);

  add('Cool on wire rack', '1 hr', 60);
  add(bake.bakeTask, minutesText(bake.bake), bake.bake[1]);
  add(bake.preheatTask, minutesText(bake.preheat), bake.preheat[1]);

  if (plan.fridge && !plan.fridgeAfterRise) {
    // The shaped loaf proofs in the fridge.
    add('Remove from fridge, let warm', '30 min', 30);
    add('Shape and refrigerate', formatHourRange(...plan.fridge), slotMinutes(plan.fridge));
  } else if (plan.fridge) {
    // The dough goes in the fridge after the first rise and is shaped cold.
    add('Shape the cold dough and proof', shown.proof, slotMinutes(plan.proof!));
    add('Refrigerate the dough', formatHourRange(...plan.fridge), slotMinutes(plan.fridge));
  } else {
    add('Shape and final proof', shown.proof, slotMinutes(plan.proof!));
  }

  add(bake.folds ? 'Bulk fermentation (stretch & fold)' : 'Bulk fermentation', shown.bulk, slotMinutes(plan.rise));
  add('Mix final dough', '10-15 min', 15);

  // Autolyse (if enabled): the flour and water rest comes before the final mix
  if (state.autolyse) add('Autolyse (flour + water rest)', `${state.autolyseDuration} min`, state.autolyseDuration);

  // Preferment (if enabled)
  const prefData = PREFERMENT_DATA[state.prefermentType];
  if (state.prefermentType !== 'none' && prefData) {
    const prefHours = (prefData.fermentTimeMin + prefData.fermentTimeMax) / 2;
    add(`Mix ${prefData.name}`, estimatePrefermentTiming(state).fermentTime, prefHours * 60);
  }

  // Each step starts when the ones after it, added up, are subtracted from the ready time.
  let at = targetDateTime.getTime() - steps.reduce((sum, s) => sum + s.minutes, 0) * 60_000;
  const starts = steps.map((s) => {
    const start = new Date(at);
    at += s.minutes * 60_000;
    return start;
  });
  const days = new Set([...starts, targetDateTime].map((d) => d.toDateString()));
  return steps.map((s, i) => ({ time: formatScheduleTime(starts[i], days.size > 1), task: s.task, duration: s.duration, start: starts[i] }));
}

/** The calendar file behind "Add to Calendar": one event per schedule step, at the time the
 *  schedule shows. Each event runs until the next step starts, and the last until the bread
 *  is ready. */
export function scheduleIcs(schedule: ScheduleItem[], targetDate: Date): string {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//The Dough Formula//Baking Schedule//EN
`;

  schedule.forEach((item, index) => {
    const end = index + 1 < schedule.length ? schedule[index + 1].start : targetDate;

    icsContent += `BEGIN:VEVENT
DTSTART:${stamp(item.start)}
DTEND:${stamp(end)}
SUMMARY:${item.task}
DESCRIPTION:Duration: ${item.duration}
END:VEVENT
`;
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}

// ============================================
// Copy
// ============================================

/**
 * The text the "Copy" button puts on the clipboard: the recipe as the card shows it. The
 * preferment box, the final dough rows with their percentages and notes, the unit picked,
 * the starter line and the water temperature all come from the same code as the card.
 */
export function recipeCopyText(state: RecipeState, enrichmentState: EnrichmentState, recipe: Recipe): string {
  const line = (name: string, weight: number, ...extras: string[]) =>
    [`- ${name}: ${formatWeight(state, weight)}`, ...extras.filter(Boolean)].join(' ');
  const out: string[] = [recipeTitle(state), '', yieldText(state, recipe), ''];

  const prefData = PREFERMENT_DATA[state.prefermentType];
  if (recipe.preferment && prefData) {
    out.push(`${prefData.name} (make ${prefData.fermentTimeMin}-${prefData.fermentTimeMax} hrs before):`);
    for (const row of prefermentRows(state, recipe)) out.push(line(row.name, row.weight, row.note));
    out.push('', 'Final Dough:');
  } else {
    out.push('Ingredients:');
  }
  for (const row of ingredientRows(state, enrichmentState, recipe)) {
    out.push(line(row.name, row.weight, row.percent >= 0 ? `(${row.percent}%)` : '', row.note));
  }

  const starterNote = starterHydrationNote(state);
  if (starterNote) out.push('', starterNote);
  out.push('', `Water temperature: ${waterTempText(state, recipe.calculatedWaterTemp)}`);
  const bloomNote = yeastBloomNote(state);
  if (bloomNote) out.push(bloomNote);

  out.push('', 'Instructions:', ...styleSteps(state).map((inst, i) => `${i + 1}. ${inst}`));
  out.push('', 'Generated by The Dough Formula - thedoughformula.com');
  return out.join('\n');
}

// ============================================
// Share links
// ============================================
//
// A link's style, loaves, weight and hydration are read and applied by parseUrlRecipeParams()
// and applyUrlRecipeParams() in ./bread-calculator.ts, exactly as before this file existed.
// Those four are the whole of a calculator hand-off link (src/lib/handoff.ts) and of every
// share link made earlier. The settings below are extra parameters a share link adds when a
// setting is not what the style card alone would give, so a default recipe still shares as
// the same short link.

/** Heat the mixing adds to the dough, in °F, for each way of mixing. */
export const MIXER_FRICTION: Record<RecipeState['mixerType'], number> = {
  'hand': 11,
  'stand': 22,
  'spiral': 32
};

export interface ShareSettings {
  salt?: number;
  yeastType?: YeastType;
  yeastPercent?: number;
  starterHydration?: number;
  flours?: FlourEntry[];
  prefermentType?: PrefermentType;
  prefermentPercent?: number;
  /** null means the link switches that enrichment off (the style would have it on). */
  fat?: { type: string; percent: number } | null;
  eggs?: { type: string; count: number } | null;
  dairy?: { type: string; percentOfLiquid: number } | null;
  sweet?: { type: string; percent: number } | null;
  unit?: 'g' | 'oz';
  tempUnit?: 'F' | 'C';
  ddt?: number;
  roomTemp?: number;
  flourTemp?: number;
  mixerType?: RecipeState['mixerType'];
  coldRetard?: boolean;
  /** Autolyse length in minutes. */
  autolyse?: number;
}

const YEAST_TYPES: YeastType[] = ['starter', 'instant', 'active-dry', 'fresh'];
const PREFERMENT_TYPES: PrefermentType[] = ['poolish', 'biga', 'pate-fermentee', 'levain'];
const FAT_TYPES = ['butter', 'oil'];
const EGG_TYPES = ['whole', 'yolks', 'whites'];
const DAIRY_TYPES = ['whole-milk', 'buttermilk', 'cream'];
const SWEET_TYPES = ['sugar', 'honey', 'maple', 'malt'];
const AUTOLYSE_MINUTES = [20, 30, 45, 60];

/** What a style card alone sets up: the state and enrichments a link with only `style` opens. */
function styleBaseline(styleId: string): { state: RecipeState; enrichments: EnrichmentState } {
  const state = createDefaultState();
  const style = STYLE_RECIPES.find((s) => s.id === styleId);
  // Only the numbers matter here, so the style's words are left empty.
  if (style) applyStyle(state, { ...style, style: style.id, flour: '', instructions: [] });
  const enrichments = createDefaultEnrichments();
  if (style) applyStyleEnrichments(enrichments, style.id);
  return { state, enrichments };
}

const blendText = (shares: FlourShare[]) => shares.map((share) => `${share.type}.${share.percent}`).join('_');

/**
 * The parameters of a share link, in order. The first four are the ones links have always
 * carried. The rest appear only where the recipe differs from what its style card sets up.
 */
export function shareLinkParams(state: RecipeState, enrichmentState: EnrichmentState, flourBlend: FlourEntry[]): Array<[string, string]> {
  const out: Array<[string, string]> = [
    ['style', state.style],
    ['loaves', String(state.numLoaves)],
    ['weight', String(state.loafWeight)],
    ['hydration', String(state.hydration)]
  ];
  const base = styleBaseline(state.style);
  const add = (key: string, value: string | number) => out.push([key, String(value)]);

  if (state.salt !== base.state.salt) add('salt', state.salt);
  if (state.yeastType !== base.state.yeastType) add('yeast', state.yeastType);
  if (state.yeastType !== base.state.yeastType || state.yeastPercent !== base.state.yeastPercent) add('yeastpct', state.yeastPercent);
  if (state.starterHydration !== base.state.starterHydration) add('starterh', state.starterHydration);

  const blend = blendText(flourShares(state, flourBlend));
  if (blend !== blendText(flourShares(base.state, createDefaultFlourBlend()))) add('flours', blend);

  if (state.prefermentType !== 'none') {
    add('pref', state.prefermentType);
    if (state.prefermentPercent !== base.state.prefermentPercent) add('prefpct', state.prefermentPercent);
  }

  const group = (key: string, amountKey: string, now: { enabled: boolean; type: string }, was: { enabled: boolean; type: string }, amount: number, baseAmount: number) => {
    if (!now.enabled && !was.enabled) return;
    if (!now.enabled) return add(key, 'none');
    if (was.enabled && now.type === was.type && amount === baseAmount) return;
    add(key, now.type);
    add(amountKey, amount);
  };
  group('fat', 'fatpct', enrichmentState.fat, base.enrichments.fat, enrichmentState.fat.percent, base.enrichments.fat.percent);
  // A style's eggs follow the batch size. Only a typed count, or another kind of egg, travels.
  const eggsFollowStyle = !!enrichmentState.eggs.percentOfFlour && enrichmentState.eggs.percentOfFlour === base.enrichments.eggs.percentOfFlour;
  group('eggs', 'eggcount', enrichmentState.eggs, base.enrichments.eggs, eggsFollowStyle ? -1 : enrichmentState.eggs.count, -1);
  group('dairy', 'dairypct', enrichmentState.dairy, base.enrichments.dairy, enrichmentState.dairy.percentOfLiquid, base.enrichments.dairy.percentOfLiquid);
  group('sweet', 'sweetpct', enrichmentState.sweet, base.enrichments.sweet, enrichmentState.sweet.percent, base.enrichments.sweet.percent);

  if (state.unit !== base.state.unit) add('unit', state.unit);
  if (state.tempUnit !== base.state.tempUnit) add('temp', state.tempUnit.toLowerCase());
  if (state.ddt !== base.state.ddt) add('ddt', state.ddt);
  if (state.roomTemp !== base.state.roomTemp) add('room', state.roomTemp);
  if (state.flourTemp !== base.state.flourTemp) add('flourtemp', state.flourTemp);
  if (state.mixerType !== base.state.mixerType) add('mixer', state.mixerType);
  // Some cards start with Cold Retard on (J6), so the link says either way when it differs.
  if (state.coldRetard !== base.state.coldRetard) add('retard', state.coldRetard ? 1 : 0);
  if (state.autolyse) add('autolyse', state.autolyseDuration);
  return out;
}

/** The extra settings a share link carries. Anything that is not a value the calculator's
 *  own controls could produce is left out or held to the control's range. */
export function parseShareSettings(params: URLSearchParams): ShareSettings {
  const out: ShareSettings = {};
  const oneOf = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const value = params.get(key);
    return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
  };
  const number = (key: string, min: number, max: number): number | undefined => {
    if (!params.has(key)) return undefined;
    const value = parseFloat(params.get(key) || '');
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined;
  };

  const salt = number('salt', 1.5, 3);
  if (salt !== undefined) out.salt = salt;
  const yeastType = oneOf('yeast', YEAST_TYPES);
  if (yeastType) out.yeastType = yeastType;
  const yeastPercent = number('yeastpct', 0.1, 40);
  if (yeastPercent !== undefined) out.yeastPercent = yeastPercent;
  const starterHydration = number('starterh', 50, 200);
  if (starterHydration !== undefined) out.starterHydration = starterHydration;

  if (params.has('flours')) {
    const flours = (params.get('flours') || '').split('_').map((part) => {
      const dot = part.lastIndexOf('.');
      return { type: part.slice(0, dot), percent: Number(part.slice(dot + 1)) };
    });
    if (flours.every((flour) => FLOUR_DATA[flour.type] && Number.isInteger(flour.percent)) && flours.length <= 3 && isValidBlend(flours)) {
      out.flours = flours;
    }
  }

  const prefermentType = oneOf('pref', PREFERMENT_TYPES);
  if (prefermentType) {
    out.prefermentType = prefermentType;
    const prefermentPercent = number('prefpct', 15, 40);
    if (prefermentPercent !== undefined) out.prefermentPercent = Math.round(prefermentPercent);
  }

  const group = <K extends 'fat' | 'eggs' | 'dairy' | 'sweet'>(key: K, types: string[], amountKey: string, min: number, max: number, make: (type: string, amount: number) => NonNullable<ShareSettings[K]>) => {
    if (params.get(key) === 'none') {
      out[key] = null;
      return;
    }
    const type = oneOf(key, types);
    const amount = number(amountKey, min, max);
    if (type && amount !== undefined) out[key] = make(type, amount);
  };
  group('fat', FAT_TYPES, 'fatpct', 1, 30, (type, percent) => ({ type, percent }));
  group('eggs', EGG_TYPES, 'eggcount', 1, 12, (type, count) => ({ type, count: Math.round(count) }));
  group('dairy', DAIRY_TYPES, 'dairypct', 10, 100, (type, percentOfLiquid) => ({ type, percentOfLiquid: Math.round(percentOfLiquid) }));
  group('sweet', SWEET_TYPES, 'sweetpct', 1, 20, (type, percent) => ({ type, percent }));

  const unit = oneOf('unit', ['g', 'oz'] as const);
  if (unit) out.unit = unit;
  const temp = oneOf('temp', ['f', 'c'] as const);
  if (temp) out.tempUnit = temp === 'c' ? 'C' : 'F';
  const ddt = number('ddt', 68, 86);
  if (ddt !== undefined) out.ddt = Math.round(ddt);
  const roomTemp = number('room', 60, 90);
  if (roomTemp !== undefined) out.roomTemp = Math.round(roomTemp);
  const flourTemp = number('flourtemp', 55, 85);
  if (flourTemp !== undefined) out.flourTemp = Math.round(flourTemp);
  const mixerType = oneOf('mixer', ['hand', 'stand', 'spiral'] as const);
  if (mixerType) out.mixerType = mixerType;
  if (params.get('retard') === '1') out.coldRetard = true;
  if (params.get('retard') === '0') out.coldRetard = false;
  // Autolyse is one of four buttons, so only those four lengths count.
  const autolyse = Number(params.get('autolyse'));
  if (AUTOLYSE_MINUTES.includes(autolyse)) out.autolyse = autolyse;
  return out;
}

/** Puts a share link's extra settings into the state and the enrichments. It runs after the
 *  style and the loaves, weight and hydration are in place. The flour blend (`flours`) is the
 *  page's to apply, since the Flour tab holds it. */
export function applyShareSettings(state: RecipeState, enrichmentState: EnrichmentState, s: ShareSettings): void {
  if (s.salt !== undefined) state.salt = s.salt;
  if (s.yeastType !== undefined) applyYeastType(state, s.yeastType);
  if (s.yeastPercent !== undefined) {
    const range = yeastSliderRange(state.yeastType);
    state.yeastPercent = Math.min(range.max, Math.max(range.min, s.yeastPercent));
  }
  if (s.starterHydration !== undefined) state.starterHydration = s.starterHydration;
  if (s.prefermentType !== undefined) state.prefermentType = s.prefermentType;
  if (s.prefermentPercent !== undefined) state.prefermentPercent = s.prefermentPercent;

  const off = createDefaultEnrichments();
  if (s.fat !== undefined) enrichmentState.fat = s.fat ? { enabled: true, ...s.fat } : off.fat;
  if (s.eggs !== undefined) enrichmentState.eggs = s.eggs ? { enabled: true, ...s.eggs, percentOfFlour: null } : off.eggs;
  if (s.dairy !== undefined) enrichmentState.dairy = s.dairy ? { enabled: true, ...s.dairy } : off.dairy;
  if (s.sweet !== undefined) enrichmentState.sweet = s.sweet ? { enabled: true, ...s.sweet } : off.sweet;

  if (s.unit !== undefined) state.unit = s.unit;
  if (s.tempUnit !== undefined) state.tempUnit = s.tempUnit;
  if (s.ddt !== undefined) state.ddt = s.ddt;
  if (s.roomTemp !== undefined) state.roomTemp = s.roomTemp;
  if (s.flourTemp !== undefined) state.flourTemp = s.flourTemp;
  if (s.mixerType !== undefined) {
    state.mixerType = s.mixerType;
    state.frictionFactor = MIXER_FRICTION[s.mixerType];
  }
  if (s.coldRetard !== undefined) state.coldRetard = s.coldRetard;
  if (s.autolyse !== undefined) {
    state.autolyse = true;
    state.autolyseDuration = s.autolyse;
  }
}
