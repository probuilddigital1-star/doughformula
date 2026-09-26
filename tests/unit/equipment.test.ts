import { describe, it, expect } from 'vitest';
import {
  PRODUCTS,
  GEAR_SETS,
  HOMEPAGE_PRODUCTS,
  TRACKING_IDS,
  CALCULATOR_STYLE_FAMILY,
  productUrl,
  hasDirectMerchant,
  ALL_GEAR_PRODUCT_IDS,
  FEATURED_GEAR,
} from '../../src/data/equipment';

const ASIN = /^[A-Z0-9]{10}$/;

describe('PRODUCTS', () => {
  it('every amazon product has a valid ASIN and no href; every direct product has an https href', () => {
    for (const [id, p] of Object.entries(PRODUCTS)) {
      expect(p.id).toBe(id);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.blurb.length).toBeGreaterThan(0);
      if (p.merchant === 'amazon') {
        expect(p.asin, id).toMatch(ASIN);
        expect(p.href, id).toBeUndefined();
      } else {
        expect(p.href, id).toMatch(/^https:\/\//);
        expect(p.merchantLabel, id).toBeTruthy();
      }
    }
  });

  it('carries the six original homepage products with their original ASINs', () => {
    expect(PRODUCTS['lodge-combo-cooker'].asin).toBe('B0009JKG9M');
    expect(PRODUCTS['escali-scale'].asin).toBe('B0007GAWRS');
    expect(PRODUCTS['oxo-bench-scraper'].asin).toBe('B00004OCNJ');
    expect(PRODUCTS['banneton-set'].asin).toBe('B08G4ZPZBZ');
    expect(PRODUCTS['ufo-lame'].asin).toBe('B08CTCHYDT');
    expect(PRODUCTS['thermapen'].asin).toBe('B0DG71Q1LZ');
  });

  it('carries the four new products', () => {
    expect(PRODUCTS['thermichef-steel'].asin).toBe('B0BR5ZLMFP');
    expect(PRODUCTS['saint-germain-couche'].asin).toBe('B06XXXQVNZ');
    expect(PRODUCTS['usa-pan-9x13'].asin).toBe('B0029JOC6I');
    expect(PRODUCTS['usa-pan-loaf'].asin).toBe('B002UNMZOO');
  });

  it('no blurb contains an em dash or a price', () => {
    for (const p of Object.values(PRODUCTS)) {
      expect(p.blurb, p.id).not.toMatch(/—|\$\d/);
    }
  });
});

describe('GEAR_SETS', () => {
  it('references only known product ids', () => {
    for (const [family, ids] of Object.entries(GEAR_SETS)) {
      for (const id of ids) expect(PRODUCTS[id], `${family}: ${id}`).toBeDefined();
    }
  });

  it('covers universal and all four shape families', () => {
    expect(Object.keys(GEAR_SETS).sort()).toEqual(['dutch-oven', 'loaf-pan', 'sheet-pan', 'steam-stone', 'universal']);
  });

  it('never repeats a product between universal and a family set', () => {
    for (const [family, ids] of Object.entries(GEAR_SETS)) {
      if (family === 'universal') continue;
      for (const id of ids) expect(GEAR_SETS.universal, `${family}: ${id}`).not.toContain(id);
    }
  });
});

describe('HOMEPAGE_PRODUCTS', () => {
  it('is the original six in the original order', () => {
    expect(HOMEPAGE_PRODUCTS).toEqual([
      'lodge-combo-cooker',
      'escali-scale',
      'oxo-bench-scraper',
      'banneton-set',
      'ufo-lame',
      'thermapen',
    ]);
  });
});

describe('TRACKING_IDS', () => {
  it('has all three placements set to Amazon tag format', () => {
    for (const id of Object.values(TRACKING_IDS)) expect(id).toMatch(/^[a-z0-9-]+-20$/);
  });
});

describe('productUrl', () => {
  it('builds an Amazon dp link with the tracking id', () => {
    expect(productUrl(PRODUCTS['lodge-combo-cooker'], 'probuild20-20')).toBe(
      'https://www.amazon.com/dp/B0009JKG9M?tag=probuild20-20',
    );
  });

  it('returns the href unchanged for a direct merchant', () => {
    const direct = {
      id: 'x',
      name: 'X',
      blurb: 'x',
      merchant: 'direct' as const,
      href: 'https://example.com/?ref=tdf',
      merchantLabel: 'Example',
    };
    expect(productUrl(direct, 'ignored-20')).toBe('https://example.com/?ref=tdf');
  });
});

