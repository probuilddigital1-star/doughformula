import type { ShapeFamily } from './recipes';

export type Merchant = 'amazon' | 'direct';

export interface Product {
  id: string;
  name: string;
  blurb: string;
  merchant: Merchant;
  /** Required when merchant === 'amazon'. */
  asin?: string;
  /** Required when merchant === 'direct': the full affiliate URL that program issues. */
  href?: string;
  /** Link text, e.g. 'Breadtopia'. Defaults to 'Amazon' for amazon products. */
  merchantLabel?: string;
}

// All ten products are Amazon today. The `direct` shape exists so links from other
// programs (Brød & Taylor, Breadtopia, Challenger) can join a gear set later with a
// data edit and no model change. No prices: Amazon requires they come from its API
// or not appear at all.
export const PRODUCTS: Record<string, Product> = {
  'lodge-combo-cooker': {
    id: 'lodge-combo-cooker',
    name: 'Lodge Combo Cooker',
    blurb: 'The go-to choice for home bakers. Shallow lid makes loading dough safer and easier.',
    merchant: 'amazon',
    asin: 'B0009JKG9M',
  },
  'escali-scale': {
    id: 'escali-scale',
    name: 'Escali Primo Scale',
    blurb: 'NY Times recommended. 11 lb capacity, 1g accuracy, simple two-button operation.',
    merchant: 'amazon',
    asin: 'B0007GAWRS',
  },
  'oxo-bench-scraper': {
    id: 'oxo-bench-scraper',
    name: 'OXO Bench Scraper',
    blurb: 'Stainless steel blade with measurement markings. Comfortable non-slip grip.',
    merchant: 'amazon',
    asin: 'B00004OCNJ',
  },
  'banneton-set': {
    id: 'banneton-set',
    name: 'Banneton Basket Set',
    blurb: 'Round & oval baskets with liners, lame, and scrapers. Premium Indonesian rattan.',
    merchant: 'amazon',
    asin: 'B08G4ZPZBZ',
  },
  'ufo-lame': {
    id: 'ufo-lame',
    name: 'UFO Bread Lame',
    blurb: 'Handcrafted walnut wood handle with secure blade storage. Includes extra blades.',
    merchant: 'amazon',
    asin: 'B08CTCHYDT',
  },
  thermapen: {
    id: 'thermapen',
    name: 'ThermoWorks Thermapen',
    blurb: 'Pro-grade accuracy in 1 second. Check water temp and bread doneness (190-210°F).',
    merchant: 'amazon',
    asin: 'B0DG71Q1LZ',
  },
  'thermichef-steel': {
    id: 'thermichef-steel',
    name: 'ThermiChef 16-Inch Baking Steel',
    blurb: 'Quarter-inch steel stores and transfers far more heat than a stone. Slide baguettes or ciabatta straight onto it for a fast, crisp bottom crust. Made in the USA.',
    merchant: 'amazon',
    asin: 'B0BR5ZLMFP',
  },
  'saint-germain-couche': {
    id: 'saint-germain-couche',
    name: 'Saint Germain Bakery Couche',
    blurb: 'Heavy French flax linen holds shaped baguettes and ciabatta in place while they proof, and wicks just enough moisture to set the skin for scoring.',
    merchant: 'amazon',
    asin: 'B06XXXQVNZ',
  },
  'usa-pan-9x13': {
    id: 'usa-pan-9x13',
    name: 'USA Pan 9x13 Rectangular Pan',
    blurb: 'Aluminized steel with a corrugated base bakes an even, deeply browned focaccia bottom. The two-inch sides give a high-hydration dough room to rise.',
    merchant: 'amazon',
    asin: 'B0029JOC6I',
  },
  'usa-pan-loaf': {
    id: 'usa-pan-loaf',
    name: 'USA Pan 9x5 Loaf Pan',
    blurb: 'Commercial-grade aluminized steel in the standard 9x5 size. Straight walls and a corrugated base produce a tall, evenly browned sandwich or brioche loaf.',
    merchant: 'amazon',
    asin: 'B002UNMZOO',
  },
};

export type GearFamily = ShapeFamily | 'universal';

/** Gear shown for a bake: universal items plus the set for the style's shape family. */
export const GEAR_SETS: Record<GearFamily, string[]> = {
  universal: ['escali-scale', 'oxo-bench-scraper', 'thermapen'],
  'dutch-oven': ['lodge-combo-cooker', 'banneton-set', 'ufo-lame'],
  'steam-stone': ['thermichef-steel', 'saint-germain-couche', 'ufo-lame'],
  'sheet-pan': ['usa-pan-9x13'],
  'loaf-pan': ['usa-pan-loaf'],
};

/** The homepage grid, in the exact order the hardcoded version used. */
export const HOMEPAGE_PRODUCTS: string[] = [
  'lodge-combo-cooker',
  'escali-scale',
  'oxo-bench-scraper',
  'banneton-set',
  'ufo-lame',
  'thermapen',
];

// One Amazon tracking id per placement so Associates reports show which one earns.
// Create the two new ids in Associates Central (Account Settings > Manage Your Tracking IDs)
// and replace the values below. Until then every placement falls back to the original tag.
export const TRACKING_IDS = {
  homepage: 'probuild20-20',
  recipe: 'probuild20-20', // replace with tdf-recipe-20 once created
  calculator: 'probuild20-20', // replace with tdf-calc-20 once created
} as const;

export function productUrl(p: Product, trackingId: string): string {
  if (p.merchant === 'amazon') return `https://www.amazon.com/dp/${p.asin}?tag=${trackingId}`;
  return p.href!;
}

/** Calculator style ids (index.astro breadStyles) to gear family. `custom` gets universal only. */
export const CALCULATOR_STYLE_FAMILY: Record<string, GearFamily> = {
  sourdough: 'dutch-oven',
  'no-knead': 'dutch-oven',
  baguette: 'steam-stone',
  ciabatta: 'steam-stone',
  focaccia: 'sheet-pan',
  sandwich: 'loaf-pan',
  brioche: 'loaf-pan',
  custom: 'universal',
};
