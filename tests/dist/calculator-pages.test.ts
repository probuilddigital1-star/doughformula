import { describe, it, expect } from 'vitest';
import { distFile, distFileExists } from './helpers';
import { GEAR_SETS, PRODUCTS, TRACKING_IDS } from '../../src/data/equipment';
import { NEWSLETTER_ENABLED } from '../../src/config/newsletter';

const SITE = 'https://thedoughformula.com';
const CHALLENGER = 'https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=calculator';

interface PageSpec {
  path: string;
  slug: string;
  /** Footer link text. */
  footerLabel: string;
  title: string;
  h1: string;
  description: string;
  faq: string[];
  tabs: string[];
  handoffHref: string;
  links: string[];
}

const PAGES: PageSpec[] = [
  {
    path: '/hydration-calculator/',
    slug: 'hydration-calculator',
    footerLabel: 'Hydration Calculator',
    title: 'Bread Hydration Calculator | The Dough Formula',
    h1: 'Bread Hydration Calculator',
    description:
      'Work out water from flour and hydration, hydration from a recipe, or the flour and water split for a target dough weight. Accounts for starter water.',
    faq: [
      'How do I calculate hydration?',
      'Does starter count toward hydration?',
      'What hydration should I use for sourdough?',
      'Why does my 75% dough feel like 85%?',
      'Can I change hydration after mixing?',
    ],
    tabs: ['water-from-flour', 'hydration-from-recipe', 'split-dough-weight'],
    handoffHref: '/?loaves=1&weight=875&hydration=75#calculator',
    links: [
      '/fundamentals/hydration-60-to-90/',
      '/recipes/sourdough-65-overnight/',
      '/recipes/sourdough-75-overnight/',
      '/recipes/sourdough-82-overnight/',
      '/recipes/focaccia-82-overnight/',
    ],
  },
  {
    path: '/bakers-percentage-calculator/',
    slug: 'bakers-percentage-calculator',
    footerLabel: "Baker's Percentage Calculator",
    title: "Baker's Percentage Calculator | The Dough Formula",
    h1: "Baker's Percentage Calculator",
    description:
      "Convert any bread recipe to baker's percentages, or turn percentages into gram weights for a chosen flour amount. Includes a salt calculator.",
    faq: [
      "What is a baker's percentage?",
      'Why is flour 100%?',
      'How do I convert a recipe?',
      'How much salt per 500g of flour?',
      'How do I handle a preferment?',
    ],
    tabs: ['recipe-to-percentages', 'percentages-to-grams'],
    handoffHref: '/?loaves=1&weight=960&hydration=72.7#calculator',
    links: [
      '/fundamentals/bakers-percentages-explained/',
      '/fundamentals/preferments-101/',
      '/ingredients/role-of-salt-in-bread/',
    ],
  },
];

