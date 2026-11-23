// The homepage bread calculator's math and printed values.
//
// src/pages/index.astro imports everything here and keeps only the DOM wiring, so the tests
// in tests/unit/bread-calculator*.test.ts and tests/unit/handoff.test.ts run the same code
// the page runs. Nothing in this file touches the document.

// ============================================
// State
// ============================================

export type YeastType = 'starter' | 'instant' | 'active-dry' | 'fresh';
export type PrefermentType = 'none' | 'poolish' | 'biga' | 'pate-fermentee' | 'levain';

export interface RecipeState {
  style: string;
  numLoaves: number;
  loafWeight: number;
  hydration: number;
  salt: number;
  yeastType: YeastType;
  yeastPercent: number;
  starterHydration: number;
  wholeGrain: number;
  flour: string;
  waterTemp: string;
  instructions: string[];
  unit: 'g' | 'oz';
  // Temperature state
  tempUnit: 'F' | 'C';
  ddt: number; // Desired Dough Temperature in Fahrenheit
  roomTemp: number;
  flourTemp: number;
  mixerType: 'hand' | 'stand' | 'spiral';
  frictionFactor: number;
  // Timing state
  coldRetard: boolean;
  // Preferment state
  prefermentType: PrefermentType;
  prefermentPercent: number; // % of flour in preferment
  // Autolyse state
  autolyse: boolean;
  autolyseDuration: number; // minutes
}

/** What the calculator shows on load. The hand-off link in src/lib/handoff.ts assumes this
 *  style's salt and starter percentages; tests/unit/handoff.test.ts holds the two together. */
export function createDefaultState(): RecipeState {
  return {
    style: 'sourdough',
    numLoaves: 2,
    loafWeight: 900,
    hydration: 75,
    salt: 2,
    yeastType: 'starter',
    yeastPercent: 20,
    starterHydration: 100,
    wholeGrain: 10,
    flour: 'Bread Flour + Whole Wheat',
    waterTemp: '78-82°F / 26-28°C',
    instructions: [],
    unit: 'g',
    // Temperature defaults
    tempUnit: 'F',
    ddt: 75,
    roomTemp: 70,
    flourTemp: 70,
    mixerType: 'hand',
    frictionFactor: 11,
    // Timing
    coldRetard: false,
    // Preferment
    prefermentType: 'none',
    prefermentPercent: 20,
    // Autolyse
    autolyse: false,
    autolyseDuration: 30
  };
}

// ============================================
// Bread styles
// ============================================

export interface BreadStyle {
  id: string;
  name: string;
  description: string;
  hydration: number;
  salt: number;
  yeastType: YeastType;
  yeastPercent: number;
  wholeGrain: number;
  flour: string;
  waterTemp: string;
  instructions: string[];
}

