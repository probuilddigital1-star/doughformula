import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');

function requireDist(): void {
  if (!existsSync(DIST)) throw new Error(`Missing ${DIST}. Run "npm run build" first.`);
}

/** Read one built file by path relative to dist/, e.g. "index.html" or "privacy/index.html". */
export function distFile(rel: string): string {
  requireDist();
  const p = join(DIST, rel);
  if (!existsSync(p)) throw new Error(`Missing ${p}`);
  return readFileSync(p, 'utf8');
}

/** Every .html file under dist/, with its path and contents. */
export function allDistHtml(): { path: string; html: string }[] {
  requireDist();
  const out: { path: string; html: string }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.html')) out.push({ path: p, html: readFileSync(p, 'utf8') });
    }
  };
  walk(DIST);
  return out;
}

export function distFileExists(rel: string): boolean {
  requireDist();
  return existsSync(join(DIST, rel));
}
