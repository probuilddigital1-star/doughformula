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