export const BREAD_STYLES: BreadStyle[] = [
  {
    id: 'sourdough',
    name: 'Sourdough',
    description: 'Wild yeast, complex tang, overnight fermentation',
    hydration: 75,
    salt: 2,
    yeastType: 'starter',
    yeastPercent: 20,
    wholeGrain: 10,
    flour: 'Bread Flour + Whole Wheat',
    waterTemp: '78-82°F / 26-28°C',
    instructions: [
      'Mix flour and water, autolyse 30-60 minutes',
      'Add starter and salt, mix until combined',
      'Stretch and fold every 30 min for 2 hours',
      'Bulk ferment 4-6 hours at room temperature',
      'Shape and proof overnight in refrigerator (8-12 hrs)',
      'Bake in Dutch oven at 500°F for 20 min covered, 25 min uncovered'
    ]
  },
  {
    id: 'baguette',
    name: 'Baguette',
    description: 'Crisp crust, open crumb, classic French',
    hydration: 68,
    salt: 2,
    yeastType: 'instant',
    yeastPercent: 0.5,
    wholeGrain: 0,
    flour: 'Bread Flour or T65',
    waterTemp: '75-78°F / 24-26°C',
    instructions: [
      'Mix flour, water, yeast. Autolyse 20 minutes',
      'Add salt, mix until smooth',
      'Fold every 30 minutes for 1.5 hours',
      'Bulk ferment 2-3 hours until doubled',
      'Divide and pre-shape, rest 20 minutes',
      'Final shape into baguettes, proof 45-60 minutes',
      'Score and bake at 475°F with steam for 22-25 minutes'
    ]
  },
  {
    id: 'focaccia',
    name: 'Focaccia',
    description: 'Olive oil enriched, dimpled, herbaceous',
    hydration: 80,
    salt: 2.2,
    yeastType: 'instant',
    yeastPercent: 0.8,
    wholeGrain: 0,
    flour: 'Bread Flour or All-Purpose',
    waterTemp: '80-85°F / 27-29°C',
    instructions: [
      'Mix flour, water, yeast, and 2 tbsp olive oil',
      'Add salt, mix until smooth and elastic',
      'Stretch and fold every 30 min for 1.5 hours',
      'Pour into oiled pan, dimple with fingers',
      'Proof 1-2 hours until puffy',
      'Dimple again, drizzle olive oil, add toppings',
      'Bake at 425°F for 20-25 minutes until golden'
    ]
  },
  {
    id: 'sandwich',
    name: 'Sandwich Loaf',
    description: 'Soft, tender crumb for everyday slicing',
    hydration: 62,
    salt: 1.8,
    yeastType: 'instant',
    yeastPercent: 1,
    wholeGrain: 0,
    flour: 'Bread Flour or All-Purpose',
    waterTemp: '95-105°F / 35-40°C',
    instructions: [
      'Dissolve yeast in warm water, let bloom 5 minutes',
      'Mix flour, salt, and 2 tbsp butter or oil',
      'Add yeast mixture, knead 8-10 minutes',
      'Bulk ferment 1-1.5 hours until doubled',
      'Shape into loaf, place in greased pan',
      'Proof 45-60 minutes until risen above pan',
      'Bake at 375°F for 30-35 minutes'
    ]
  },
  {
    id: 'ciabatta',
    name: 'Ciabatta',
    description: 'High hydration, irregular holes, rustic',
    hydration: 82,
    salt: 2,
    yeastType: 'instant',
    yeastPercent: 0.6,
    wholeGrain: 0,
    flour: 'Bread Flour',
    waterTemp: '70-75°F / 21-24°C',
    instructions: [
      'Mix flour, water, yeast into shaggy dough',
      'Rest 30 minutes (autolyse)',
      'Add salt, fold until incorporated',
      'Stretch and fold every 30 min for 3 hours',
      'Bulk ferment 2-3 hours until very bubbly',
      'Gently turn out, divide without degassing',
      'Proof 30-45 min, bake at 475°F with steam for 20-25 min'
    ]
  },
  {
    id: 'brioche',
    name: 'Brioche',
    description: 'Butter and eggs for rich, tender bread',
    hydration: 55,
    salt: 1.8,
    yeastType: 'instant',
    yeastPercent: 1.2,
    wholeGrain: 0,
    flour: 'All-Purpose Flour',
    waterTemp: '80-85°F / 27-29°C',
    instructions: [
      'Mix flour, sugar (8%), eggs, milk, and yeast',
      'Knead until smooth, about 10 minutes',
      'Gradually add soft butter (25%), knead until silky',
      'Add salt, knead 2 more minutes',
      'Bulk ferment 2 hours, then refrigerate overnight',
      'Shape cold dough, proof 2-3 hours until doubled',
      'Egg wash and bake at 350°F for 25-30 minutes'
    ]
  },
  {
    id: 'no-knead',
    name: 'No-Knead',
    description: 'Hands-off, long ferment, crispy crust',
    hydration: 78,
    salt: 2,
    yeastType: 'instant',
    yeastPercent: 0.25,
    wholeGrain: 0,
    flour: 'Bread Flour or All-Purpose',
    waterTemp: '70-75°F / 21-24°C',
    instructions: [
      'Mix flour, water, salt, and yeast until shaggy (2 min)',
      'Cover and let rise at room temperature 12-18 hours',
      'Dough is ready when bubbly and doubled',
      'Turn out onto floured surface, fold into ball',
      'Let rest 15 min, then shape into round',
      'Proof in bowl lined with floured towel 1-2 hours',
      'Preheat Dutch oven at 450°F for 30 min',
      'Bake covered 30 min, uncovered 15-20 min until deep golden'
    ]
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your recipe, your rules',
    hydration: 70,
    salt: 2,
    yeastType: 'instant',
    yeastPercent: 1,
    wholeGrain: 0,
    flour: 'Your choice',
    waterTemp: 'Varies',
    instructions: [
      'Mix ingredients according to your method',
      'Knead or fold as needed',
      'Ferment according to your schedule',
      'Shape and proof',
      'Bake at appropriate temperature'
    ]
  }
];

/** Desired dough temperature (°F) each style switches to when its card is picked. */
export const STYLE_DDT_DEFAULTS: Record<string, number> = {
  'sourdough': 76,
  'baguette': 74,
  'focaccia': 78,
  'sandwich': 78,
  'ciabatta': 73,
  'brioche': 77,
  'no-knead': 70,
  'custom': 75
};

/** The settings a style card carries. The page reads them off the card's data attributes. */
export type StyleSettings = Pick<
  BreadStyle,
  'hydration' | 'salt' | 'yeastType' | 'yeastPercent' | 'wholeGrain' | 'flour' | 'waterTemp' | 'instructions'
> & { style: string };

/** Picking a style card: takes over the recipe basics and the style's dough temperature. */
export function applyStyle(state: RecipeState, s: StyleSettings): void {
  state.style = s.style;
  state.hydration = s.hydration;
  state.salt = s.salt;
  state.yeastType = s.yeastType;
  state.yeastPercent = s.yeastPercent;
  state.wholeGrain = s.wholeGrain;
  state.flour = s.flour;
  state.waterTemp = s.waterTemp;
  state.instructions = s.instructions;

  // Update DDT based on bread style
  state.ddt = STYLE_DDT_DEFAULTS[state.style] || 75;
}

// ============================================
// Reference data
// ============================================

// Preferment data
export interface PrefermentData {
  name: string;
  hydration: number; // % of preferment flour
  yeastPercent: number; // % of preferment flour
  fermentTimeMin: number; // hours
  fermentTimeMax: number;
  description: string;
  readySigns: string;
  tip: string;
}

