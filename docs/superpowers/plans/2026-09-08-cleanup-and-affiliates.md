# Cleanup, Newsletter, and Affiliate Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead AdSense integration, make the newsletter form real (Kit), and extend Amazon Associates to recipe pages and the calculator, in one release that changes nothing the site currently ranks on.

**Architecture:** Astro 5 static site. Deletions strip every AdSense artifact (script, preconnects, component, config, `ads.txt`, lazy injectors, privacy section). A new `src/data/equipment.ts` holds products, gear sets keyed by `shapeFamily`, tracking IDs, and URL building; two new components (`EquipmentGrid`, `AffiliateDisclosure`) render it in three placements. The newsletter posts client-side to Kit's v3 public-key endpoint and renders only when configured. Vitest is added for unit tests (data module), component tests (Astro container API), and build-output assertions over `dist/`.

**Tech Stack:** Astro ^5.16, Tailwind 4, TypeScript, Node 22, Vitest ^3 (peer Vite `^5 || ^6`, so it shares Astro's Vite 6 rather than hoisting a second Vite major) with `getViteConfig` from `astro/config` and `experimental_AstroContainer` from `astro/container`.

**Spec:** `docs/superpowers/specs/2026-09-07-cleanup-and-affiliates-design.md`

## Global Constraints

- The homepage title tag, H1, URL, content structure, and calculator formula code do not change. Homepage edits are limited to: removing ad slots, subsetting fonts, conditionally rendering the newsletter section, swapping the hardcoded equipment grid for the same six products rendered from data, and adding a gear `<aside>` below `#recipe-card`.
- Recipe pages and articles are additive only.
- Amazon compliance: disclosure on every page with a link; no prices; no product images; `rel="noopener noreferrer sponsored"` on every affiliate link; link text names the merchant.
- Writing style (project memory): no em dashes; none of the banned phrases; no three-item rule-of-three constructions in new prose.
- No third-party scripts are added. Kit is reached by `fetch` only.
- Commit messages: imperative subject, no prefix, matching repo history. Every commit ends with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r
  ```
- Work happens on branch `cleanup-and-affiliates`. Do not push; the user pushes after local verification.
- Build output tests require `npm run build` first. `dist/` and `node_modules/` are git-ignored.

---

## File Structure

**Delete**
- `src/components/AdUnit.astro`, `src/config/ads.ts`, `public/ads.txt`

**Create**
- `vitest.config.ts`: Vitest wired through Astro's Vite config so `.astro` imports work in tests.
- `tests/unit/newsletter.test.ts`: predicate for newsletter enablement.
- `tests/unit/equipment.test.ts`: data integrity and URL building for the equipment module.
- `tests/components/equipment.test.ts`: renders `EquipmentGrid` and `AffiliateDisclosure` via the container API.
- `tests/dist/helpers.ts`: read built HTML from `dist/`.
- `tests/dist/adsense.test.ts`, `tests/dist/fonts.test.ts`, `tests/dist/privacy.test.ts`, `tests/dist/newsletter.test.ts`, `tests/dist/affiliates.test.ts`: assertions over built pages.
- `src/config/newsletter.ts`: Kit form id and public key (empty until the user supplies them) plus the enablement predicate.
- `src/data/equipment.ts`: products, gear sets, tracking IDs, `productUrl`, calculator style map.
- `src/components/AffiliateDisclosure.astro`: the Amazon disclosure in full and compact variants.
- `src/components/EquipmentGrid.astro`: renders a list of products as cards or a compact list, with disclosure.

**Modify**
- `package.json`: vitest devDependency and test scripts.
- `src/layouts/Layout.astro`: remove ad preconnects and script; remove stale Fraunces preload; subset the fonts URL.
- `src/layouts/ArticleLayout.astro`, `src/layouts/RecipeLayout.astro`: remove `AdUnit` and lazy injectors; RecipeLayout gains the gear section.
- `src/pages/recipes/index.astro`, `src/pages/[category]/index.astro`: remove in-feed `AdUnit`.
- `src/pages/index.astro`: remove two `AdUnit`s; newsletter conditional plus Kit handler; equipment grid from data; gear `<aside>` plus `updateUI()` toggle.
- `src/pages/privacy.astro`: drop AdSense section; add newsletter and Amazon Associates paragraphs.
- `src/data/recipes.ts`: export `ShapeFamily`.

---

### Task 1: Test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: `npm run test:unit` (unit and component tests), `npm run test:dist` (builds, then runs `tests/dist`), `npm test` (both).

- [ ] **Step 1: Install dependencies and vitest**

Run:
```bash
npm ci
npm install --save-dev vitest@^3
```
Expected: `node_modules/` exists; `package.json` devDependencies contains `"vitest": "^3.x"`; no `--legacy-peer-deps` was needed. Vitest 3 declares peer Vite `^5 || ^6`, so it reuses the top-level Vite 6 that Astro already installs. Do not use vitest 4: its peer range admits Vite 8, which npm hoists to the top level and forces Astro to nest its own Vite 6 while `@tailwindcss/vite` resolves the hoisted one.

Then confirm the lockfile changed only for vitest and its dependencies:
```bash
git diff --stat HEAD -- package-lock.json
npm ls astro vite vitest @tailwindcss/vite --depth=0
```
Expected: `astro@5.16.x`, one `vite@6.4.x`, `vitest@3.x`, `@tailwindcss/vite@4.1.x`, and `npm ls` reports no nested or duplicated `vite`. If `astro` or `@tailwindcss/vite` show a different version than before the install, stop: restore `package-lock.json` from git and retry.

Then confirm the site still builds under the new tree:
```bash
npm run build
```
Expected: `93 page(s) built`, no errors.

- [ ] **Step 2: Add test scripts**

In `package.json`, replace the `scripts` block:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "npm run test:unit && npm run test:dist",
    "test:unit": "vitest run tests/unit tests/components",
    "test:dist": "astro build && vitest run tests/dist"
  },
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write a smoke test**

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm run test:unit`
Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/unit/smoke.test.ts
git commit -m "Add Vitest harness wired through Astro's Vite config" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 2: Remove AdSense

**Files:**
- Delete: `src/components/AdUnit.astro`, `src/config/ads.ts`, `public/ads.txt`
- Modify: `src/layouts/Layout.astro`, `src/layouts/ArticleLayout.astro`, `src/layouts/RecipeLayout.astro`, `src/pages/index.astro`, `src/pages/recipes/index.astro`, `src/pages/[category]/index.astro`
- Create: `tests/dist/helpers.ts`, `tests/dist/adsense.test.ts`

**Interfaces:**
- Produces: `distFile(rel: string): string` and `allDistHtml(): { path: string; html: string }[]` in `tests/dist/helpers.ts`, used by every later dist test.

- [ ] **Step 1: Write the dist helper**

Create `tests/dist/helpers.ts`:

```ts
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
```

- [ ] **Step 2: Write the failing test**

Create `tests/dist/adsense.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { allDistHtml, distFileExists } from './helpers';

const BANNED = ['googlesyndication', 'doubleclick.net', 'googletagservices', 'adsbygoogle', 'Advertisement'];

describe('AdSense removal', () => {
  it('no built page references Google ad infrastructure', () => {
    const offenders: string[] = [];
    for (const { path, html } of allDistHtml()) {
      for (const needle of BANNED) {
        if (html.includes(needle)) offenders.push(`${path}: ${needle}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ads.txt is not published', () => {
    expect(distFileExists('ads.txt')).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test:dist`
Expected: build succeeds, then `2 failed` with offenders listed for every page and `ads.txt` present.

- [ ] **Step 4: Delete the AdSense files**

```bash
git rm src/components/AdUnit.astro src/config/ads.ts public/ads.txt
```

- [ ] **Step 5: Edit `src/layouts/Layout.astro`**

Remove this block (the comment and four link tags):

```html
    <!-- Preconnect for AdSense ad servers so the TLS handshake is warm when ads load -->
    <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin />
    <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossorigin />
    <link rel="preconnect" href="https://tpc.googlesyndication.com" crossorigin />
    <link rel="dns-prefetch" href="https://www.googletagservices.com" />

```

Remove this block:

```html
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7820884299125377" crossorigin="anonymous"></script>

```

Keep the two Google Fonts preconnects.

- [ ] **Step 6: Edit `src/layouts/ArticleLayout.astro`**

Remove these two import lines:

```ts
import AdUnit from '../components/AdUnit.astro';
import { AD_SLOTS, ADSENSE_CLIENT } from '../config/ads';
```

Remove this block:

```astro
      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>

```

Remove the entire lazy mid-article injector, which sits between `  </main>` and `</Layout>`:

```astro
  <script define:vars={{ midSlot: AD_SLOTS.articleMid, client: ADSENSE_CLIENT }}>
    (function () {
      if (!midSlot) return;
      const prose = document.querySelector('.prose');
      if (!prose) return;
      const firstH2 = prose.querySelector('h2');
      if (!firstH2) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'ad-slot my-12 mx-auto';
      wrapper.setAttribute('data-nosnippet', '');
      wrapper.style.minHeight = '260px';

      const label = document.createElement('p');
      label.className = 'text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3';
      label.textContent = 'Advertisement';
      wrapper.appendChild(label);

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', midSlot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      wrapper.appendChild(ins);

      firstH2.before(wrapper);

      if (!('IntersectionObserver' in window)) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        return;
      }
      const io = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            observer.disconnect();
            break;
          }
        }
      }, { rootMargin: '200px 0px' });
      io.observe(ins);
    })();
  </script>
