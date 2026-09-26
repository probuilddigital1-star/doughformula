// The "Open in the full bread calculator" link on the calculator pages.
//
// The homepage calculator (src/pages/index.astro) reads three URL parameters in
// loadFromURL(): loaves, weight (grams per loaf) and hydration (applied only between 50 and
// 95). Its calculateRecipe() then treats loaves × weight as the TOTAL dough, including salt
// and starter, and works backwards:
//
//   flour = round(total / (1 + hydration/100 + salt/100 + starter/100))
//   water = round(flour × hydration / 100)
//
// A hand-off carries no style, so salt and starter come from the homepage's default
// Sourdough style: 2% salt, 20% starter. To make the homepage land on the user's own flour
// and water, this link sends hydration = water ÷ flour (the user's flour and water only,
// never starter water) and a weight built forward from the user's flour with that same
// formula. The homepage then adds its own salt and starter on top.
//
// tests/unit/handoff.test.ts checks these defaults against index.astro so the two can't
// drift apart silently.

export const HOMEPAGE_SALT_PCT = 2;
export const HOMEPAGE_STARTER_PCT = 20;
/** The homepage's loaf weight field tops out at 2000 g; bigger doughs split into more loaves. */
export const HOMEPAGE_MAX_LOAF_G = 2000;
export const HANDOFF_FALLBACK = '/#calculator';

const HYDRATION_MIN = 50;
const HYDRATION_MAX = 95;

/**
 * Link that opens the homepage calculator with `flour` grams of flour at `hydration` percent
 * (water ÷ flour). Hydration outside 50 to 95 is clamped, since the homepage ignores it
 * otherwise; the flour still carries over. Without a usable flour weight the link opens the
 * calculator with its own defaults.
 */
export function handoffHref(h: { flour: number; hydration: number }): string {
  if (!Number.isFinite(h.flour) || h.flour <= 0 || !Number.isFinite(h.hydration)) return HANDOFF_FALLBACK;
  const hydration = Math.min(HYDRATION_MAX, Math.max(HYDRATION_MIN, Math.round(h.hydration * 10) / 10));
  const total = h.flour * (1 + hydration / 100 + HOMEPAGE_SALT_PCT / 100 + HOMEPAGE_STARTER_PCT / 100);
  const loaves = Math.max(1, Math.ceil(total / HOMEPAGE_MAX_LOAF_G));
  const weight = Math.max(1, Math.round(total / loaves));
  return `/?loaves=${loaves}&weight=${weight}&hydration=${hydration}#calculator`;
}