export const PREFERMENT_DATA: Record<string, PrefermentData> = {
  'poolish': {
    name: 'Poolish',
    hydration: 100,
    yeastPercent: 0.1,
    fermentTimeMin: 8,
    fermentTimeMax: 12,
    description: '100% hydration, mild flavor, very extensible dough. Perfect for baguettes and ciabatta.',
    readySigns: 'Ready when: domed, very bubbly, just starting to recede',
    tip: 'Poolish creates an open crumb and mild, wheaty flavor. Use within 3 hours of peak.'
  },
  'biga': {
    name: 'Biga',
    hydration: 55,
    yeastPercent: 0.5,
    fermentTimeMin: 12,
    fermentTimeMax: 16,
    description: '55% hydration stiff preferment. Adds strength, nutty flavor, and keeping quality.',
    readySigns: 'Ready when: doubled, domed, with cracks on surface',
    tip: 'Biga creates a chewy texture and complex, slightly sweet flavor.'
  },
  'pate-fermentee': {
    name: 'Pâte Fermentée',
    hydration: -1, // Uses recipe hydration
    yeastPercent: -1, // Uses recipe yeast
    fermentTimeMin: 1,
    fermentTimeMax: 3,
    description: 'Old dough method. Uses leftover dough from previous batch for instant flavor.',
    readySigns: 'Ready when: mature, slightly puffy, but not over-proofed',
    tip: 'Keep old dough refrigerated 1-3 days. Bring to room temp before using.'
  },
  'levain': {
    name: 'Levain',
    hydration: 100,
    yeastPercent: 0, // No commercial yeast - starter only
    fermentTimeMin: 4,
    fermentTimeMax: 8,
    description: 'Starter-based preferment for enhanced sourdough flavor and strength.',
    readySigns: 'Ready when: doubled, passes float test, domed with bubbles',
    tip: 'Build levain from active starter. Use at peak for best results.'
  }
};

// Yeast conversion ratios (relative to instant yeast)
export const YEAST_CONVERSIONS = {
  'instant': 1,
  'active-dry': 1.25,
  'fresh': 3,
  'starter': 1 // Starter uses different calculation
};

// Yeast tips
export const YEAST_TIPS: Record<YeastType, string> = {
  'starter': 'Feed your starter 4-8 hours before use. Use at peak activity when it\'s domed and bubbly.',
  'instant': 'Add directly to flour. No blooming needed. Works great for quick breads.',
  'active-dry': 'Bloom in warm water (100-110°F / 38-43°C) for 5-10 minutes before mixing.',
  'fresh': 'Crumble into flour or dissolve in lukewarm water. Use within 2 weeks of purchase.'
};

// Default yeast percentages by type
export const DEFAULT_YEAST_PERCENT: Record<YeastType, number> = {
  'starter': 20,
  'instant': 1,
  'active-dry': 1.25,
  'fresh': 3
};

/** Picking a yeast type on the Yeast tab: switches the type and sets the amount to that
 *  type's default. */
export function applyYeastType(state: RecipeState, yeastType: YeastType): void {
  state.yeastType = yeastType;
  state.yeastPercent = DEFAULT_YEAST_PERCENT[yeastType];
}

// Flour types with properties
export const FLOUR_DATA: Record<string, { name: string; protein: string; absorption: number; wholeGrain: boolean }> = {
  'bread': { name: 'Bread Flour', protein: '12-14%', absorption: 62, wholeGrain: false },
  'ap': { name: 'All-Purpose', protein: '10-12%', absorption: 58, wholeGrain: false },
  'whole-wheat': { name: 'Whole Wheat', protein: '13-14%', absorption: 75, wholeGrain: true },
  'rye-light': { name: 'Light Rye', protein: '8-10%', absorption: 80, wholeGrain: true },
  'rye-dark': { name: 'Dark Rye', protein: '10-12%', absorption: 85, wholeGrain: true },
  'spelt': { name: 'Spelt', protein: '12-15%', absorption: 58, wholeGrain: true },
  'einkorn': { name: 'Einkorn', protein: '12-16%', absorption: 55, wholeGrain: true },
  'semolina': { name: 'Semolina', protein: '12-13%', absorption: 60, wholeGrain: false },
  'tipo-00': { name: 'Tipo 00', protein: '11-12%', absorption: 55, wholeGrain: false }
};

// Enrichment water content percentages
export const ENRICHMENT_WATER_CONTENT: Record<string, number> = {
  // Fats
  'butter': 0.15,
  'oil': 0,
  // Eggs (per 50g large egg)
  'whole': 0.75,
  'yolks': 0.50,
  'whites': 0.90,
  // Dairy
  'whole-milk': 0.87,
  'buttermilk': 0.90,
  'cream': 0.58,
  // Sweeteners
  'sugar': 0,
  'honey': 0.17,
  'maple': 0.33,
  'malt': 0.20
};

// Enrichment state
export interface EnrichmentState {
  fat: { enabled: boolean; type: string; percent: number };
  eggs: { enabled: boolean; type: string; count: number };
  dairy: { enabled: boolean; type: string; percentOfLiquid: number };
  sweet: { enabled: boolean; type: string; percent: number };
}

export function createDefaultEnrichments(): EnrichmentState {
  return {
    fat: { enabled: false, type: 'butter', percent: 5 },
    eggs: { enabled: false, type: 'whole', count: 2 },
    dairy: { enabled: false, type: 'whole-milk', percentOfLiquid: 50 },
    sweet: { enabled: false, type: 'sugar', percent: 5 }
  };
}

// Multi-flour state
export interface FlourEntry {
  type: string;
  percent: number;
}

export function createDefaultFlourBlend(): FlourEntry[] {
  return [
    { type: 'bread', percent: 100 }
  ];
}

// ============================================
// Temperature
// ============================================

// Temperature conversion helpers
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9/5) + 32);
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) * 5/9);
}

export function formatTemp(state: RecipeState, tempF: number): string {
  if (state.tempUnit === 'C') {
    return `${fahrenheitToCelsius(tempF)}°C`;
  }
  return `${tempF}°F`;
}