```

After removal, `  </main>` is followed by a blank line and then `</Layout>`.

- [ ] **Step 7: Edit `src/layouts/RecipeLayout.astro`**

Remove these two import lines:

```ts
import AdUnit from '../components/AdUnit.astro';
import { AD_SLOTS, ADSENSE_CLIENT } from '../config/ads';
```

Remove this block:

```astro
      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>

```

Remove the entire lazy injector, which sits between `  </main>` and `</Layout>`:

```astro
  <script define:vars={{ midSlot: AD_SLOTS.articleMid, client: ADSENSE_CLIENT }}>
    (function () {
      if (!midSlot) return;
      const prose = document.querySelector('.prose');
      if (!prose) return;
      const firstH2 = prose.querySelector('h2');
      if (!firstH2) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'ad-slot my-12 mx-auto';
      wrapper.setAttribute('data-nosnippet', '');
      wrapper.style.minHeight = '260px';

      const label = document.createElement('p');
      label.className = 'text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3';
      label.textContent = 'Advertisement';
      wrapper.appendChild(label);

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', midSlot);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      wrapper.appendChild(ins);

      firstH2.before(wrapper);

      if (!('IntersectionObserver' in window)) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        return;
      }
      const io = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            observer.disconnect();
            break;
          }
        }
      }, { rootMargin: '200px 0px' });
      io.observe(ins);
    })();
  </script>
```

After removal, `  </main>` is followed by a blank line and then `</Layout>`.

- [ ] **Step 8: Edit `src/pages/recipes/index.astro`**

Remove these import lines:

```ts
import AdUnit from '../../components/AdUnit.astro';
import { AD_SLOTS } from '../../config/ads';
```

Replace:

```astro
        {combosWithMeta.map(({ combo, meta }, i) => {
          return [
            <RecipeCard combo={combo} meta={meta} />,
            i === 2 && combosWithMeta.length >= 4 ? (
              <AdUnit slot={AD_SLOTS.categoryInFeed} class="card !p-6 !my-0" minHeight="200px" />
            ) : null,
          ];
        })}
```

with:

```astro
        {combosWithMeta.map(({ combo, meta }) => (
          <RecipeCard combo={combo} meta={meta} />
        ))}
```

- [ ] **Step 9: Edit `src/pages/[category]/index.astro`**

Remove these import lines:

```ts
import AdUnit from '../../components/AdUnit.astro';
import { AD_SLOTS } from '../../config/ads';
```

Replace:

```astro
          {articlesWithReading.map(({ article, readingMinutes }: any, i: number) => {
            return [
              <ArticleCard article={article} readingMinutes={readingMinutes} />,
              i === 2 && articlesWithReading.length >= 4 ? (
                <AdUnit
                  slot={AD_SLOTS.categoryInFeed}
                  class="card !p-6 !my-0"
                  minHeight="200px"
                />
              ) : null,
            ];
          })}
```

with:

```astro
          {articlesWithReading.map(({ article, readingMinutes }: any) => (
            <ArticleCard article={article} readingMinutes={readingMinutes} />
          ))}
```

- [ ] **Step 10: Edit `src/pages/index.astro`**

Remove these import lines:

```ts
import AdUnit from '../components/AdUnit.astro';
import { AD_SLOTS } from '../config/ads';
```

Remove this block (after the newsletter section):

```astro
  <div class="container">
    <AdUnit slot={AD_SLOTS.homepagePostNewsletter} class="max-w-4xl" />
  </div>

```

Remove this block (before the FAQ section):

```astro
  <div class="container">
    <AdUnit slot={AD_SLOTS.homepagePreFaq} class="max-w-4xl" />
  </div>

```

- [ ] **Step 11: Run the dist tests**

Run: `npm run test:dist`
Expected: build succeeds with no import errors; `2 passed`.

- [ ] **Step 12: Commit**

```bash
git add -A src public tests/dist/helpers.ts tests/dist/adsense.test.ts
git commit -m "Remove AdSense script, slots, config, and ads.txt" -m "The account was never approved, so every slot rendered an empty box while loading ~370KB of ad and consent JavaScript per page.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 3: Subset fonts and drop the stale preload

**Files:**
- Modify: `src/layouts/Layout.astro`
- Create: `tests/dist/fonts.test.ts`

- [ ] **Step 1: Confirm no display-font italics are used**

Run:
```bash
grep -rn -E "font-display[^\"']*\bitalic\b|\bitalic\b[^\"']*font-display" src --include=*.astro --include=*.css --include=*.md
```
Expected: no output. (The known `italic` uses are body-font emphasis.) If anything prints, keep the Fraunces italic variants in Step 4 and only subset Cormorant.

- [ ] **Step 2: Write the failing test**

Create `tests/dist/fonts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('font loading', () => {
  const home = distFile('index.html');

  it('requests Cormorant Garamond at regular weight only', () => {
    expect(home).toContain('family=Cormorant+Garamond:wght@400&');
    expect(home).not.toContain('Cormorant+Garamond:ital');
  });

  it('does not request Fraunces italics', () => {
    expect(home).not.toContain('Fraunces:ital');
    expect(home).toContain('family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700');
  });

  it('does not preload the stale v32 Fraunces file', () => {
    expect(home).not.toContain('fonts.gstatic.com/s/fraunces/v32/');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test:dist`
Expected: the three font tests fail; AdSense tests still pass.

- [ ] **Step 4: Edit `src/layouts/Layout.astro`**

Remove the stale preload block:

```html
    <!-- Preload critical Fraunces font file (used in hero LCP text) -->
    <link
      rel="preload"
      href="https://fonts.gstatic.com/s/fraunces/v32/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1433ZfxGw.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

```

Then replace the fonts query string in all three places it appears (the `preload as="style"` link, the `stylesheet` link, and the `<noscript>` link). Old value:

```
family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&display=swap
```