describe('CALCULATOR_STYLE_FAMILY', () => {
  it('maps every calculator style id', () => {
    expect(Object.keys(CALCULATOR_STYLE_FAMILY).sort()).toEqual(
      ['baguette', 'brioche', 'ciabatta', 'custom', 'focaccia', 'no-knead', 'sandwich', 'sourdough'],
    );
  });

  it('maps to real gear families', () => {
    for (const fam of Object.values(CALCULATOR_STYLE_FAMILY)) expect(GEAR_SETS[fam]).toBeDefined();
  });

  it('matches the recipe data where styles overlap', () => {
    expect(CALCULATOR_STYLE_FAMILY.sourdough).toBe('dutch-oven');
    expect(CALCULATOR_STYLE_FAMILY.baguette).toBe('steam-stone');
    expect(CALCULATOR_STYLE_FAMILY.focaccia).toBe('sheet-pan');
    expect(CALCULATOR_STYLE_FAMILY.sandwich).toBe('loaf-pan');
    expect(CALCULATOR_STYLE_FAMILY.custom).toBe('universal');
  });
});

describe('hasDirectMerchant', () => {
  it('is false for every plain gear list (all Amazon; direct merchants are featured separately)', () => {
    expect(hasDirectMerchant(ALL_GEAR_PRODUCT_IDS)).toBe(false);
    expect(hasDirectMerchant([])).toBe(false);
  });

  it('is true as soon as a direct-merchant product is in the list', () => {
    PRODUCTS['__test-direct'] = { id: '__test-direct', name: 'Test', blurb: 'Test.', merchant: 'direct', href: 'https://example.com/?ref=tdf', merchantLabel: 'Example' };
    try {
      expect(hasDirectMerchant(['escali-scale', '__test-direct'])).toBe(true);
    } finally {
      delete PRODUCTS['__test-direct'];
    }
  });

  it('ALL_GEAR_PRODUCT_IDS covers every id in every gear set exactly once', () => {
    const all = Object.values(GEAR_SETS).flat();
    for (const id of all) expect(ALL_GEAR_PRODUCT_IDS).toContain(id);
    expect(new Set(ALL_GEAR_PRODUCT_IDS).size).toBe(ALL_GEAR_PRODUCT_IDS.length);
  });
});

describe('Challenger Bread Pan', () => {
  const BASE = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital';
  const p = PRODUCTS['challenger-bread-pan'];

  it('is a direct merchant reported as challenger, with no ASIN', () => {
    expect(p.merchant).toBe('direct');
    expect(p.merchantId).toBe('challenger');
    expect(p.merchantLabel).toBe('Challenger');
    expect(p.asin).toBeUndefined();
    expect(p.imageAlt).toBeTruthy();
  });

  it('carries the approved blurb and no price', () => {
    expect(p.blurb).toBe(
      'Cast iron with a shallow base you load dough onto instead of dropping it into a hot pot. The tall lid traps steam over a round or oval loaf.',
    );
    expect(`${p.name} ${p.blurb}`).not.toMatch(/\$\d/);
  });

  it('tags each placement with its own campaign', () => {
    expect(productUrl(p, TRACKING_IDS.recipe)).toBe(`${BASE}&campaign=recipe`);
    expect(productUrl(p, TRACKING_IDS.calculator)).toBe(`${BASE}&campaign=calculator`);
    expect(productUrl(p, TRACKING_IDS.recipe, 'recipe_step')).toBe(`${BASE}&campaign=recipe-step`);
  });

  it('is featured for the dutch-oven family only and never in a plain gear list', () => {
    expect(FEATURED_GEAR).toEqual({ 'dutch-oven': 'challenger-bread-pan' });
    for (const ids of Object.values(GEAR_SETS)) expect(ids).not.toContain('challenger-bread-pan');
    expect(HOMEPAGE_PRODUCTS).not.toContain('challenger-bread-pan');
  });

  it('leaves the Dutch oven list as it was, Lodge included', () => {
    expect(GEAR_SETS['dutch-oven']).toEqual(['lodge-combo-cooker', 'banneton-set', 'ufo-lame']);
  });
});

describe('Amazon tracking ids', () => {
  it('are unchanged', () => {
    expect(TRACKING_IDS).toEqual({ homepage: 'probuild20-20', recipe: 'tdf-recipe-20', calculator: 'tdf-calc-20' });
  });
});