// Calculate water temperature using DDT formula
export function calculateWaterTemp(state: RecipeState): number {
  // Formula: Water = (DDT × 3) - Room - Flour - Friction
  return (state.ddt * 3) - state.roomTemp - state.flourTemp - state.frictionFactor;
}

/** The "Water temperature" value on the recipe card. */
export function waterTempText(state: RecipeState, calcTemp: number): string {
  if (calcTemp < 40 || calcTemp > 110) {
    return `${formatTemp(state, calcTemp)} (adjust needed)`;
  }
  return formatTemp(state, calcTemp);
}

/** The worked formula under "Use Water At" on the Temperature tab. */
export function waterTempFormulaText(state: RecipeState, calculatedWaterTemp: number): string {
  const unit = state.tempUnit === 'C' ? '°C' : '°F';
  const ddt = state.tempUnit === 'C' ? fahrenheitToCelsius(state.ddt) : state.ddt;
  const room = state.tempUnit === 'C' ? fahrenheitToCelsius(state.roomTemp) : state.roomTemp;
  const flour = state.tempUnit === 'C' ? fahrenheitToCelsius(state.flourTemp) : state.flourTemp;
  const friction = state.tempUnit === 'C' ? fahrenheitToCelsius(state.frictionFactor) : state.frictionFactor;
  const result = state.tempUnit === 'C' ? fahrenheitToCelsius(calculatedWaterTemp) : calculatedWaterTemp;
  return `(${ddt} × 3) - ${room} - ${flour} - ${friction} = ${result}${unit}`;
}

/** The warning under the water temperature, or null when the water is in range. */
export function waterTempWarningText(calculatedWaterTemp: number): string | null {
  if (calculatedWaterTemp < 40) {
    return '⚠️ Water too cold! Add ice or use cold water.';
  } else if (calculatedWaterTemp > 110) {
    return '⚠️ Water too hot! May kill yeast. Cool your environment.';
  }
  return null;
}

// ============================================
// Starter, fermentation, preferments
// ============================================

// Calculate starter contribution (flour and water from starter)
export function calculateStarterContribution(state: RecipeState, starterWeight: number): { flour: number; water: number } {
  // Starter hydration: 100% means equal flour and water
  // e.g., 100g starter at 100% = 50g flour + 50g water
  const starterFlour = Math.round(starterWeight / (1 + state.starterHydration / 100));
  const starterWater = starterWeight - starterFlour;
  return { flour: starterFlour, water: starterWater };
}

// Estimate fermentation times based on temperature and yeast type
export function estimateFermentationTimes(state: RecipeState): { bulk: string; proof: string; total: string } {
  // Base times at 75°F (24°C)
  let baseBulkMin = 1.5; // hours
  let baseBulkMax = 2;
  let baseProofMin = 0.75;
  let baseProofMax = 1.5;

  // Adjust for yeast type
  if (state.yeastType === 'starter') {
    baseBulkMin = 4;
    baseBulkMax = 6;
    baseProofMin = 1;
    baseProofMax = 2;
  } else if (state.yeastPercent < 0.5) {
    // Low yeast (like no-knead)
    baseBulkMin = 12;
    baseBulkMax = 18;
  }

  // Temperature adjustment: ~10% change per degree F from 75°F
  const tempDiff = state.ddt - 75;
  const tempFactor = Math.pow(0.93, tempDiff / 5); // Warmer = faster

  const adjustedBulkMin = baseBulkMin * tempFactor;
  const adjustedBulkMax = baseBulkMax * tempFactor;
  const adjustedProofMin = baseProofMin * tempFactor;
  const adjustedProofMax = baseProofMax * tempFactor;

  // Format times
  const formatTime = (min: number, max: number): string => {
    if (min >= 1) {
      return `${min.toFixed(0)}-${max.toFixed(0)} hrs`;
    } else {
      return `${Math.round(min * 60)}-${Math.round(max * 60)} min`;
    }
  };

  const totalMin = adjustedBulkMin + adjustedProofMin;
  const totalMax = adjustedBulkMax + adjustedProofMax;

  return {
    bulk: formatTime(adjustedBulkMin, adjustedBulkMax),
    proof: formatTime(adjustedProofMin, adjustedProofMax),
    total: formatTime(totalMin, totalMax)
  };
}

// Calculate total whole grain percentage from flour blend
export function calculateWholeGrainPercent(flourBlend: FlourEntry[]): number {
  return flourBlend.reduce((total, flour) => {
    if (FLOUR_DATA[flour.type]?.wholeGrain) {
      return total + flour.percent;
    }
    return total;
  }, 0);
}

export interface PrefermentIngredients {
  flour: number;
  water: number;
  yeast: number;
  yeastNote: string;
}

