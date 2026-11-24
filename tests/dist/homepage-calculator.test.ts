import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { distFile } from './helpers';
import { BREAD_STYLES } from '../../src/lib/bread-styles';
import {
  blendForWholeGrain,
  calculateRecipe,
  createDefaultEnrichments,
  createDefaultState,
  estimateFermentationTimes,
  formatWeight,
  ingredientRows,
  starterHydrationNote,
  yeastSliderRange,
} from '../../src/lib/bread-calculator';

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

describe('homepage default recipe in the server HTML', () => {
  // The script does not render on a plain visit: the default recipe is server-rendered by the
  // calculator's own code. These checks hold the two together.
  const state = createDefaultState();
  const enrichments = createDefaultEnrichments();
  const blend = blendForWholeGrain(state.wholeGrain);
  const recipe = calculateRecipe(state, enrichments, blend);
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const inner = (id: string, tag = 'div') => home.match(new RegExp(`<${tag}[^>]*id="${id}"[^>]*>([\\s\\S]*?)</${tag}>\\s*<(p|/div)`))![1];

  it('lists the default ingredient rows, exactly as the script draws them', () => {
    const rows = ingredientRows(state, enrichments, recipe);
    const expected = rows.map((r) => `${r.name}${r.note ? ` ${r.note}` : ''} ${formatWeight(state, r.weight)}${r.percent >= 0 ? ` (${r.percent}%)` : ''}`).join(' ');
    expect(text(inner('ingredients-list'))).toBe(expected);
    expect(expected).toBe('Bread Flour 823g (90%) Whole Wheat Flour 91g (10%) Water 686g (75%) Salt 18g (2%) Sourdough Starter 183g (20%)');
  });

  it('lists the Sourdough steps', () => {
    const list = home.match(/<ol[^>]*id="instructions-list"[^>]*>([\s\S]*?)<\/ol>/)![1];
    const steps = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
    expect(steps).toEqual(BREAD_STYLES[0].instructions.map((step, i) => `${i + 1} ${step}`));
  });

  it('starts the Yeast, Flour and Timing tabs on the values the script would set', () => {
    const range = yeastSliderRange(state.yeastType);
    const slider = home.match(/<input[^>]*id="yeast-percent-slider"[^>]*>/)![0];
    expect(slider).toContain(`min="${range.min}"`);
    expect(slider).toContain(`max="${range.max}"`);
    expect(slider).toContain(`step="${range.step}"`);
    expect(slider).toContain(`value="${state.yeastPercent}"`);
    expect(home).toContain(`<span id="starter-flour-contrib" class="font-medium">${recipe.starterFlourContrib}g</span>`);
    expect(home).toContain(`<span id="starter-water-contrib" class="font-medium">${recipe.starterWaterContrib}g</span>`);
    // Bread flour 90% and whole wheat 10%, both slots showing.
    expect(blend).toEqual([{ type: 'bread', percent: 90 }, { type: 'whole-wheat', percent: 10 }]);
    expect(home).toMatch(/<input type="number" class="flour-percent-input[^"]*" value="90" min="0" max="100" data-flour="0">/);
    expect(home).toMatch(/<input type="number" class="flour-percent-input[^"]*" value="10" min="0" max="100" data-flour="1">/);
    expect(home.match(/<div id="flour-slot-1" class="([^"]*)"/)![1]).not.toMatch(/\bhidden\b/);
    expect(home.match(/<div id="flour-slot-2" class="([^"]*)"/)![1]).toMatch(/\bhidden\b/);
    const times = estimateFermentationTimes(state);
    for (const [id, value] of [['bulk-time', times.bulk], ['proof-time', times.proof], ['total-time', times.total]]) {
      expect(home).toMatch(new RegExp(`id="${id}">${value}<`));
    }
  });

  it('the script renders on load only when the link sets something', () => {
    const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');
    const init = src.slice(src.lastIndexOf('// Initialize'), src.lastIndexOf('</script>'));
    expect(init).toMatch(/if \(window\.location\.search\) \{[\s\S]*loadFromURL\(\);[\s\S]*\}/);
    expect(init).not.toMatch(/^  updateUI\(\);/m);
    // The page starts on the same blend the server HTML shows.
    expect(src).toContain('const flourBlend: FlourEntry[] = calc.blendForWholeGrain(state.wholeGrain);');
  });
});

describe('homepage preferment "Ready when" lines', () => {
  // The controls box and the recipe card each show a "Ready when" line. They once shared one id,
  // so the script updated the first and the card's line stayed on the poolish text.
  const ids = [...home.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const readyIds = [...home.matchAll(/<p[^>]*\sid="([^"]+)"[^>]*>\s*Ready when:/g)].map((m) => m[1]);

  it('uses every id on the page once', () => {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('gives the controls box and the recipe card their own line, and the script fills both', () => {
    const src = readFileSync(join(process.cwd(), 'src/pages/index.astro'), 'utf8');
    expect(readyIds).toHaveLength(2);
    expect(new Set(readyIds).size).toBe(2);
    for (const id of readyIds) {
      expect(src.includes(`getElementById('${id}')`), id).toBe(true);
    }
  });
});
