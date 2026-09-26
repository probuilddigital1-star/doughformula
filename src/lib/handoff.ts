// The "Open in the full bread calculator" link. It uses the URL parameters the homepage's
// loadFromURL() already reads: loaves, weight (grams per loaf, parsed as an integer; the
// field allows 200 to 2000) and hydration (ignored there outside 50 to 95). The homepage
// defaults to two loaves, so loaves=1 keeps the dough weight the page showed.

const DEFAULT_HYDRATION = 75;
const DEFAULT_WEIGHT = 900;

export function handoffHref(h: { hydration: number; weight: number }): string {
  const hydration = Number.isFinite(h.hydration)
    ? Math.min(95, Math.max(50, Math.round(h.hydration * 10) / 10))
    : DEFAULT_HYDRATION;
  const weight = Number.isFinite(h.weight) && h.weight > 0
    ? Math.min(2000, Math.max(200, Math.round(h.weight)))
    : DEFAULT_WEIGHT;
  return `/?loaves=1&weight=${weight}&hydration=${hydration}#calculator`;
}
