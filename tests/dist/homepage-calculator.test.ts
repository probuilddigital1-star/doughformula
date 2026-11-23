import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { distFile } from './helpers';
import { createDefaultState, starterHydrationNote } from '../../src/lib/bread-calculator';

const home = distFile('index.html');

describe('homepage recipe card', () => {
  it('server-renders the starter hydration line under the ingredient list for the default recipe', () => {
    const list = home.indexOf('id="ingredients-list"');
    const note = home.match(/<p id="starter-hydration-note" class="([^"]*)">([^<]*)<\/p>/)!;
    expect(home.indexOf(note[0])).toBeGreaterThan(list);
    expect(home.indexOf(note[0])).toBeLessThan(home.indexOf('id="water-temp"'));
    expect(note[1]).not.toMatch(/\bhidden\b/);
    expect(note[2].replace(/&#39;/g, "'")).toBe(starterHydrationNote(createDefaultState()));
    expect(note[2]).toContain('hydration is 77.3%.');
  });

  it('fills that line from the shared calculator code', () => {
    const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');
    expect(src).toContain('const starterNote = calc.starterHydrationNote(state);');
    expect(src).toContain("starterNoteEl.classList.toggle('hidden', starterNote === null);");
  });
});

describe('homepage Advanced Options', () => {
  it('is expanded by default in the server HTML', () => {
    const trigger = home.match(/<button[^>]*id="advanced-trigger"[^>]*>/)![0];
    expect(trigger).toContain('aria-expanded="true"');
    expect(trigger).toContain('aria-controls="advanced-content"');
    const content = home.match(/<div[^>]*id="advanced-content"[^>]*>/)![0];
    expect(content).not.toMatch(/\bhidden\b/);
    const chevron = home.match(/<svg[^>]*id="advanced-chevron"[^>]*>/)![0];
    expect(chevron).toMatch(/style="transform:\s*rotate\(180deg\)"/);
  });

  it('shows the Basics tab first', () => {
    const content = home.slice(home.indexOf('id="advanced-content"'));
    expect(content).toMatch(/class="advanced-tab advanced-tab-active" data-tab="basics"/);
  });
});