New value:

```
family=Cormorant+Garamond:wght@400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap
```

- [ ] **Step 5: Run the dist tests**

Run: `npm run test:dist`
Expected: all pass.

- [ ] **Step 6: Check the fonts render**

Run: `npm run preview`, open `http://localhost:4321/`. Headings render in Fraunces, body in DM Sans, the hero lede in Cormorant. Open DevTools Network, filter `fonts.gstatic.com`: no `v32` request; at most one Fraunces file, one Cormorant file, one or two DM Sans files.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/Layout.astro tests/dist/fonts.test.ts
git commit -m "Subset web fonts and drop stale Fraunces preload" -m "Cormorant serves three lede paragraphs at regular weight. Fraunces italics were never used. The v32 preload no longer matched what Google Fonts serves, so it was a wasted request on every page.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 4: Privacy policy

**Files:**
- Modify: `src/pages/privacy.astro`
- Create: `tests/dist/privacy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/dist/privacy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('privacy policy', () => {
  const html = distFile('privacy/index.html');

  it('no longer describes AdSense', () => {
    expect(html).not.toContain('AdSense');
    expect(html).not.toContain('DoubleClick');
    expect(html).not.toContain('advertising providers');
  });

  it('describes the newsletter and Kit', () => {
    expect(html).toContain('<h2>Email newsletter</h2>');
    expect(html).toContain('kit.com');
    expect(html).toContain('unsubscribe link');
  });

  it('describes Amazon Associates', () => {
    expect(html).toContain('<h2>Amazon Associates</h2>');
    expect(html).toContain('Amazon Services LLC Associates Program');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:dist`
Expected: the three privacy tests fail.

- [ ] **Step 3: Edit `src/pages/privacy.astro`**

Replace everything from `<h2>Information we collect</h2>` through the paragraph ending `page (EU/EEA visitors).` and its closing `</p>` (that is: the two "Information we collect" paragraphs, the two cookie paragraphs, the `<h2>Google AdSense</h2>` heading, and its four paragraphs) with:

```html
      <h2>Information we collect</h2>

      <p>
        The Dough Formula does not ask you to create an account, and the calculator runs entirely in your browser. We do not directly collect your name, email address, or any other personal information unless you choose to send it to us by email or sign up for our newsletter.
      </p>

      <p>
        We do collect anonymous usage data through the analytics provider listed below. That data is aggregate and is not tied to your identity.
      </p>

      <h2>Cookies and tracking technologies</h2>

      <p>
        Our analytics provider does not use cookies. Links to retailers may set cookies on the retailer's own site once you arrive there; those are governed by the retailer's privacy policy, not ours.
      </p>

      <p>
        You can disable or clear cookies at any time through your browser settings. Disabling cookies may affect how some parts of the site work, but the calculator itself will continue to function.
      </p>

      <h2>Email newsletter</h2>

      <p>
        If you sign up for our newsletter, we collect your email address and nothing else. We use Kit (kit.com) to store addresses and send emails on our behalf, and Kit processes your address under its own <a href="https://kit.com/privacy" rel="noopener" target="_blank">privacy policy</a>. You will receive a confirmation email before you are added to the list. Every email we send includes an unsubscribe link, and unsubscribing removes your address from the list. We do not sell or share subscriber addresses with anyone.
      </p>

      <h2>Amazon Associates</h2>

      <p>
        The Dough Formula participates in the Amazon Services LLC Associates Program. Links to Amazon on this site carry an affiliate tag, and we earn a commission on qualifying purchases at no extra cost to you. What happens on Amazon after you click, including any cookies Amazon sets, is governed by <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" rel="noopener" target="_blank">Amazon's privacy notice</a>.
      </p>
```

The `<h2>Analytics</h2>` section and everything after it stay as they are.

- [ ] **Step 4: Run the dist tests**

Run: `npm run test:dist`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/privacy.astro tests/dist/privacy.test.ts
git commit -m "Replace AdSense privacy section with newsletter and Amazon Associates" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 5: Newsletter via Kit

**Files:**
- Create: `src/config/newsletter.ts`, `tests/unit/newsletter.test.ts`, `tests/dist/newsletter.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `KIT_FORM_ID: string`, `KIT_PUBLIC_API_KEY: string`, `isNewsletterEnabled(formId: string, apiKey: string): boolean`, `NEWSLETTER_ENABLED: boolean` from `src/config/newsletter.ts`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/newsletter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isNewsletterEnabled } from '../../src/config/newsletter';

describe('isNewsletterEnabled', () => {
  it('is false when either value is empty', () => {
    expect(isNewsletterEnabled('', '')).toBe(false);
    expect(isNewsletterEnabled('123', '')).toBe(false);
    expect(isNewsletterEnabled('', 'abc')).toBe(false);
  });

  it('is true when both values are set', () => {
    expect(isNewsletterEnabled('123', 'abc')).toBe(true);
  });

  it('ignores surrounding whitespace', () => {
    expect(isNewsletterEnabled('  ', 'abc')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, cannot resolve `src/config/newsletter`.

- [ ] **Step 3: Create the config module**

Create `src/config/newsletter.ts`:

```ts
// Kit (formerly ConvertKit) newsletter settings.
// KIT_FORM_ID: Kit > Grow > Landing Pages & Forms > your form > the numeric id in its URL.
// KIT_PUBLIC_API_KEY: Kit > Settings > Developer > "API Key". This is the PUBLIC key,
// documented as safe for browser use. Never put the API Secret here.
// Both empty means the newsletter section does not render at all.
export const KIT_FORM_ID = '';
export const KIT_PUBLIC_API_KEY = '';

export function isNewsletterEnabled(formId: string, apiKey: string): boolean {
  return formId.trim().length > 0 && apiKey.trim().length > 0;
}

export const NEWSLETTER_ENABLED = isNewsletterEnabled(KIT_FORM_ID, KIT_PUBLIC_API_KEY);
```

- [ ] **Step 4: Run the unit tests**

Run: `npm run test:unit`
Expected: all pass.

- [ ] **Step 5: Write the failing dist test**

Create `tests/dist/newsletter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';
import { NEWSLETTER_ENABLED } from '../../src/config/newsletter';

