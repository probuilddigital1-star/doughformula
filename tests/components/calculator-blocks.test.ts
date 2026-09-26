import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect, beforeAll } from 'vitest';
import CalculatorGearBlock from '../../src/components/CalculatorGearBlock.astro';
import NewsletterSection from '../../src/components/NewsletterSection.astro';
import { GEAR_SETS, PRODUCTS, TRACKING_IDS } from '../../src/data/equipment';
import { NEWSLETTER_ENABLED } from '../../src/config/newsletter';

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const CHALLENGER = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=calculator';

describe('CalculatorGearBlock', () => {
  it('renders the Dutch oven block with the featured Challenger card by default', async () => {
    const html = await container.renderToString(CalculatorGearBlock);
    expect(html).toContain('id="gear-block"');
    expect(html).toContain('Gear for this bake');
    for (const id of [...GEAR_SETS.universal, ...GEAR_SETS['dutch-oven']]) expect(html, id).toContain(PRODUCTS[id].name);
    expect(html).toContain('Featured pick');
    expect(html).toContain(`href="${CHALLENGER}"`);
    expect(html).toContain('data-placement="calculator"');
    expect(html.match(/View on Challenger/g)).toBeNull();
  });

  it('tags every link for the calculator placement, sponsored and nofollow', async () => {
    const html = await container.renderToString(CalculatorGearBlock);
    const anchors = html.match(/<a [^>]*>/g) ?? [];
    expect(anchors.length).toBe(GEAR_SETS.universal.length + GEAR_SETS['dutch-oven'].length + 1);
    for (const a of anchors) {
      expect(a.includes(`?tag=${TRACKING_IDS.calculator}"`) || a.includes(`href="${CHALLENGER}"`), a).toBe(true);
      expect(a, a).toMatch(/rel="[^"]*\bsponsored\b[^"]*\bnofollow\b[^"]*"/);
    }
  });

  it('carries one Amazon disclosure with the other-retailers line', async () => {
    const html = await container.renderToString(CalculatorGearBlock);
    expect(html.match(/As an Amazon Associate I earn from qualifying purchases\./g)).toHaveLength(1);
    expect(html).toContain('Some links go to other retailers who also pay me a commission.');
  });

  it('shows no card and no other-retailers line for a family without a featured product', async () => {
    const html = await container.renderToString(CalculatorGearBlock, { props: { family: 'steam-stone' } });
    expect(html).not.toContain('Featured pick');
    expect(html).not.toContain('challengerbreadware.com');
    expect(html).not.toContain('other retailers');
  });
});

describe('NewsletterSection', () => {
  it('matches the homepage form contract when Kit is configured', async () => {
    const html = await container.renderToString(NewsletterSection);
    if (!NEWSLETTER_ENABLED) {
      expect(html).not.toContain('newsletter-form');
      return;
    }
    expect(html).toContain('id="newsletter"');
    expect(html).toContain('id="newsletter-form"');
    expect(html).toMatch(/data-kit-form-id="\d+"/);
    expect(html).toMatch(/data-kit-api-key="[^"]+"/);
    expect(html).toContain('name="email"');
    expect(html).toContain('An occasional email when a new recipe or tool goes up. Unsubscribe anytime.');
  });
});
