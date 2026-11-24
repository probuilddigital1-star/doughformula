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
  flourShares,
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

export function formatScheduleTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Generate baking schedule
export function generateBakingSchedule(state: RecipeState, targetDateTime: Date): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];

  // Work backwards from target time
  let currentTime = new Date(targetDateTime);
  const addStep = (task: string, duration: string) => {
    schedule.unshift({ time: formatScheduleTime(currentTime), task, duration, start: new Date(currentTime) });
  };

  // Cooling time (1 hour)
  currentTime.setHours(currentTime.getHours() - 1);
  addStep('Cool on wire rack', '1 hr');

  // Baking time (depends on style, but average 45 min)
  currentTime.setMinutes(currentTime.getMinutes() - 45);
  addStep('Bake bread', '35-45 min');

  // Preheat (30-45 min for Dutch oven)
  currentTime.setMinutes(currentTime.getMinutes() - 45);
  addStep('Preheat oven (with Dutch oven)', '45 min');

  // Final proof
  const fermentTimes = estimateFermentationTimes(state);
  const proofHours = state.coldRetard ? 0.5 : 1.5; // If cold retard, just warmup
  currentTime.setMinutes(currentTime.getMinutes() - proofHours * 60);

  if (state.coldRetard) {
    addStep('Remove from fridge, let warm', '30 min');
    // Cold retard overnight
    currentTime = new Date(currentTime);
    currentTime.setHours(currentTime.getHours() - 12);
    addStep('Shape & refrigerate overnight', '8-12 hrs');
  } else {
    addStep('Shape and final proof', fermentTimes.proof);
  }

  // Bulk fermentation
  const bulkHours = state.yeastType === 'starter' ? 5 : (state.yeastPercent < 0.5 ? 15 : 2);
  currentTime.setMinutes(currentTime.getMinutes() - bulkHours * 60);
  addStep('Bulk fermentation (stretch & fold)', fermentTimes.bulk);

  // Mix dough
  currentTime.setMinutes(currentTime.getMinutes() - 15);
  addStep('Mix final dough', '10-15 min');

  // Autolyse (if enabled): the flour and water rest comes before the final mix
  if (state.autolyse) {
    currentTime.setMinutes(currentTime.getMinutes() - state.autolyseDuration);
    addStep('Autolyse (flour + water rest)', `${state.autolyseDuration} min`);
  }

  // Preferment (if enabled)
  if (state.prefermentType !== 'none') {
    const prefTiming = estimatePrefermentTiming(state);
    const prefData = PREFERMENT_DATA[state.prefermentType];
    if (prefData) {
      const prefHours = (prefData.fermentTimeMin + prefData.fermentTimeMax) / 2;
      currentTime.setMinutes(currentTime.getMinutes() - prefHours * 60);
      addStep(`Mix ${prefData.name}`, prefTiming.fermentTime);
    }
  }

  return schedule;
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
