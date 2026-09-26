// What /bakers-percentage-calculator/ displays for a set of raw input values. The page
// renders its defaults through these on the server and calls them on every input, so the
// empty-input rules and the hand-off can be unit tested without a browser.
import { roundG, roundPct } from './hydration';
import { saltGrams, type RowKind } from './bakers-percentage';
import { DASH, grams, isAmount, isWeight, parseInput, percent } from './calculator-display';
import { handoffHref, HANDOFF_FALLBACK } from './handoff';

/** One ingredient row as typed: `amount` is grams or percent depending on the mode. */
export interface RowInput {
  name: string;
  kind: RowKind;
  amount: string;
}

export interface RowsView {
  /** One result per row, in order: a percent in recipe mode, grams in percentages mode. */
  outs: string[];
  flourTotal: string;
  doughTotal: string;
  handoff: string;
}

const sumKind = (amounts: number[], rows: RowInput[], kind: RowKind) =>
  rows.reduce((t, r, i) => (r.kind === kind && isAmount(amounts[i]) ? t + amounts[i] : t), 0);

/** The homepage adds its own salt and starter, so the hand-off carries flour and water only. */
function handoffFor(flourG: number, waterG: number): string {
  return isWeight(flourG) ? handoffHref({ flour: flourG, hydration: (waterG / flourG) * 100 }) : HANDOFF_FALLBACK;
}

/** Recipe to percentages: rows in grams, percent of total flour out. */
export function recipeToPercentagesView(rows: RowInput[]): RowsView {
  const g = rows.map((r) => parseInput(r.amount));
  const flour = sumKind(g, rows, 'flour');
  const water = sumKind(g, rows, 'water');
  const dough = rows.reduce((t, _r, i) => (isAmount(g[i]) ? t + g[i] : t), 0);
  const haveFlour = isWeight(flour);
  return {
    outs: g.map((v) => percent(haveFlour && isAmount(v) ? roundPct((v / flour) * 100) : null)),
    flourTotal: haveFlour ? `${roundG(flour)} g (100%)` : DASH,
    doughTotal: dough > 0 ? `${roundG(dough)} g` : DASH,
    handoff: handoffFor(flour, water),
  };
}

/** Percentages to grams: total flour in grams plus a percent per row, grams out. Flour rows
 *  share the flour weight by their percentages. */
export function percentagesToGramsView(flourRaw: string, rows: RowInput[]): RowsView {
  const flourG = parseInput(flourRaw);
  const p = rows.map((r) => parseInput(r.amount));
  const haveFlour = isWeight(flourG);
  const g = p.map((v) => (haveFlour && isAmount(v) ? roundG((flourG * v) / 100) : null));
  const flourPct = sumKind(p, rows, 'flour');
  const sumGrams = (kind?: RowKind) =>
    g.reduce<number>((t, v, i) => (v !== null && (!kind || rows[i].kind === kind) ? t + v : t), 0);
  const dough = sumGrams();
  return {
    outs: g.map(grams),
    flourTotal: `${roundPct(flourPct)}%`,
    doughTotal: haveFlour && dough > 0 ? `${dough} g` : DASH,
    handoff: haveFlour ? handoffFor(sumGrams('flour'), sumGrams('water')) : HANDOFF_FALLBACK,
  };
}

/** Salt section: flour grams and a percent in, salt grams out (percent clamped to 1.5 to 2.5). */
export function saltView(flourRaw: string, pctRaw: string): string {
  const flour = parseInput(flourRaw);
  const pct = parseInput(pctRaw);
  return isWeight(flour) && isAmount(pct) ? grams(saltGrams(flour, pct)) : DASH;
}