// Calculate preferment ingredients
export function calculatePrefermentIngredients(state: RecipeState, totalFlourWeight: number): PrefermentIngredients | null {
  if (state.prefermentType === 'none') return null;

  const prefData = PREFERMENT_DATA[state.prefermentType];
  if (!prefData) return null;

  const prefFlour = Math.round(totalFlourWeight * state.prefermentPercent / 100);

  // Handle hydration
  let prefWater: number;
  if (prefData.hydration === -1) {
    // Pâte Fermentée uses recipe hydration
    prefWater = Math.round(prefFlour * state.hydration / 100);
  } else {
    prefWater = Math.round(prefFlour * prefData.hydration / 100);
  }

  // Handle yeast
  let prefYeast: number;
  let yeastNote: string;
  if (state.prefermentType === 'levain') {
    // Levain uses starter, not commercial yeast
    prefYeast = Math.round(prefFlour * 0.2); // 20% starter
    yeastNote = '(active starter)';
  } else if (prefData.yeastPercent === -1) {
    // Pâte Fermentée uses recipe yeast amount
    prefYeast = Math.round(prefFlour * state.yeastPercent / 100);
    yeastNote = '';
  } else {
    prefYeast = prefFlour * prefData.yeastPercent / 100;
    // Format tiny yeast amounts
    if (prefYeast < 1) {
      yeastNote = '(tiny pinch)';
      prefYeast = Math.round(prefYeast * 10) / 10; // Round to 1 decimal
    } else {
      yeastNote = '';
      prefYeast = Math.round(prefYeast);
    }
  }

  return { flour: prefFlour, water: prefWater, yeast: prefYeast, yeastNote };
}

// Estimate preferment timing based on room temperature
export function estimatePrefermentTiming(state: RecipeState): { fermentTime: string; startTime: string } {
  if (state.prefermentType === 'none') {
    return { fermentTime: '-', startTime: '-' };
  }

  const prefData = PREFERMENT_DATA[state.prefermentType];
  if (!prefData) return { fermentTime: '-', startTime: '-' };

  // Adjust timing based on room temperature
  const tempDiff = state.roomTemp - 70; // Base temp 70°F
  const tempFactor = Math.pow(0.93, tempDiff / 5); // Warmer = faster

  const minTime = Math.round(prefData.fermentTimeMin * tempFactor);
  const maxTime = Math.round(prefData.fermentTimeMax * tempFactor);

  const fermentTime = `${minTime}-${maxTime} hrs`;

  // Calculate when to start (average of min/max from a 9am bake)
  const avgTime = (minTime + maxTime) / 2;
  let startTime: string;
  if (avgTime <= 4) {
    startTime = 'Early morning of bake day';
  } else if (avgTime <= 8) {
    startTime = 'Evening before bake day';
  } else if (avgTime <= 14) {
    startTime = 'Night before (before bed)';
  } else {
    startTime = 'Previous afternoon';
  }

  return { fermentTime, startTime };
}

// ============================================
// Baking schedule
// ============================================

export interface ScheduleItem {
  time: string;
  task: string;
  duration: string;
}

export function formatScheduleTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Generate baking schedule
export function generateBakingSchedule(state: RecipeState, targetDateTime: Date): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];

  // Work backwards from target time
  let currentTime = new Date(targetDateTime);

  // Cooling time (1 hour)
  currentTime.setHours(currentTime.getHours() - 1);
  schedule.unshift({
    time: formatScheduleTime(currentTime),
    task: 'Cool on wire rack',
    duration: '1 hr'
  });

  // Baking time (depends on style, but average 45 min)
  currentTime.setMinutes(currentTime.getMinutes() - 45);
  schedule.unshift({
    time: formatScheduleTime(currentTime),
    task: 'Bake bread',
    duration: '35-45 min'
  });

  // Preheat (30-45 min for Dutch oven)
  currentTime.setMinutes(currentTime.getMinutes() - 45);
  schedule.unshift({
    time: formatScheduleTime(currentTime),
    task: 'Preheat oven (with Dutch oven)',
    duration: '45 min'
  });

  // Final proof
  const fermentTimes = estimateFermentationTimes(state);
  const proofHours = state.coldRetard ? 0.5 : 1.5; // If cold retard, just warmup
  currentTime.setMinutes(currentTime.getMinutes() - proofHours * 60);

  if (state.coldRetard) {
    schedule.unshift({
      time: formatScheduleTime(currentTime),
      task: 'Remove from fridge, let warm',
      duration: '30 min'
    });
    // Cold retard overnight
    const coldRetardTime = new Date(currentTime);
    coldRetardTime.setHours(coldRetardTime.getHours() - 12);
    schedule.unshift({
      time: formatScheduleTime(coldRetardTime),
      task: 'Shape & refrigerate overnight',
      duration: '8-12 hrs'
    });
    currentTime = coldRetardTime;
  } else {
    schedule.unshift({
      time: formatScheduleTime(currentTime),
      task: 'Shape and final proof',
      duration: fermentTimes.proof
    });
  }

  // Bulk fermentation
  const bulkHours = state.yeastType === 'starter' ? 5 : (state.yeastPercent < 0.5 ? 15 : 2);
  currentTime.setMinutes(currentTime.getMinutes() - bulkHours * 60);
  schedule.unshift({
    time: formatScheduleTime(currentTime),
    task: 'Bulk fermentation (stretch & fold)',
    duration: fermentTimes.bulk
  });

  // Autolyse (if enabled)
  if (state.autolyse) {
    currentTime.setMinutes(currentTime.getMinutes() - state.autolyseDuration);
    schedule.unshift({
      time: formatScheduleTime(currentTime),
      task: 'Autolyse (flour + water rest)',
      duration: `${state.autolyseDuration} min`
    });
  }

  // Mix dough
  currentTime.setMinutes(currentTime.getMinutes() - 15);
  schedule.unshift({
    time: formatScheduleTime(currentTime),
    task: 'Mix final dough',
    duration: '10-15 min'
  });

  // Preferment (if enabled)
  if (state.prefermentType !== 'none') {
    const prefTiming = estimatePrefermentTiming(state);
    const prefData = PREFERMENT_DATA[state.prefermentType];
    if (prefData) {
      const prefHours = (prefData.fermentTimeMin + prefData.fermentTimeMax) / 2;
      currentTime.setMinutes(currentTime.getMinutes() - prefHours * 60);
      schedule.unshift({
        time: formatScheduleTime(currentTime),
        task: `Mix ${prefData.name}`,
        duration: prefTiming.fermentTime
      });
    }
  }

  return schedule;
}

