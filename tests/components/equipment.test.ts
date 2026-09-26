import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect, beforeAll } from 'vitest';
import EquipmentGrid from '../../src/components/EquipmentGrid.astro';
import AffiliateDisclosure from '../../src/components/AffiliateDisclosure.astro';
import FeaturedGearCard from '../../src/components/FeaturedGearCard.astro';
import { TRACKING_IDS } from '../../src/data/equipment';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('EquipmentGrid (cards)', () => {
  it('renders one card per product with a sponsored Amazon link carrying the tracking id', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['lodge-combo-cooker', 'escali-scale'], trackingId: 'test-20' },
    });
    expect(html).toContain('Lodge Combo Cooker');
    expect(html).toContain('Escali Primo Scale');
    expect(html.match(/rel="sponsored nofollow noopener noreferrer"/g)).toHaveLength(2);
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html).toContain('href="https://www.amazon.com/dp/B0009JKG9M?tag=test-20"');
    expect(html).toContain('View on Amazon');
    expect(html).not.toContain('~$');
  });

  it('renders heading and intro when given', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['thermapen'], trackingId: 't-20', heading: 'Essential Bread Equipment', intro: 'Intro copy' },
    });
    expect(html).toContain('<h2');
    expect(html).toContain('Essential Bread Equipment');
    expect(html).toContain('Intro copy');
  });

  it('includes the full Amazon disclosure by default and omits the other-retailers sentence for all-Amazon lists', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['thermapen'], trackingId: 't-20' },
    });
    expect(html).toContain('Affiliate Disclosure');
    expect(html).toContain('As an Amazon Associate I earn from qualifying purchases.');
    expect(html).not.toContain('other retailers');
  });

  it('omits the disclosure when disclosure is false', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['thermapen'], trackingId: 't-20', disclosure: false },
    });
    expect(html).not.toContain('Amazon Associate');
  });

  it('throws on an unknown product id', async () => {
    await expect(
      container.renderToString(EquipmentGrid, { props: { productIds: ['nope'], trackingId: 't-20' } }),
    ).rejects.toThrow('unknown product id');
  });
});

describe('EquipmentGrid (compact)', () => {
  it('renders a list, not cards, and the compact disclosure', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['escali-scale', 'oxo-bench-scraper'], trackingId: 'c-20', compact: true },
    });
    expect(html).toContain('<ul');
    expect(html).not.toContain('class="card');
    expect(html).toContain('?tag=c-20');
    expect(html).toContain('As an Amazon Associate I earn from qualifying purchases.');
    expect(html).not.toContain('Affiliate Disclosure:');
  });
});

describe('AffiliateDisclosure', () => {
  it('compact variant is one sentence for Amazon-only lists', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: { compact: true } });
    expect(html).toContain('As an Amazon Associate I earn from qualifying purchases.');
    expect(html).not.toContain('other retailers');
  });

  it('appends the other-retailers sentence when hasDirect is true', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: { compact: true, hasDirect: true } });
    expect(html).toContain('Some links go to other retailers who also pay me a commission.');
  });

  it('full variant keeps the original homepage wording', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: {} });
    expect(html).toContain('<strong>Affiliate Disclosure:</strong>');
    expect(html).toContain('Thank you for supporting The Dough Formula!');
  });
});

describe('EquipmentGrid with a featured card nearby', () => {
  it('adds the other-retailers sentence when directNearby is set', async () => {
    const html = await container.renderToString(EquipmentGrid, {
      props: { productIds: ['thermapen'], trackingId: 't-20', directNearby: true },
    });
    expect(html).toContain('Some links go to other retailers who also pay me a commission.');
  });
});

describe('FeaturedGearCard', () => {
  const BASE = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital';

  it('renders the Challenger card with label, name, blurb, image and a tagged sponsored button', async () => {
    const html = await container.renderToString(FeaturedGearCard, {
      props: { productId: 'challenger-bread-pan', trackingId: TRACKING_IDS.recipe },
    });
    expect(html).toContain('Featured pick');
    expect(html).toContain('Challenger Bread Pan');
    expect(html).toContain('shallow base you load dough onto');
    expect(html).toContain('See it at Challenger');
    expect(html).toContain(`href="${BASE}&campaign=recipe"`);
    expect(html).toMatch(/rel="sponsored nofollow[^"]*"/);
    expect(html).toContain('data-merchant="challenger"');
    expect(html).toContain('data-placement="recipe"');
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';
    expect(img).toMatch(/ width="360"/);
    expect(img).toMatch(/ height="240"/);
    expect(img).toContain('loading="lazy"');
    expect(img).toMatch(/ alt="[^"]{10,}"/);
  });

  it('tags the calculator placement', async () => {
    const html = await container.renderToString(FeaturedGearCard, {
      props: { productId: 'challenger-bread-pan', trackingId: TRACKING_IDS.calculator },
    });
    expect(html).toContain(`href="${BASE}&campaign=calculator"`);
    expect(html).toContain('data-placement="calculator"');
  });

  it('renders nothing for an Amazon product', async () => {
    const html = await container.renderToString(FeaturedGearCard, {
      props: { productId: 'lodge-combo-cooker', trackingId: TRACKING_IDS.recipe },
    });
    expect(html).not.toContain('Featured pick');
    expect(html).not.toContain('<img');
  });
});