const decode = (s: string) =>
  s.replace(/&#38;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

function jsonLd(html: string): any[] {
  return (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? []).map((b) =>
    JSON.parse(b.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')),
  );
}

function describeCalculatorPage(p: PageSpec) {
  describe(p.path, () => {
    const html = distFile(`${p.slug}/index.html`);
    const canonical = `${SITE}${p.path}`;

    it('has the exact title, H1 and meta description, and is self-canonical', () => {
      expect(text(html.match(/<title>([\s\S]*?)<\/title>/)![1])).toBe(p.title);
      const h1s = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/g) ?? [];
      expect(h1s).toHaveLength(1);
      expect(text(h1s[0])).toBe(p.h1);
      expect(decode(html.match(/<meta name="description" content="([^"]*)"/)![1])).toBe(p.description);
      expect(html).toContain(`<link rel="canonical" href="${canonical}"`);
    });

    it('does not use "bread calculator" in its title or H1', () => {
      expect(p.title.toLowerCase()).not.toContain('bread calculator');
      expect(text(html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/)![0]).toLowerCase()).not.toContain('bread calculator');
    });

    it('emits one WebApplication, one FAQPage and one BreadcrumbList, all valid JSON', () => {
      const blocks = jsonLd(html);
      const byType = (t: string) => blocks.filter((b) => b['@type'] === t);
      expect(byType('WebApplication')).toHaveLength(1);
      expect(byType('FAQPage')).toHaveLength(1);
      expect(byType('BreadcrumbList')).toHaveLength(1);

      const app = byType('WebApplication')[0];
      expect(app.name).toBe(p.h1);
      expect(app.url).toBe(canonical);
      expect(app.applicationCategory).toBe('UtilityApplication');
      expect(app.operatingSystem).toBe('Any');
      expect(app.offers.price).toBe('0');

      const faq = byType('FAQPage')[0];
      expect(faq.mainEntity.map((q: any) => q.name)).toEqual(p.faq);
      for (const q of faq.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(80);

      const crumbs = byType('BreadcrumbList')[0].itemListElement;
      expect(crumbs.map((c: any) => c.item)).toEqual([`${SITE}/`, canonical]);
    });

    it('renders the same FAQ questions it declares', () => {
      const faqSection = html.slice(html.indexOf('id="faq"'), html.indexOf('</main>'));
      const rendered = (faqSection.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/g) ?? []).map(text);
      expect(rendered).toEqual(p.faq);
    });

    it('selects the first tab on load', () => {
      const tabs = html.match(/<button[^>]*role="tab"[^>]*>/g) ?? [];
      expect(tabs.map((t) => t.match(/data-mode="([^"]+)"/)![1])).toEqual(p.tabs);
      expect(tabs[0]).toContain('aria-selected="true"');
      for (const t of tabs.slice(1)) expect(t).toContain('aria-selected="false"');
    });

    it('hands off to the homepage calculator with the existing URL parameters and tracking data', () => {
      const a = html.match(/<a[^>]*data-handoff[^>]*>/)![0];
      expect(decode(a.match(/href="([^"]*)"/)![1])).toBe(p.handoffHref);
      expect(a).toContain(`data-from-page="${p.slug}"`);
      expect(a).toContain('data-to-page="homepage-calculator"');
      expect(a).toContain(`data-tab="${p.tabs[0]}"`);
      expect(html).toContain('Open in the full bread calculator');
    });

    it('orders tool, gear block, newsletter, prose, FAQ', () => {
      const order = ['id="tool"', 'id="gear-block"', ...(NEWSLETTER_ENABLED ? ['id="newsletter"'] : []), 'id="guide"', 'id="faq"'];
      const idx = order.map((m) => html.indexOf(m));
      for (const i of idx) expect(i).toBeGreaterThan(-1);
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    });

    it('newsletter renders only when Kit is configured', () => {
      if (NEWSLETTER_ENABLED) {
        expect(html).toContain('id="newsletter-form"');
        expect(html).toMatch(/data-kit-form-id="\d+"/);
        expect(html).toMatch(/data-kit-api-key="[^"]+"/);
      } else {
        expect(html).not.toContain('id="newsletter-form"');
      }
    });

    describe('gear block', () => {
      const start = html.indexOf('id="gear-block"');
      const block = html.slice(start, html.indexOf('</aside>', start));

      it('has the heading, the universal and Dutch oven products, and the featured Challenger card', () => {
        expect(block).toContain('Gear for this bake');
        for (const id of [...GEAR_SETS.universal, ...GEAR_SETS['dutch-oven']]) expect(block, id).toContain(PRODUCTS[id].name);
        expect(block.match(/data-featured-gear=/g)).toHaveLength(1);
        expect(block).toContain('See it at Challenger');
        expect(block.match(/View on Challenger/g)).toBeNull();
      });

      it('every link carries the calculator tag or campaign, with sponsored and nofollow', () => {
        const anchors = block.match(/<a [^>]*>/g) ?? [];
        expect(anchors.length).toBe(GEAR_SETS.universal.length + GEAR_SETS['dutch-oven'].length + 1);
        for (const a of anchors) {
          const href = decode(a.match(/href="([^"]*)"/)![1]);
          expect(href.endsWith(`?tag=${TRACKING_IDS.calculator}`) || href === CHALLENGER, a).toBe(true);
          expect(a).toMatch(/rel="[^"]*\bsponsored\b[^"]*"/);
          expect(a).toMatch(/rel="[^"]*\bnofollow\b[^"]*"/);
          expect(a).toContain('data-placement="calculator"');
        }
        const challenger = anchors.find((a) => a.includes('challengerbreadware.com'))!;
        expect(challenger).toContain('data-merchant="challenger"');
      });

      it('has exactly one Amazon disclosure, with the other-retailers line', () => {
        expect(block.match(/As an Amazon Associate I earn from qualifying purchases\./g)).toHaveLength(1);
        expect(block).toContain('Some links go to other retailers who also pay me a commission.');
      });

      it('featured image is lazy and sized', () => {
        const img = block.match(/<img[^>]*>/)![0];
        expect(img).toContain('loading="lazy"');
        expect(img).toMatch(/ width="\d+"/);
        expect(img).toMatch(/ height="\d+"/);
        expect(img).toMatch(/ alt="[^"]{10,}"/);
      });
    });

    it('links to its related pages, and every one exists', () => {
      for (const l of p.links) {
        expect(html, l).toContain(`href="${l}`);
        expect(distFileExists(`${l.split('#')[0].replace(/^\//, '')}index.html`), l).toBe(true);
      }
    });

    it("doesn't repeat the homepage's baker's percentage section", () => {
      expect(html).not.toContain('Understanding Baker&#39;s Percentages');
      expect(html).not.toContain("Understanding Baker's Percentages");
    });

    it('has no em dashes in its copy', () => {
      const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
      expect(main).not.toContain('—');
      for (const b of jsonLd(html)) expect(JSON.stringify(b)).not.toContain('—');
    });
  });
}

for (const p of PAGES) describeCalculatorPage(p);

describe('/bakers-percentage-calculator/ specifics', () => {
  const html = distFile('bakers-percentage-calculator/index.html');

  it('has the #salt section with its H2 and a 1.5 to 2.5 input defaulting to 2.0', () => {
    const start = html.indexOf('id="salt"');
    expect(start).toBeGreaterThan(-1);
    const salt = html.slice(start, html.indexOf('</section>', start));
    expect(text(salt.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/)![0])).toBe('Salt in bread calculator');
    const input = salt.match(/<input[^>]*id="salt-pct"[^>]*>/)![0];
    expect(input).toContain('value="2.0"');
    expect(input).toContain('min="1.5"');
    expect(input).toContain('max="2.5"');
    expect(input).toContain('step="0.1"');
    expect(salt).toMatch(/id="salt-grams">10</);
    expect(salt).toContain('href="/ingredients/role-of-salt-in-bread/"');
  });

  it('salt sits between the tool and the gear block', () => {
    expect(html.indexOf('id="tool"')).toBeLessThan(html.indexOf('id="salt"'));
    expect(html.indexOf('id="salt"')).toBeLessThan(html.indexOf('id="gear-block"'));
  });

  it('server-renders the four-line sourdough at 100 / 70 / 2 / 20', () => {
    const panel = html.slice(html.indexOf('id="panel-recipe-to-percentages"'), html.indexOf('id="panel-percentages-to-grams"'));
    const list = panel.slice(0, panel.indexOf('<template'));
    expect(list.match(/class="[^"]*calc-row/g)).toHaveLength(4);
    for (const n of ['Bread flour', 'Water', 'Salt', 'Starter']) expect(list).toContain(`value="${n}"`);
    const outs = [...list.matchAll(/<output[^>]*>([^<]*)<\/output>/g)].map((m) => m[1]);
    expect(outs).toEqual(['100%', '70%', '2%', '20%']);
    for (const g of ['500', '350', '10', '100']) expect(list).toContain(`value="${g}"`);
  });
});

describe('footer Tools group', () => {
  for (const rel of ['index.html', 'recipes/sourdough-75-overnight/index.html']) {
    it(`links the calculators from ${rel}, in place of Built For`, () => {
      const footer = distFile(rel).match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)![0];
      expect(footer).toMatch(/>Tools<\/h3>/);
      expect(footer).not.toContain('Built For');
      expect(footer).toMatch(/<a href="\/#calculator"[^>]*>Bread Calculator<\/a>/);
      for (const p of PAGES) {
        const a = footer.match(new RegExp(`<a href="${p.path}"[^>]*>([^<]*)</a>`));
        expect(a, p.path).not.toBeNull();
        expect(decode(a![1])).toBe(p.footerLabel);
      }
      expect(footer.match(/md:grid-cols-4/g)).toHaveLength(1);
    });
  }
});

describe('article cross-links to the calculator pages', () => {
  const cases: [string, string][] = [
    ['fundamentals/hydration-60-to-90/index.html', '/hydration-calculator/'],
    ['fundamentals/bakers-percentages-explained/index.html', '/bakers-percentage-calculator/'],
    ['ingredients/role-of-salt-in-bread/index.html', '/bakers-percentage-calculator/#salt'],
  ];
  for (const [rel, href] of cases) {
    it(`${rel} links ${href}`, () => {
      const html = distFile(rel);
      const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
      expect(main).toContain(`href="${href}"`);
    });
  }
});