/** The calendar file behind "Add to calendar": one event per schedule step. */
export function scheduleIcs(schedule: ScheduleItem[], targetDate: Date): string {
  // Generate ICS file content
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//The Dough Formula//Baking Schedule//EN
`;

  schedule.forEach((item, index) => {
    const eventStart = new Date(targetDate);
    // Rough time calculation (this is simplified)
    eventStart.setMinutes(eventStart.getMinutes() - (schedule.length - index) * 30);

    const dtStart = eventStart.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = new Date(eventStart.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsContent += `BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${item.task}
DESCRIPTION:Duration: ${item.duration}
END:VEVENT
`;
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}

// ============================================
// Enrichments
// ============================================

// Calculate water contribution from enrichments
export function calculateEnrichmentWaterContribution(
  state: RecipeState,
  enrichmentState: EnrichmentState,
  flourWeight: number
): { totalWater: number; breakdown: string[] } {
  let totalWater = 0;
  const breakdown: string[] = [];

  // Fat contribution
  if (enrichmentState.fat.enabled) {
    const fatWeight = flourWeight * enrichmentState.fat.percent / 100;
    const waterFromFat = fatWeight * ENRICHMENT_WATER_CONTENT[enrichmentState.fat.type];
    totalWater += waterFromFat;
    if (waterFromFat > 0) {
      breakdown.push(`${enrichmentState.fat.type}: ${Math.round(waterFromFat)}g water`);
    }
  }

  // Egg contribution
  if (enrichmentState.eggs.enabled) {
    const eggWeight = enrichmentState.eggs.count * 50; // 50g per large egg
    const waterFromEggs = eggWeight * ENRICHMENT_WATER_CONTENT[enrichmentState.eggs.type];
    totalWater += waterFromEggs;
    breakdown.push(`Eggs: ${Math.round(waterFromEggs)}g water`);
  }

  // Dairy contribution (replaces portion of water)
  if (enrichmentState.dairy.enabled) {
    // Dairy replaces water, so the net water change is based on dairy water content
    // If using 50% milk at 87% water, and rest is 100% water, net effect is small
    const baseWater = flourWeight * state.hydration / 100;
    const dairyPortion = baseWater * enrichmentState.dairy.percentOfLiquid / 100;
    const waterFromDairy = dairyPortion * ENRICHMENT_WATER_CONTENT[enrichmentState.dairy.type];
    const waterReplaced = dairyPortion; // This was water
    const netChange = waterFromDairy - waterReplaced;
    totalWater += netChange;
    if (Math.abs(netChange) > 1) {
      breakdown.push(`Dairy: ${netChange > 0 ? '+' : ''}${Math.round(netChange)}g net`);
    }
  }

  // Sweetener contribution
  if (enrichmentState.sweet.enabled) {
    const sweetWeight = flourWeight * enrichmentState.sweet.percent / 100;
    const waterFromSweet = sweetWeight * ENRICHMENT_WATER_CONTENT[enrichmentState.sweet.type];
    totalWater += waterFromSweet;
    if (waterFromSweet > 0) {
      breakdown.push(`${enrichmentState.sweet.type}: ${Math.round(waterFromSweet)}g water`);
    }
  }

  return { totalWater, breakdown };
}

// Calculate effective hydration considering enrichments
export function calculateEffectiveHydration(
  state: RecipeState,
  enrichmentState: EnrichmentState,
  flourWeight: number,
  baseWater: number
): number {
  const { totalWater } = calculateEnrichmentWaterContribution(state, enrichmentState, flourWeight);
  const effectiveWater = baseWater + totalWater;
  return Math.round((effectiveWater / flourWeight) * 100);
}

// ============================================
// The recipe
// ============================================

export interface Recipe {
  totalDough: number;
  flourWeight: number;
  whiteFlourWeight: number;
  wholeGrainWeight: number;
  wholeGrainPercent: number;
  waterWeight: number;
  saltWeight: number;
  yeastWeight: number;
  starterFlourContrib: number;
  starterWaterContrib: number;
  calculatedWaterTemp: number;
  enrichmentWater: { totalWater: number; breakdown: string[] };
  effectiveHydration: number;
  enrichments: { fat: number; eggs: number; sweet: number };
}

export function calculateRecipe(state: RecipeState, enrichmentState: EnrichmentState, flourBlend: FlourEntry[]): Recipe {
  const totalDough = state.numLoaves * state.loafWeight;

  // Calculate base flour weight
  let yeastContribution = state.yeastPercent / 100;
  if (state.yeastType !== 'starter') {
    // Commercial yeast is much smaller percentage
    yeastContribution = state.yeastPercent / 100;
  }

  const flourWeight = Math.round(totalDough / (1 + state.hydration / 100 + state.salt / 100 + yeastContribution));
  let waterWeight = Math.round(flourWeight * state.hydration / 100);
  const saltWeight = Math.round(flourWeight * state.salt / 100);
  const yeastWeight = Math.round(flourWeight * state.yeastPercent / 100);

  // For starter, calculate flour/water contribution
  let starterFlourContrib = 0;
  let starterWaterContrib = 0;
  if (state.yeastType === 'starter') {
    const starterContrib = calculateStarterContribution(state, yeastWeight);
    starterFlourContrib = starterContrib.flour;
    starterWaterContrib = starterContrib.water;
  }

  // Calculate whole grain from flour blend
  const wholeGrainPercent = calculateWholeGrainPercent(flourBlend);
  const wholeGrainWeight = Math.round(flourWeight * wholeGrainPercent / 100);
  const whiteFlourWeight = flourWeight - wholeGrainWeight;

  // Calculate water temperature
  const calculatedWaterTemp = calculateWaterTemp(state);

  // Calculate enrichment contributions
  const enrichmentWater = calculateEnrichmentWaterContribution(state, enrichmentState, flourWeight);
  const effectiveHydration = calculateEffectiveHydration(state, enrichmentState, flourWeight, waterWeight);

  // Calculate enrichment weights
  const enrichments = {
    fat: enrichmentState.fat.enabled ? Math.round(flourWeight * enrichmentState.fat.percent / 100) : 0,
    eggs: enrichmentState.eggs.enabled ? enrichmentState.eggs.count * 50 : 0,
    sweet: enrichmentState.sweet.enabled ? Math.round(flourWeight * enrichmentState.sweet.percent / 100) : 0
  };

  return {
    totalDough,
    flourWeight,
    whiteFlourWeight,
    wholeGrainWeight,
    wholeGrainPercent,
    waterWeight,
    saltWeight,
    yeastWeight,
    starterFlourContrib,
    starterWaterContrib,
    calculatedWaterTemp,
    enrichmentWater,
    effectiveHydration,
    enrichments
  };
}

// ============================================
// Printed values
// ============================================

export function convertToOz(grams: number): string {
  return (grams / 28.35).toFixed(1);
}

export function formatWeight(state: RecipeState, grams: number): string {
  if (state.unit === 'oz') {
    return `${convertToOz(grams)}oz`;
  }
  return `${grams}g`;
}

/** The "Makes N loaves at ..." line in the recipe card header. */
export function yieldText(state: RecipeState, recipe: Recipe): string {
  return `Makes ${state.numLoaves} ${state.numLoaves === 1 ? 'loaf' : 'loaves'} at ${formatWeight(state, state.loafWeight)} each (${formatWeight(state, recipe.totalDough)} total)`;
}

export interface PrefermentRow {
  name: string;
  weight: number;
  note: string;
}

/** The rows of the preferment box on the recipe card. */
export function prefermentRows(state: RecipeState, prefIngredients: PrefermentIngredients): PrefermentRow[] {
  const prefData = PREFERMENT_DATA[state.prefermentType];
  const prefIngs: PrefermentRow[] = [];
  prefIngs.push({ name: 'Bread Flour', weight: prefIngredients.flour, note: `(${state.prefermentPercent}% of total)` });
  prefIngs.push({ name: 'Water', weight: prefIngredients.water, note: prefData.hydration === -1 ? '(recipe hydration)' : `(${prefData.hydration}% hydration)` });

  if (state.prefermentType === 'levain') {
    prefIngs.push({ name: 'Active Starter', weight: prefIngredients.yeast, note: prefIngredients.yeastNote });
  } else if (prefIngredients.yeast > 0) {
    prefIngs.push({ name: 'Instant Yeast', weight: prefIngredients.yeast, note: prefIngredients.yeastNote });
  }

  return prefIngs;
}

/** A preferment row's weight as printed: always grams, one decimal under a gram. */
export function formatPrefermentWeight(weight: number): string {
  return `${typeof weight === 'number' && weight < 1 ? weight.toFixed(1) : Math.round(weight)}g`;
}

export interface IngredientRow {
  name: string;
  weight: number;
  /** Baker's percentage as printed; -1 means the row prints no percentage. */
  percent: number;
  note: string;
}

/** The rows of the ingredient list ("Final Dough" when a preferment is on). */
export function ingredientRows(
  state: RecipeState,
  enrichmentState: EnrichmentState,
  recipe: Recipe,
  prefIngredients: PrefermentIngredients | null
): IngredientRow[] {
  const ingredients: IngredientRow[] = [];

  // Calculate remaining flour and water after preferment
  let finalFlour = recipe.flourWeight;
  let finalWater = recipe.waterWeight;

  if (state.prefermentType !== 'none' && prefIngredients) {
    finalFlour = recipe.flourWeight - prefIngredients.flour;
    finalWater = recipe.waterWeight - prefIngredients.water;
  }

  if (state.wholeGrain > 0) {
    // When using preferment, apply percentage to final flour
    const whiteFlourFinal = Math.round(finalFlour * (100 - state.wholeGrain) / 100);
    const wholeGrainFinal = finalFlour - whiteFlourFinal;
    ingredients.push({
      name: 'Bread Flour',
      weight: whiteFlourFinal,
      percent: 100 - state.wholeGrain,
      note: state.prefermentType !== 'none' ? '(remaining)' : ''
    });
    ingredients.push({
      name: 'Whole Wheat Flour',
      weight: wholeGrainFinal,
      percent: state.wholeGrain,
      note: ''
    });
  } else {
    ingredients.push({
      name: 'Flour',
      weight: finalFlour,
      percent: 100,
      note: state.prefermentType !== 'none' ? '(remaining)' : ''
    });
  }

  ingredients.push({
    name: 'Water',
    weight: finalWater,
    percent: state.hydration,
    note: state.prefermentType !== 'none' ? '(adjust for preferment)' : ''
  });

  ingredients.push({
    name: 'Salt',
    weight: recipe.saltWeight,
    percent: state.salt,
    note: ''
  });

  // Add preferment as ingredient if active
  if (state.prefermentType !== 'none' && prefIngredients) {
    const prefData = PREFERMENT_DATA[state.prefermentType];
    ingredients.push({
      name: `All of the ${prefData.name}`,
      weight: prefIngredients.flour + prefIngredients.water,
      percent: -1, // Special marker for no percentage
      note: ''
    });
  }

  // Yeast/Starter with appropriate naming. It is listed with or without a preferment:
  // calculateRecipe() sizes the flour with the yeast or starter inside the total dough, and a
  // preferment only moves flour and water out of the rows above. Leaving this row off made
  // the list come up short of the stated total by the starter's weight.
  const yeastNames: Record<string, string> = {
    'starter': 'Sourdough Starter',
    'instant': 'Instant Yeast',
    'active-dry': 'Active Dry Yeast',
    'fresh': 'Fresh Yeast'
  };
  ingredients.push({
    name: yeastNames[state.yeastType] || 'Yeast',
    weight: recipe.yeastWeight,
    percent: state.yeastPercent,
    note: ''
  });

  // Add enrichments if enabled
  if (enrichmentState.fat.enabled) {
    const fatName = enrichmentState.fat.type === 'butter' ? 'Butter' : 'Oil';
    ingredients.push({
      name: fatName,
      weight: recipe.enrichments.fat,
      percent: enrichmentState.fat.percent,
      note: ''
    });
  }

  if (enrichmentState.eggs.enabled) {
    const eggName = enrichmentState.eggs.type === 'whole' ? 'Eggs' :
                   enrichmentState.eggs.type === 'yolks' ? 'Egg Yolks' : 'Egg Whites';
    ingredients.push({
      name: `${eggName} (${enrichmentState.eggs.count})`,
      weight: recipe.enrichments.eggs,
      percent: Math.round((recipe.enrichments.eggs / recipe.flourWeight) * 100),
      note: ''
    });
  }

  if (enrichmentState.sweet.enabled) {
    const sweetName = enrichmentState.sweet.type.charAt(0).toUpperCase() + enrichmentState.sweet.type.slice(1);
    ingredients.push({
      name: sweetName,
      weight: recipe.enrichments.sweet,
      percent: enrichmentState.sweet.percent,
      note: ''
    });
  }

  return ingredients;
}

/**
 * Hydration with the starter's own flour and water counted in, as a percentage, or null when
 * the dough is not raised with a starter. The hydration slider stays water ÷ flour without
 * the starter; this is the second number bakers ask for. It is worked from the percentages,
 * not the rounded grams, so the same recipe reads the same at any batch size.
 */
export function hydrationWithStarter(state: RecipeState): number | null {
  if (state.yeastType !== 'starter') return null;
  const starterFlour = state.yeastPercent / (1 + state.starterHydration / 100);
  const starterWater = state.yeastPercent - starterFlour;
  return ((state.hydration + starterWater) / (100 + starterFlour)) * 100;
}

/** The small line under the ingredient list, or null when no starter is used. */
export function starterHydrationNote(state: RecipeState): string | null {
  const hydration = hydrationWithStarter(state);
  if (hydration === null || !Number.isFinite(hydration)) return null;
  return `With the starter's flour and water counted, hydration is ${Math.round(hydration * 10) / 10}%.`;
}

