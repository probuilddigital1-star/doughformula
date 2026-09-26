// What /hydration-calculator/ displays for a set of raw input values. The page renders the
// defaults through this on the server and calls it on every input event, so both paths show
// the same thing and the rules can be unit tested without a browser.
import { hydrationFromRecipe, splitDough, waterFromFlour } from './hydration';
import { grams, isAmount, isWeight, parseInput, percent } from './calculator-display';
import { handoffHref, HANDOFF_FALLBACK } from './handoff';

export type HydrationMode = 'water-from-flour' | 'hydration-from-recipe' | 'split-dough-weight';

/** Raw input values, keyed by input element id. */
export interface HydrationInputs {
  'wf-flour': string;
  'wf-hydration': string;
  'hr-flour': string;
  'hr-water': string;
  'hr-starter': string;
  'hr-starter-h': string;
  'sd-total': string;
  'sd-hydration': string;
}

export const HYDRATION_DEFAULTS: HydrationInputs = {
  'wf-flour': '500',
  'wf-hydration': '75',
  'hr-flour': '450',
  'hr-water': '300',
  'hr-starter': '100',
  'hr-starter-h': '100',
  'sd-total': '900',
  'sd-hydration': '75',
};

/** Result texts keyed by output element id, plus the hand-off link for the active mode. */
export interface HydrationView {
  values: Record<string, string>;
  handoff: string;
}

export function hydrationView(mode: HydrationMode, raw: HydrationInputs): HydrationView {
  const n = (id: keyof HydrationInputs) => parseInput(raw[id]);
  const values: Record<string, string> = {};
  const handoffs: Record<HydrationMode, string> = {
    'water-from-flour': HANDOFF_FALLBACK,
    'hydration-from-recipe': HANDOFF_FALLBACK,
    'split-dough-weight': HANDOFF_FALLBACK,
  };

  // Water from flour: flour and hydration required.
  {
    const flour = n('wf-flour');
    const h = n('wf-hydration');
    const ok = isWeight(flour) && isAmount(h);
    values['wf-water'] = grams(ok ? waterFromFlour(flour, h) : null);
    if (ok) handoffs['water-from-flour'] = handoffHref({ flour, hydration: h });
  }

  // Hydration from a recipe: flour and water required; starter optional, and its hydration
  // only matters when there is starter.
  {
    const flour = n('hr-flour');
    const water = n('hr-water');
    const starterRaw = n('hr-starter');
    const starter = Number.isNaN(starterRaw) ? 0 : starterRaw;
    const sh = n('hr-starter-h');
    const ok = isWeight(flour) && isAmount(water) && isAmount(starter) && (starter === 0 || isAmount(sh));
    const r = ok ? hydrationFromRecipe({ flour, water, starter, starterHydration: sh }) : null;
    values['hr-hydration'] = percent(r ? r.hydration : null);
    values['hr-starter-flour'] = grams(r ? r.starterFlour : null);
    values['hr-starter-water'] = grams(r ? r.starterWater : null);
    values['hr-total-flour'] = grams(r ? r.totalFlour : null);
    values['hr-total-water'] = grams(r ? r.totalWater : null);
    // The homepage adds its own starter, so it gets the recipe's flour and water without the
    // starter's share.
    if (ok) handoffs['hydration-from-recipe'] = handoffHref({ flour, hydration: (water / flour) * 100 });
  }

  // Split a dough weight: total and hydration required.
  {
    const total = n('sd-total');
    const h = n('sd-hydration');
    const ok = isWeight(total) && isAmount(h);
    const s = ok ? splitDough(total, h) : null;
    values['sd-flour'] = grams(s ? s.flour : null);
    values['sd-water'] = grams(s ? s.water : null);
    if (s && s.flour > 0) handoffs['split-dough-weight'] = handoffHref({ flour: s.flour, hydration: h });
  }

  return { values, handoff: handoffs[mode] };
}
