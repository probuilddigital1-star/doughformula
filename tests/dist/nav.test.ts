import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

const CALCULATORS: [string, string][] = [
  ['/#calculator', 'Bread Calculator'],
  ['/hydration-calculator/', 'Hydration Calculator'],
  ['/bakers-percentage-calculator/', 'Baker&#39;s Percentage Calculator'],
];

const PAGES = ['index.html', 'recipes/sourdough-75-overnight/index.html', 'hydration-calculator/index.html', 'about/index.html'];

function nav(html: string): string {
  return html.match(/<nav class="sticky[\s\S]*?<\/nav>/)![0];
}

describe('header Calculators menu', () => {
  for (const rel of PAGES) {
    describe(rel, () => {
      const n = nav(distFile(rel));

      it('has a collapsed disclosure button wired to its list', () => {
        const button = n.match(/<button[^>]*id="calc-menu-button"[^>]*>/)![0];
        expect(button).toContain('type="button"');
        expect(button).toContain('aria-expanded="false"');
        expect(button).toContain('aria-controls="calc-menu-list"');
        expect(n).toMatch(/Calculators\s*<svg/);
        const list = n.match(/<ul[^>]*id="calc-menu-list"[^>]*>/)![0];
        expect(list).toMatch(/class="[^"]*\bhidden\b/);
        // Positioned out of flow, so opening it never changes the nav's height.
        expect(list).toMatch(/class="[^"]*\babsolute\b/);
      });

      it('lists the three calculators in the dropdown, tagged for tool_link_click', () => {
        const list = n.slice(n.indexOf('id="calc-menu-list"'), n.indexOf('</ul>'));
        for (const [href, label] of CALCULATORS) {
          expect(list).toMatch(new RegExp(`<a href="${href.replace(/[/#]/g, '\\$&')}"[^>]*data-tool-link="nav"[^>]*>${label}</a>`));
        }
      });

      it('lists the three calculators directly in the mobile menu', () => {
        const mobile = n.slice(n.indexOf('id="mobile-nav"'));
        for (const [href, label] of CALCULATORS) {
          expect(mobile).toMatch(new RegExp(`<a href="${href.replace(/[/#]/g, '\\$&')}"[^>]*data-tool-link="nav_mobile"[^>]*>${label}</a>`));
        }
      });

      it('keeps the existing nav links', () => {
        for (const href of ['/guides/', '/recipes/', '/about/']) expect(n).toContain(`href="${href}"`);
        expect(n).toContain('Begin Your Bake');
      });
    });
  }
});

describe('footer Tools links are tagged for tool_link_click', () => {
  it('on the homepage', () => {
    const footer = distFile('index.html').match(/<footer\b[\s\S]*?<\/footer>/)![0];
    for (const [href] of CALCULATORS) {
      expect(footer).toMatch(new RegExp(`<a href="${href.replace(/[/#]/g, '\\$&')}"[^>]*data-tool-link="footer"`));
    }
  });
});