/** The text the "Copy" button puts on the clipboard. */
export function recipeCopyText(state: RecipeState, recipe: Recipe): string {
  const styleName = state.style.charAt(0).toUpperCase() + state.style.slice(1);
  return `${styleName} Bread Recipe\n\nMakes ${state.numLoaves} loaves\n\nIngredients:\n- Flour: ${recipe.flourWeight}g (100%)\n- Water: ${recipe.waterWeight}g (${state.hydration}%)\n- Salt: ${recipe.saltWeight}g (${state.salt}%)\n- ${state.yeastType === 'starter' ? 'Starter' : 'Yeast'}: ${recipe.yeastWeight}g (${state.yeastPercent}%)\n\nInstructions:\n${state.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n\nGenerated by The Dough Formula - thedoughformula.com`;
}

// ============================================
// URL parameters (share links and calculator hand-offs)
// ============================================

export interface UrlRecipeParams {
  style?: string;
  loaves?: number;
  weight?: number;
  hydration?: number;
}

/** What a homepage URL asks for. Hydration counts only between 50 and 95. */
export function parseUrlRecipeParams(params: URLSearchParams): UrlRecipeParams {
  const out: UrlRecipeParams = {};
  if (params.has('style')) {
    out.style = params.get('style') ?? undefined;
  }
  if (params.has('loaves')) {
    out.loaves = parseInt(params.get('loaves') || '2');
  }
  if (params.has('weight')) {
    out.weight = parseInt(params.get('weight') || '900');
  }
  if (params.has('hydration')) {
    const h = parseFloat(params.get('hydration') || '75');
    if (!isNaN(h) && h >= 50 && h <= 95) {
      out.hydration = h;
    }
  }
  return out;
}

/** Puts the URL's loaves, weight and hydration into the state. The style is applied by the
 *  page first (it clicks the style card), so it is not handled here. */
export function applyUrlRecipeParams(state: RecipeState, p: UrlRecipeParams): void {
  if (p.loaves !== undefined) state.numLoaves = p.loaves;
  if (p.weight !== undefined) state.loafWeight = p.weight;
  if (p.hydration !== undefined) state.hydration = p.hydration;
}
