import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Tailwind v4 emits its utilities inside `@layer utilities`. Any unlayered rule in
// global.css beats every layered rule regardless of specificity, so an unlayered
// `.flour-dusted > *` (position: relative; z-index: 2) silently overrides `fixed`,
// `inset-0`, `z-50` and `sticky` on direct children of <body>: the schedule modal,
// the toast and the site nav. The rule must live inside a cascade layer.
const SELECTOR = '.flour-dusted>*';

function distCss(): { file: string; css: string }[] {
  const dir = join(process.cwd(), 'dist', '_astro');
  if (!existsSync(dir)) throw new Error(`Missing ${dir}. Run "npm run build" first.`);
  return readdirSync(dir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => ({ file: name, css: readFileSync(join(dir, name), 'utf8') }));
}

/** Index of the `}` that closes the block opened at `open` (index of a `{`). Skips quoted strings. */
function closeOf(css: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < css.length; i++) {
    const c = css[i];
    if (c === '\\') {
      i++; // escaped char, inside a string or in an escaped selector such as .before\:content-\[\'\'\]
      continue;
    }
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  throw new Error('Unbalanced braces in CSS');
}

/** Every `@layer <names>{...}` block, with its layer name list and body. */
function layerBlocks(css: string): { names: string; body: string; start: number; end: number }[] {
  const out: { names: string; body: string; start: number; end: number }[] = [];
  const re = /@layer\s+([^{;]+)([{;])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    if (m[2] === ';') continue; // `@layer a, b;` ordering statement, no body
    const open = m.index + m[0].length - 1;
    const close = closeOf(css, open);
    out.push({ names: m[1].trim(), body: css.slice(open + 1, close), start: m.index, end: close + 1 });
    re.lastIndex = close + 1;
  }
  return out;
}

/** The CSS that is not inside any `@layer` block. */
function unlayered(css: string): string {
  let out = '';
  let pos = 0;
  for (const b of layerBlocks(css)) {
    out += css.slice(pos, b.start);
    pos = b.end;
  }
  return out + css.slice(pos);
}

describe('global.css cascade layers', () => {
  const sheets = distCss();

  it('ships the flour-dusted child rule', () => {
    expect(sheets.some(({ css }) => css.includes(SELECTOR))).toBe(true);
  });

  it('never emits the flour-dusted child rule outside a cascade layer', () => {
    for (const { file, css } of sheets) {
      expect(unlayered(css), `${file} has an unlayered ${SELECTOR} rule`).not.toContain(SELECTOR);
    }
  });

  it('puts the flour-dusted child rule in the components layer, below utilities', () => {
    const inComponents = sheets.some(({ css }) =>
      layerBlocks(css).some((b) => b.names.split(',').map((s) => s.trim()).includes('components') && b.body.includes(SELECTOR)),
    );
    expect(inComponents).toBe(true);
  });
});
