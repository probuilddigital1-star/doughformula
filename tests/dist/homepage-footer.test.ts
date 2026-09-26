import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('homepage footer', () => {
  const home = distFile('index.html');
  const footers = home.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/g) ?? [];

  it('renders exactly one <footer>', () => {
    expect(footers).toHaveLength(1);
  });

  it('is the shared SiteFooter, with the Guides group and the build-time year', () => {
    const [footer] = footers;
    expect(footer).toContain('Guides');
    expect(footer).toContain(`&copy; ${new Date().getFullYear()} The Dough Formula`);
  });

  it('no longer ships the old inline footer', () => {
    expect(home).not.toContain('Made with care for home bakers everywhere');
    expect(home).not.toContain('Stay Updated');
  });

  it('keeps the newsletter anchor for future links', () => {
    expect(home).toContain('id="newsletter"');
  });
});

describe('footer newsletter link', () => {
  it('links to the Kit landing page on the homepage and on a recipe page', () => {
    for (const rel of ['index.html', 'recipes/sourdough-75-overnight/index.html']) {
      const footer = distFile(rel).match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)![0];
      expect(footer, rel).toMatch(/<a href="https:\/\/thedoughformula\.kit\.com"[^>]*>Newsletter<\/a>/);
    }
  });
});