describe('newsletter section', () => {
  const home = distFile('index.html');

  it('never ships the old live-heading hook', () => {
    expect(home).not.toContain('id="newsletter-style"');
  });

  it('renders only when Kit is configured', () => {
    if (NEWSLETTER_ENABLED) {
      expect(home).toContain('id="newsletter-form"');
      expect(home).toContain('data-kit-form-id="');
    } else {
      expect(home).not.toContain('id="newsletter-form"');
    }
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm run test:dist`
Expected: both newsletter tests fail (the form and the `newsletter-style` span are still in the page).

- [ ] **Step 7: Import the config in `src/pages/index.astro`**

Add after the existing imports at the top of the frontmatter:

```ts
import { KIT_FORM_ID, KIT_PUBLIC_API_KEY, NEWSLETTER_ENABLED } from '../config/newsletter';
```

- [ ] **Step 8: Make the section conditional and static**

Replace:

```astro
  <!-- Newsletter Section -->
  <section class="section-dark py-16 mt-16">
    <div class="container max-w-2xl text-center">
      <h2 class="font-display text-2xl md:text-3xl mb-3">
        Level Up Your <span class="text-[var(--wheat-gold)]" id="newsletter-style">Sourdough</span> Game
      </h2>
      <p class="text-[var(--cream-warm)] mb-8">
        Get weekly tips, troubleshooting guides, and pro techniques for perfect bread.
      </p>
      <form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" id="newsletter-form">
        <input
          type="email"
          placeholder="your@email.com"
          class="input flex-1"
          required
        />
```

with:

```astro
  <!-- Newsletter Section -->
  {NEWSLETTER_ENABLED && (
  <section class="section-dark py-16 mt-16">
    <div class="container max-w-2xl text-center">
      <h2 class="font-display text-2xl md:text-3xl mb-3">
        Level Up Your <span class="text-[var(--wheat-gold)]">Sourdough</span> Game
      </h2>
      <p class="text-[var(--cream-warm)] mb-8">
        Get weekly tips, troubleshooting guides, and pro techniques for perfect bread.
      </p>
      <form
        class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        id="newsletter-form"
        data-kit-form-id={KIT_FORM_ID}
        data-kit-api-key={KIT_PUBLIC_API_KEY}
      >
        <input
          type="email"
          name="email"
          autocomplete="email"
          placeholder="your@email.com"
          class="input flex-1"
          required
        />
```

Then, a few lines below, replace the section's closing:

```astro
      <p class="text-sm text-[var(--crust-brown)] mt-4">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  </section>
```

with:

```astro
      <p class="text-sm text-[var(--crust-brown)] mt-4">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  </section>
  )}
```

- [ ] **Step 9: Remove the live-heading update in the calculator script**

Delete this block inside the calculator script (it sits after the `coldRetardInfo` toggle):

```ts
    // Update newsletter style
    const newsletterStyle = document.getElementById('newsletter-style');
    if (newsletterStyle) {
      newsletterStyle.textContent = state.style.charAt(0).toUpperCase() + state.style.slice(1).replace('-', ' ');
    }

```

- [ ] **Step 10: Replace the submit handler**

Replace:

```ts
  // Newsletter form
  document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast("You're in! Check your inbox.");
  });
```

with:

```ts
  // Newsletter form: client-side subscribe through Kit's v3 public-key endpoint.
  // The form only renders when src/config/newsletter.ts has both values set.
  const newsletterForm = document.getElementById('newsletter-form') as HTMLFormElement | null;
  if (newsletterForm) {
    const kitFormId = newsletterForm.dataset.kitFormId || '';
    const kitApiKey = newsletterForm.dataset.kitApiKey || '';
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]') as HTMLInputElement | null;
      const email = input?.value.trim() || '';
      if (!email || !kitFormId || !kitApiKey) return;
      const button = newsletterForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (button) button.disabled = true;
      try {
        const res = await fetch(`https://api.convertkit.com/v3/forms/${kitFormId}/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: kitApiKey, email }),
        });
        if (!res.ok) throw new Error(`Kit responded ${res.status}`);
        showToast("You're in! Check your inbox to confirm.");
        if (input) input.value = '';
      } catch {
        showToast('Something went wrong. Try again in a moment.');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }
```

- [ ] **Step 11: Run all tests**

Run: `npm test`
Expected: all pass. With the config empty, the built homepage contains no `newsletter-form`.

- [ ] **Step 12: Manual check of the enabled path**

Temporarily set `KIT_FORM_ID = 'test'` and `KIT_PUBLIC_API_KEY = 'test'` in `src/config/newsletter.ts`, run `npm run dev`, open the homepage: the section renders. Submit an address: the request to `api.convertkit.com` fails (fake credentials) and the toast reads "Something went wrong. Try again in a moment." Restore both values to `''`. Do not commit test values.

- [ ] **Step 13: Commit**

```bash
git add src/config/newsletter.ts src/pages/index.astro tests/unit/newsletter.test.ts tests/dist/newsletter.test.ts
git commit -m "Wire newsletter form to Kit and hide it until configured" -m "The form previously showed a success toast and stored nothing. It now posts to Kit's v3 public-key subscribe endpoint and renders only when a form id and public key are set.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 6: Equipment data module

**Files:**
- Modify: `src/data/recipes.ts`
- Create: `src/data/equipment.ts`, `tests/unit/equipment.test.ts`

**Interfaces:**
- Consumes: `ShapeFamily` (exported here from `recipes.ts`), `STYLE_META` shape.
- Produces from `src/data/equipment.ts`: `type Merchant`, `interface Product`, `PRODUCTS: Record<string, Product>`, `type GearFamily`, `GEAR_SETS: Record<GearFamily, string[]>`, `HOMEPAGE_PRODUCTS: string[]`, `TRACKING_IDS: { homepage; recipe; calculator }`, `productUrl(p: Product, trackingId: string): string`, `CALCULATOR_STYLE_FAMILY: Record<string, GearFamily>`.

- [ ] **Step 1: Export `ShapeFamily` from `src/data/recipes.ts`**

Replace:

```ts
export interface StyleMeta {
```

with:

```ts
export type ShapeFamily = 'dutch-oven' | 'steam-stone' | 'loaf-pan' | 'sheet-pan';

export interface StyleMeta {
```

and replace the inline union:

```ts
  shapeFamily: 'dutch-oven' | 'steam-stone' | 'loaf-pan' | 'sheet-pan';
```

with:

```ts
  shapeFamily: ShapeFamily;
```

- [ ] **Step 2: Write the failing unit tests**

Create `tests/unit/equipment.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PRODUCTS,
  GEAR_SETS,
  HOMEPAGE_PRODUCTS,
  TRACKING_IDS,
  CALCULATOR_STYLE_FAMILY,
  productUrl,
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
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, cannot resolve `src/data/equipment`.

- [ ] **Step 4: Create `src/data/equipment.ts`**

```ts
import type { ShapeFamily } from './recipes';

export type Merchant = 'amazon' | 'direct';

export interface Product {
  id: string;
  name: string;
  blurb: string;
  merchant: Merchant;
  /** Required when merchant === 'amazon'. */
  asin?: string;
  /** Required when merchant === 'direct': the full affiliate URL that program issues. */
  href?: string;
  /** Link text, e.g. 'Breadtopia'. Defaults to 'Amazon' for amazon products. */
  merchantLabel?: string;
}

// All ten products are Amazon today. The `direct` shape exists so links from other
// programs (Brød & Taylor, Breadtopia, Challenger) can join a gear set later with a
// data edit and no model change. No prices: Amazon requires they come from its API
// or not appear at all.
export const PRODUCTS: Record<string, Product> = {
  'lodge-combo-cooker': {
    id: 'lodge-combo-cooker',
    name: 'Lodge Combo Cooker',
    blurb: 'The go-to choice for home bakers. Shallow lid makes loading dough safer and easier.',
    merchant: 'amazon',
    asin: 'B0009JKG9M',
  },
  'escali-scale': {
    id: 'escali-scale',
    name: 'Escali Primo Scale',
    blurb: 'NY Times recommended. 11 lb capacity, 1g accuracy, simple two-button operation.',
    merchant: 'amazon',
    asin: 'B0007GAWRS',
  },
  'oxo-bench-scraper': {
    id: 'oxo-bench-scraper',
    name: 'OXO Bench Scraper',
    blurb: 'Stainless steel blade with measurement markings. Comfortable non-slip grip.',
    merchant: 'amazon',
    asin: 'B00004OCNJ',
  },
  'banneton-set': {
    id: 'banneton-set',
    name: 'Banneton Basket Set',
    blurb: 'Round & oval baskets with liners, lame, and scrapers. Premium Indonesian rattan.',
    merchant: 'amazon',
    asin: 'B08G4ZPZBZ',
  },
  'ufo-lame': {
    id: 'ufo-lame',
    name: 'UFO Bread Lame',
    blurb: 'Handcrafted walnut wood handle with secure blade storage. Includes extra blades.',
    merchant: 'amazon',
    asin: 'B08CTCHYDT',
  },
  thermapen: {
    id: 'thermapen',
    name: 'ThermoWorks Thermapen',
    blurb: 'Pro-grade accuracy in 1 second. Check water temp and bread doneness (190-210°F).',
    merchant: 'amazon',
    asin: 'B0DG71Q1LZ',
  },
  'thermichef-steel': {
    id: 'thermichef-steel',
    name: 'ThermiChef 16-Inch Baking Steel',
    blurb: 'Quarter-inch steel stores and transfers far more heat than a stone. Slide baguettes or ciabatta straight onto it for a fast, crisp bottom crust. Made in the USA.',
    merchant: 'amazon',
    asin: 'B0BR5ZLMFP',
  },
  'saint-germain-couche': {
    id: 'saint-germain-couche',
    name: 'Saint Germain Bakery Couche',
    blurb: 'Heavy French flax linen holds shaped baguettes and ciabatta in place while they proof, and wicks just enough moisture to set the skin for scoring.',
    merchant: 'amazon',
    asin: 'B06XXXQVNZ',
  },
  'usa-pan-9x13': {
    id: 'usa-pan-9x13',
    name: 'USA Pan 9x13 Rectangular Pan',
    blurb: 'Aluminized steel with a corrugated base bakes an even, deeply browned focaccia bottom. The two-inch sides give a high-hydration dough room to rise.',
    merchant: 'amazon',
    asin: 'B0029JOC6I',
  },
  'usa-pan-loaf': {
    id: 'usa-pan-loaf',
    name: 'USA Pan 9x5 Loaf Pan',
    blurb: 'Commercial-grade aluminized steel in the standard 9x5 size. Straight walls and a corrugated base produce a tall, evenly browned sandwich or brioche loaf.',
    merchant: 'amazon',
    asin: 'B002UNMZOO',
  },
};

export type GearFamily = ShapeFamily | 'universal';

/** Gear shown for a bake: universal items plus the set for the style's shape family. */
export const GEAR_SETS: Record<GearFamily, string[]> = {
  universal: ['escali-scale', 'oxo-bench-scraper', 'thermapen'],
  'dutch-oven': ['lodge-combo-cooker', 'banneton-set', 'ufo-lame'],
  'steam-stone': ['thermichef-steel', 'saint-germain-couche', 'ufo-lame'],
  'sheet-pan': ['usa-pan-9x13'],
  'loaf-pan': ['usa-pan-loaf'],
};

/** The homepage grid, in the exact order the hardcoded version used. */
export const HOMEPAGE_PRODUCTS: string[] = [
  'lodge-combo-cooker',
  'escali-scale',
  'oxo-bench-scraper',
  'banneton-set',
  'ufo-lame',
  'thermapen',
];

// One Amazon tracking id per placement so Associates reports show which one earns.
// Create the two new ids in Associates Central (Account Settings > Manage Your Tracking IDs)
// and replace the values below. Until then every placement falls back to the original tag.
export const TRACKING_IDS = {
  homepage: 'probuild20-20',
  recipe: 'probuild20-20', // replace with tdf-recipe-20 once created
  calculator: 'probuild20-20', // replace with tdf-calc-20 once created
} as const;

export function productUrl(p: Product, trackingId: string): string {
  if (p.merchant === 'amazon') return `https://www.amazon.com/dp/${p.asin}?tag=${trackingId}`;
  return p.href!;
}

/** Calculator style ids (index.astro breadStyles) to gear family. `custom` gets universal only. */
export const CALCULATOR_STYLE_FAMILY: Record<string, GearFamily> = {
  sourdough: 'dutch-oven',
  'no-knead': 'dutch-oven',
  baguette: 'steam-stone',
  ciabatta: 'steam-stone',
  focaccia: 'sheet-pan',
  sandwich: 'loaf-pan',
  brioche: 'loaf-pan',
  custom: 'universal',
};
```

- [ ] **Step 5: Run the unit tests**

Run: `npm run test:unit`
Expected: all pass.

- [ ] **Step 6: Confirm the build still passes with the `recipes.ts` change**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/data/recipes.ts src/data/equipment.ts tests/unit/equipment.test.ts
git commit -m "Add equipment data module with gear sets keyed by shape family" -m "Ten Amazon products, per-placement tracking ids, and a merchant-agnostic URL builder. Exports ShapeFamily from recipes.ts so the two data files share the type.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 7: `AffiliateDisclosure` and `EquipmentGrid` components

**Files:**
- Create: `src/components/AffiliateDisclosure.astro`, `src/components/EquipmentGrid.astro`, `tests/components/equipment.test.ts`

**Interfaces:**
- Consumes: `PRODUCTS`, `productUrl`, `Product` from `src/data/equipment.ts`.
- Produces: `<AffiliateDisclosure compact?: boolean hasDirect?: boolean />` and `<EquipmentGrid productIds: string[] trackingId: string heading?: string intro?: string compact?: boolean disclosure?: boolean />`.

- [ ] **Step 1: Write the failing component tests**

Create `tests/components/equipment.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect, beforeAll } from 'vitest';
import EquipmentGrid from '../../src/components/EquipmentGrid.astro';
import AffiliateDisclosure from '../../src/components/AffiliateDisclosure.astro';

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
    expect(html.match(/rel="noopener noreferrer sponsored"/g)).toHaveLength(2);
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
    expect(html).toContain('As an Amazon Associate, we earn from qualifying purchases.');
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
    expect(html).toContain('As an Amazon Associate, we earn from qualifying purchases.');
    expect(html).not.toContain('Affiliate Disclosure:');
  });
});

describe('AffiliateDisclosure', () => {
  it('compact variant is one sentence for Amazon-only lists', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: { compact: true } });
    expect(html).toContain('As an Amazon Associate, we earn from qualifying purchases.');
    expect(html).not.toContain('other retailers');
  });

  it('appends the other-retailers sentence when hasDirect is true', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: { compact: true, hasDirect: true } });
    expect(html).toContain('Some links go to other retailers who also pay us a commission.');
  });

  it('full variant keeps the original homepage wording', async () => {
    const html = await container.renderToString(AffiliateDisclosure, { props: {} });
    expect(html).toContain('<strong>Affiliate Disclosure:</strong>');
    expect(html).toContain('Thank you for supporting The Dough Formula!');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, cannot resolve the two component files.

- [ ] **Step 3: Create `src/components/AffiliateDisclosure.astro`**

```astro
---
interface Props {
  compact?: boolean;
  /** True when the surrounding list includes a non-Amazon merchant. */
  hasDirect?: boolean;
}

const { compact = false, hasDirect = false } = Astro.props;
const extra = hasDirect ? ' Some links go to other retailers who also pay us a commission.' : '';
---

{compact ? (
  <p class="text-xs text-[var(--crust-brown)] mt-4">
    As an Amazon Associate, we earn from qualifying purchases.{extra}
  </p>
) : (
  <div class="mt-10 p-5 bg-[var(--cream-flour)] rounded-lg border border-[var(--border-light)]">
    <p class="text-sm text-[var(--crust-brown)] text-center">
      <strong>Affiliate Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. This means we may receive a small commission if you buy through our links, at no extra cost to you. We only recommend products we genuinely believe will help your bread baking journey. Thank you for supporting The Dough Formula!{extra}
    </p>
  </div>
)}
```

- [ ] **Step 4: Create `src/components/EquipmentGrid.astro`**

```astro
---
import { PRODUCTS, productUrl } from '../data/equipment';
import AffiliateDisclosure from './AffiliateDisclosure.astro';

interface Props {
  productIds: string[];
  trackingId: string;
  heading?: string;
  intro?: string;
  /** Tight list for the calculator column instead of cards. */
  compact?: boolean;
  /** Set false when the caller renders one disclosure for several grids. */
  disclosure?: boolean;
}

const { productIds, trackingId, heading, intro, compact = false, disclosure = true } = Astro.props;

const products = productIds.map((id) => {
  const p = PRODUCTS[id];
  if (!p) throw new Error(`EquipmentGrid: unknown product id "${id}"`);
  return p;
});
const hasDirect = products.some((p) => p.merchant === 'direct');
const labelFor = (label?: string) => label ?? 'Amazon';
---

{heading && <h2 class="font-display text-2xl md:text-3xl text-center mb-3">{heading}</h2>}
{intro && <p class="text-center text-[var(--crust-brown)] mb-10">{intro}</p>}

{compact ? (
  <ul class="space-y-2">
    {products.map((p) => (
      <li class="flex items-baseline justify-between gap-3 text-sm">
        <span class="font-medium">{p.name}</span>
        <a
          href={productUrl(p, trackingId)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          class="text-[var(--accent-gold)] hover:text-[var(--espresso)] whitespace-nowrap"
          aria-label={`View ${p.name} on ${labelFor(p.merchantLabel)}`}
        >View on {labelFor(p.merchantLabel)} →</a>
      </li>
    ))}
  </ul>
) : (
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {products.map((p) => (
      <div class="card p-5">
        <h3 class="font-medium mb-1">{p.name}</h3>
        <p class="text-sm text-[var(--crust-brown)] mb-3">{p.blurb}</p>
        <div class="flex items-center justify-end">
          <a
            href={productUrl(p, trackingId)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium"
            aria-label={`View ${p.name} on ${labelFor(p.merchantLabel)}`}
          >View on {labelFor(p.merchantLabel)} →</a>
        </div>
      </div>
    ))}
  </div>
)}

{disclosure && <AffiliateDisclosure compact={compact} hasDirect={hasDirect} />}
```

- [ ] **Step 5: Run the component tests**

Run: `npm run test:unit`
Expected: all pass. If the `.astro` import fails to resolve types, that is fine at runtime; Vitest does not type-check.

- [ ] **Step 6: Commit**

```bash
git add src/components/AffiliateDisclosure.astro src/components/EquipmentGrid.astro tests/components/equipment.test.ts
git commit -m "Add EquipmentGrid and AffiliateDisclosure components" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 8: Homepage equipment section from data

**Files:**
- Modify: `src/pages/index.astro`
- Create: `tests/dist/affiliates.test.ts`

**Interfaces:**
- Consumes: `EquipmentGrid`, `HOMEPAGE_PRODUCTS`, `TRACKING_IDS`.

- [ ] **Step 1: Write the failing dist test**

Create `tests/dist/affiliates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { distFile } from './helpers';

describe('homepage equipment section', () => {
  const home = distFile('index.html');
  // Bound at the FAQ section that follows, so footer and FAQ text do not leak into the assertions.
  const section = home.slice(home.indexOf('id="equipment"'), home.indexOf('id="faq"'));

  it('keeps the section anchor the footer links to', () => {
    expect(home).toContain('id="equipment"');
    expect(home).toContain('href="#equipment"');
  });

  it('shows the original six products in the original order with no prices', () => {
    const names = [
      'Lodge Combo Cooker',
      'Escali Primo Scale',
      'OXO Bench Scraper',
      'Banneton Basket Set',
      'UFO Bread Lame',
      'ThermoWorks Thermapen',
    ];
    let last = -1;
    for (const name of names) {
      const idx = section.indexOf(name);
      expect(idx, name).toBeGreaterThan(last);
      last = idx;
    }
    expect(section).not.toContain('~$');
  });

  it('links carry the homepage tracking id and sponsored rel', () => {
    expect(section).toContain('https://www.amazon.com/dp/B0009JKG9M?tag=probuild20-20');
    expect(section.match(/rel="noopener noreferrer sponsored"/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('shows the full disclosure', () => {
    expect(section).toContain('Affiliate Disclosure:');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:dist`
Expected: "no prices" fails (the `~$` strings are still present). The other three pass against the hardcoded markup; that is expected.

- [ ] **Step 3: Import the component and data in `src/pages/index.astro`**

Add after the newsletter import in the frontmatter:

```ts
import EquipmentGrid from '../components/EquipmentGrid.astro';
import { HOMEPAGE_PRODUCTS, TRACKING_IDS } from '../data/equipment';
```

- [ ] **Step 4: Replace the hardcoded section**

Replace this entire block:

```astro
  <!-- Equipment Section -->
  <section class="py-16" id="equipment">
    <div class="container">
      <h2 class="font-display text-2xl md:text-3xl text-center mb-3">Essential Bread Equipment</h2>
      <p class="text-center text-[var(--crust-brown)] mb-10">The right tools make all the difference</p>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="card p-5">
          <h3 class="font-medium mb-1">Lodge Combo Cooker</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">The go-to choice for home bakers. Shallow lid makes loading dough safer and easier.</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$45</span>
            <a href="https://www.amazon.com/Lodge-Cooker-Pre-seasoned-Skillet-Convertible/dp/B0009JKG9M?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View Lodge Combo Cooker on Amazon">View on Amazon →</a>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-medium mb-1">Escali Primo Scale</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">NY Times recommended. 11 lb capacity, 1g accuracy, simple two-button operation.</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$27</span>
            <a href="https://www.amazon.com/Escali-Digital-Multi-Functional-Kitchen-Measuring/dp/B0007GAWRS?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View Escali Primo Scale on Amazon">View on Amazon →</a>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-medium mb-1">OXO Bench Scraper</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">Stainless steel blade with measurement markings. Comfortable non-slip grip.</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$10</span>
            <a href="https://www.amazon.com/OXO-Multi-purpose-Stainless-Scraper-Chopper/dp/B00004OCNJ?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View OXO Bench Scraper on Amazon">View on Amazon →</a>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-medium mb-1">Banneton Basket Set</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">Round & oval baskets with liners, lame, and scrapers. Premium Indonesian rattan.</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$26</span>
            <a href="https://www.amazon.com/RORECAY-Proofing-Banneton-Sourdough-Fermentation/dp/B08G4ZPZBZ?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View Banneton Basket Set on Amazon">View on Amazon →</a>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-medium mb-1">UFO Bread Lame</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">Handcrafted walnut wood handle with secure blade storage. Includes extra blades.</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$13</span>
            <a href="https://www.amazon.com/VIROTEE-UFO-Bread-Lame-Sourdough/dp/B08CTCHYDT?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View UFO Bread Lame on Amazon">View on Amazon →</a>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="font-medium mb-1">ThermoWorks Thermapen</h3>
          <p class="text-sm text-[var(--crust-brown)] mb-3">Pro-grade accuracy in 1 second. Check water temp and bread doneness (190-210°F).</p>
          <div class="flex items-center justify-between">
            <span class="text-[var(--accent-gold)] font-medium">~$105</span>
            <a href="https://www.amazon.com/ThermoWorks-Thermapen-Recommended-Instant-Read-Thermometer/dp/B0DG71Q1LZ?tag=probuild20-20" target="_blank" class="text-sm text-[var(--accent-gold)] hover:text-[var(--espresso)] font-medium" rel="noopener noreferrer sponsored" aria-label="View ThermoWorks Thermapen on Amazon">View on Amazon →</a>
          </div>
        </div>
      </div>

      <div class="mt-10 p-5 bg-[var(--cream-flour)] rounded-lg border border-[var(--border-light)]">
        <p class="text-sm text-[var(--crust-brown)] text-center">
          <strong>Affiliate Disclosure:</strong> As an Amazon Associate, we earn from qualifying purchases. This means we may receive a small commission if you buy through our links, at no extra cost to you. We only recommend products we genuinely believe will help your bread baking journey. Thank you for supporting The Dough Formula!
        </p>
      </div>
    </div>
  </section>
```

with:

```astro
  <!-- Equipment Section -->
  <section class="py-16" id="equipment">
    <div class="container">
      <EquipmentGrid
        productIds={HOMEPAGE_PRODUCTS}
        trackingId={TRACKING_IDS.homepage}
        heading="Essential Bread Equipment"
        intro="The right tools make all the difference"
      />
    </div>
  </section>
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Visual check**

Run: `npm run preview`, open `http://localhost:4321/#equipment`. Six cards in the same grid as before, same heading and intro, link bottom-right in each card, no price, disclosure box beneath.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro tests/dist/affiliates.test.ts
git commit -m "Render homepage equipment grid from the data module" -m "Same six products in the same order. Prices removed to comply with Amazon's Operating Agreement.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 9: Gear block on recipe pages

**Files:**
- Modify: `src/layouts/RecipeLayout.astro`, `tests/dist/affiliates.test.ts`

**Interfaces:**
- Consumes: `EquipmentGrid`, `GEAR_SETS`, `TRACKING_IDS`, `styleMeta.shapeFamily` (already in scope in RecipeLayout).

- [ ] **Step 1: Add the failing dist tests**

Append to `tests/dist/affiliates.test.ts`:

```ts
describe('recipe page gear blocks', () => {
  const cases: [string, string[], string[]][] = [
    // slug, must contain, must not contain
    ['recipes/sourdough-65-slow/index.html', ['Lodge Combo Cooker', 'Banneton Basket Set', 'UFO Bread Lame'], ['ThermiChef', 'USA Pan']],
    ['recipes/baguette-65-same-day/index.html', ['ThermiChef', 'Saint Germain Bakery Couche', 'UFO Bread Lame'], ['Lodge Combo Cooker', 'USA Pan']],
    ['recipes/focaccia-75-same-day/index.html', ['USA Pan 9x13 Rectangular Pan'], ['Lodge Combo Cooker', 'ThermiChef', 'USA Pan 9x5']],
    ['recipes/sandwich-75-overnight/index.html', ['USA Pan 9x5 Loaf Pan'], ['Lodge Combo Cooker', 'ThermiChef', 'USA Pan 9x13']],
  ];

  for (const [file, yes, no] of cases) {
    it(`${file} shows universal gear plus its family set`, () => {
      const html = distFile(file);
      expect(html).toContain("What you'll need for this bake");
      for (const name of ['Escali Primo Scale', 'OXO Bench Scraper', 'ThermoWorks Thermapen', ...yes]) {
        expect(html, name).toContain(name);
      }
      for (const name of no) expect(html, name).not.toContain(name);
      expect(html).toContain('Affiliate Disclosure:');
      expect(html).toContain(`?tag=probuild20-20`);
    });
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:dist`
Expected: the four recipe tests fail on "What you'll need for this bake".

- [ ] **Step 3: Import in `src/layouts/RecipeLayout.astro`**

Add to the frontmatter imports:

```ts
import EquipmentGrid from '../components/EquipmentGrid.astro';
import { GEAR_SETS, TRACKING_IDS } from '../data/equipment';
```

- [ ] **Step 4: Insert the section**

Replace:

```astro
        <h2>What to expect</h2>
        <p>{resultDescriptor}</p>
      </div>

      <div class="max-w-3xl mx-auto my-10 text-center">
```

with:

```astro
        <h2>What to expect</h2>
        <p>{resultDescriptor}</p>
      </div>

      <section class="max-w-5xl mx-auto mt-16">
        <EquipmentGrid
          productIds={[...GEAR_SETS.universal, ...GEAR_SETS[styleMeta.shapeFamily]]}
          trackingId={TRACKING_IDS.recipe}
          heading="What you'll need for this bake"
        />
      </section>

      <div class="max-w-3xl mx-auto my-10 text-center">
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Visual check**

Run: `npm run preview`. Open `/recipes/baguette-65-same-day/`: after "What to expect", a heading "What you'll need for this bake", six cards (scale, scraper, Thermapen, steel, couche, lame), then the disclosure, then the "Open in calculator" button. Open `/recipes/focaccia-75-same-day/`: four cards ending with the 9x13 pan.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/RecipeLayout.astro tests/dist/affiliates.test.ts
git commit -m "Add style-matched gear block to recipe pages" -m "Universal items plus the shape family's set, four variants across the 60 pages, with the recipe tracking id.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 10: Gear block in the calculator

**Files:**
- Modify: `src/pages/index.astro`, `tests/dist/affiliates.test.ts`

**Interfaces:**
- Consumes: `EquipmentGrid`, `AffiliateDisclosure`, `GEAR_SETS`, `TRACKING_IDS`, `CALCULATOR_STYLE_FAMILY`, `updateUI()`, `state.style`.

- [ ] **Step 1: Add the failing dist tests**

Append to `tests/dist/affiliates.test.ts`:

```ts
describe('calculator gear block', () => {
  const home = distFile('index.html');
  // Bound at the Baker's Percentage section, which follows the calculator (and the newsletter, when enabled)
  // and precedes the homepage #equipment grid, so that grid's full disclosure is not counted here.
  const block = home.slice(home.indexOf('id="gear-block"'), home.indexOf('id="bakers-percent"'));

  it('exists with a style-to-family map covering every calculator style', () => {
    expect(home).toContain('id="gear-block"');
    expect(home).toContain('data-style-family=');
    for (const style of ['sourdough', 'no-knead', 'baguette', 'ciabatta', 'focaccia', 'sandwich', 'brioche', 'custom']) {
      expect(block, style).toContain(style);
    }
  });

  it('renders the universal list and four family wrappers, dutch-oven visible by default', () => {
    expect(block.match(/data-gear-family="/g)).toHaveLength(4);
    const dutch = block.match(/data-gear-family="dutch-oven" class="([^"]*)"/);
    expect(dutch).not.toBeNull();
    expect(dutch![1]).not.toContain('hidden');
    for (const fam of ['steam-stone', 'sheet-pan', 'loaf-pan']) {
      const m = block.match(new RegExp(`data-gear-family="${fam}" class="([^"]*)"`));
      expect(m, fam).not.toBeNull();
      expect(m![1], fam).toContain('hidden');
    }
  });

  it('uses the calculator tracking id and one compact disclosure', () => {
    expect(block).toContain('?tag=probuild20-20');
    expect(block.match(/As an Amazon Associate, we earn from qualifying purchases\./g)).toHaveLength(1);
    expect(block).not.toContain('Affiliate Disclosure:');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:dist`
Expected: the three calculator tests fail (no `gear-block`).

- [ ] **Step 3: Extend the imports in `src/pages/index.astro`**

Replace:

```ts
import EquipmentGrid from '../components/EquipmentGrid.astro';
import { HOMEPAGE_PRODUCTS, TRACKING_IDS } from '../data/equipment';
```

with:

```ts
import EquipmentGrid from '../components/EquipmentGrid.astro';
import AffiliateDisclosure from '../components/AffiliateDisclosure.astro';
import { HOMEPAGE_PRODUCTS, TRACKING_IDS, GEAR_SETS, CALCULATOR_STYLE_FAMILY } from '../data/equipment';
```

- [ ] **Step 4: Insert the aside below the recipe card**

The recipe card column closes with a run of `</div>` lines just before the calculator `</section>` and the `<!-- Newsletter Section -->` comment. Replace:

```astro
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Newsletter Section -->
```

with:

```astro
              </div>
            </div>
          </div>

          <aside id="gear-block" class="mt-6" data-style-family={JSON.stringify(CALCULATOR_STYLE_FAMILY)}>
            <h4 class="font-medium text-lg mb-3">Gear for this bake</h4>
            <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS.universal} trackingId={TRACKING_IDS.calculator} />
            <div data-gear-family="dutch-oven" class="mt-2">
              <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS['dutch-oven']} trackingId={TRACKING_IDS.calculator} />
            </div>
            <div data-gear-family="steam-stone" class="mt-2 hidden">
              <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS['steam-stone']} trackingId={TRACKING_IDS.calculator} />
            </div>
            <div data-gear-family="sheet-pan" class="mt-2 hidden">
              <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS['sheet-pan']} trackingId={TRACKING_IDS.calculator} />
            </div>
            <div data-gear-family="loaf-pan" class="mt-2 hidden">
              <EquipmentGrid compact disclosure={false} productIds={GEAR_SETS['loaf-pan']} trackingId={TRACKING_IDS.calculator} />
            </div>
            <AffiliateDisclosure compact />
          </aside>
        </div>
      </div>
    </div>
  </section>

  <!-- Newsletter Section -->
```

The three `</div>` lines kept at the top close the Actions row, `.recipe-card-body`, and `#recipe-card`; the aside then sits inside the right column, after the card.

- [ ] **Step 5: Toggle the family list in `updateUI()`**

Inside `function updateUI()`, immediately after this existing block:

```ts
    // Update recipe card title
    const titleEl = document.getElementById('recipe-title');
    if (titleEl) {
      const styleName = state.style.charAt(0).toUpperCase() + state.style.slice(1).replace('-', ' ');
      titleEl.textContent = `${styleName} Bread`;
    }
```

insert:

```ts
    // Show the gear list for the selected style's shape family. The map is server-rendered
    // onto the aside because this script is processed TypeScript and cannot use define:vars.
    const gearBlock = document.getElementById('gear-block');
    if (gearBlock) {
      const familyMap = JSON.parse(gearBlock.dataset.styleFamily || '{}') as Record<string, string>;
      const family = familyMap[state.style] ?? 'universal';
      gearBlock.querySelectorAll<HTMLElement>('[data-gear-family]').forEach((el) => {
        el.classList.toggle('hidden', el.dataset.gearFamily !== family);
      });
    }
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Manual check of the toggle**

Run: `npm run preview`, open the homepage, scroll to the recipe card. Below it: "Gear for this bake", three universal items, then combo cooker / banneton / lame. Click Baguette: the second list swaps to steel / couche / lame. Click Focaccia: 9x13 pan only. Click Sandwich: 9x5 loaf pan only. Click Custom: universal items only. Open one link in a new tab: the Amazon URL contains `tag=probuild20-20`.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro tests/dist/affiliates.test.ts
git commit -m "Add style-aware gear block below the calculator recipe card" -m "All family lists are server-rendered; updateUI() toggles one class. No innerHTML.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 11: Identify and fix interaction-driven CLS

**Files:**
- Modify: `src/pages/index.astro` (only the elements the trace names)

Lab CLS is ~0 on cold load, so any field CLS comes from calculator interaction. This task measures first and fixes only what is measured.

- [ ] **Step 1: Instrument the page**

Run `npm run preview`, open `http://localhost:4321/` in Chrome, open DevTools Console, paste and run:

```js
window.__cls = [];
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.hadRecentInput) continue; // shifts within 500ms of input do not count toward CLS
    for (const s of e.sources || []) {
      const el = s.node;
      const desc = el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : ''}` : '(no node)';
      window.__cls.push({ value: +e.value.toFixed(4), node: desc, from: s.previousRect.height, to: s.currentRect.height });
      console.log('CLS', e.value.toFixed(4), desc, s.previousRect.height, '->', s.currentRect.height);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

- [ ] **Step 2: Exercise the calculator**

Perform each, waiting two seconds between actions so nothing falls inside the input window: click every style card in turn; open Advanced Options and click each tab; enable a preferment, change its type, disable it; drag the hydration slider to both ends; change number of loaves; toggle g/oz; open and close Plan My Bake. Then run `console.table(window.__cls)`.

- [ ] **Step 3: Decide**

If no entry has `value >= 0.01`: no code change. Record "no interaction CLS above 0.01 found" in the commit message of Task 12 and skip to Task 12.

If entries exist: for each distinct `node` with any `value >= 0.01`, apply exactly one of these in `src/pages/index.astro`:
- If the node is a container whose height changes because children are re-rendered (`#ingredients-list`, `#instructions-list`, the timeline, or their parent), add `style={`min-height:${max}px`}` where `max` is the largest `to` height observed for that node in the table, rounded up to the nearest 10px.
- If the node shifts because a sibling above it toggles `hidden` (for example content below `#preferment-section`), give the toggled sibling's parent a `min-height` equal to the largest height that sibling reached while visible, so toggling no longer moves content below it.

- [ ] **Step 4: Re-measure**

Rebuild (`npm run build && npm run preview`), repeat Steps 1 and 2. Expected: no entry with `value >= 0.01` for the nodes changed.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit (only if changes were made)**

```bash
git add src/pages/index.astro
git commit -m "Reserve height on calculator regions that shifted during interaction" -m "Nodes and heights taken from a layout-shift trace of the preview build:
<paste the console.table rows for the nodes changed>

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017ThxmVsuHnogxQMUzQKx3r"
```

---

### Task 12: Final verification and Lighthouse comparison

**Files:** none modified unless a check fails.

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: unit, component, and dist suites all pass.

- [ ] **Step 2: Source scan**

Run:
```bash
grep -rn -i -E "adsbygoogle|googlesyndication|doubleclick|googletagservices|AD_SLOTS|ADSENSE_CLIENT|AdUnit" src public
```
Expected: no output.

- [ ] **Step 3: Page walk**

Run `npm run preview`. Open each and confirm no empty "Advertisement" boxes, no console errors:
- `/`
- `/fundamentals/hydration-60-to-90/`
- `/recipes/focaccia-75-same-day/`
- `/recipes/`
- `/techniques/`
- `/privacy/`

- [ ] **Step 4: Lighthouse, mobile, against preview**

With preview running, run each:

```bash
npx --yes lighthouse http://localhost:4321/ --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=./lh-after-home.json --chrome-flags="--headless=new" --quiet
npx --yes lighthouse http://localhost:4321/recipes/focaccia-75-same-day/ --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=./lh-after-recipe.json --chrome-flags="--headless=new" --quiet
npx --yes lighthouse http://localhost:4321/fundamentals/hydration-60-to-90/ --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --output=json --output-path=./lh-after-article.json --chrome-flags="--headless=new" --quiet
```

Then:

```bash
node -e "for (const n of ['home','recipe','article']) { const d=require('./lh-after-'+n+'.json'); const a=d.audits; console.log(n, 'perf', Math.round(d.categories.performance.score*100), 'CLS', a['cumulative-layout-shift'].displayValue, 'LCP', a['largest-contentful-paint'].displayValue, 'bytes', a['total-byte-weight'].displayValue); }"
```

Baseline measured 2026-09-07 against production (same URLs, same flags): home perf 56, 789 KiB; recipe perf 56, 602 KiB; article perf 64. Expected after: total bytes down by roughly 370 KiB on every page and a higher performance score on each. Any page whose score dropped is a defect to investigate before handing off.

Delete the three `lh-after-*.json` files afterwards; they are not committed.

- [ ] **Step 5: Hand off**

Report to the user: the before/after Lighthouse table, the Task 11 outcome, and the branch name. The user runs their own local check and pushes. Do not push.

After push, the user supplies Kit values and the two tracking IDs in `src/config/newsletter.ts` and `src/data/equipment.ts` (each a one-line edit plus rebuild), and checks Cloudflare's per-path Core Web Vitals to confirm the homepage was the CLS source.
