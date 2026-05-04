# AdSense Ad Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place AdSense ads at five positions (2 homepage, 2 article, 1 category in-feed) without touching the bread calculator or the newsletter signup, with a single reusable component, CLS-safe reserved space, and graceful behavior when slot IDs are blank.

**Architecture:** One reusable `AdUnit.astro` component renders every static ad slot. A small `src/config/ads.ts` centralizes the publisher ID and slot IDs. A short inline script in `ArticleLayout.astro` auto-injects the mid-article ad before the first `<h2>` so existing articles need no edits. The AdSense loader script is already present site-wide in `Layout.astro` from the AdSense approval phase — no changes there.

**Tech Stack:** Astro 5, Tailwind v4, the existing AdSense JS loader (`pagead2.googlesyndication.com/.../adsbygoogle.js`).

**Note on testing:** The project has no unit test framework. Verification gate for every task is `npm run build` succeeding plus a `grep` against the build output to confirm the expected markup landed in the right place. Visual confirmation happens in `npm run preview` at the final task.

**Spec reference:** `docs/superpowers/specs/2026-05-04-adsense-ad-placement-design.md`

---

## File Map

**New files:**
- `public/ads.txt` — AdSense compliance file served at site root
- `src/config/ads.ts` — publisher ID + slot ID configuration (single source of truth)
- `src/components/AdUnit.astro` — reusable ad component for every static slot

**Modified files:**
- `src/layouts/ArticleLayout.astro` — adds end-of-article `<AdUnit>` and the mid-article auto-injection script
- `src/pages/index.astro` — inserts two `<AdUnit>` elements (post-newsletter and pre-FAQ)
- `src/pages/[category]/index.astro` — inserts an in-feed `<AdUnit>` after the third article card when the category has ≥ 4 articles
- `src/pages/privacy.astro` — appends NAI / EDAA opt-out links to the existing AdSense disclosure

**Untouched on purpose:** `src/layouts/Layout.astro` (already has loader script), `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/guides/index.astro`, the entire `#calculator` section, the entire `<section class="section-dark">` newsletter section.

---

### Task 1: Create `ads.txt` and config foundation

**Files:**
- Create: `public/ads.txt`
- Create: `src/config/ads.ts`

- [ ] **Step 1: Create `public/ads.txt`**

Create the file `public/ads.txt` with exactly this content (single line, no trailing whitespace beyond a final newline):

```
google.com, pub-7820884299125377, DIRECT, f08c47fec0942fa0
```

- [ ] **Step 2: Create `src/config/ads.ts`**

Create the file with exactly this content:

```ts
export const ADSENSE_CLIENT = 'ca-pub-7820884299125377';

export const AD_SLOTS = {
  homepagePostNewsletter: '',
  homepagePreFaq: '',
  articleMid: '',
  articleEnd: '',
  categoryInFeed: '',
} as const;

export const AD_LAYOUT_KEYS = {
  categoryInFeed: '',
} as const;
```

The empty strings are intentional — they're filled in from the AdSense console after the ad units are created. The `AdUnit` component built in Task 2 treats an empty slot as "render reserved space, do not emit `<ins>` or push to `adsbygoogle`."

- [ ] **Step 3: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Verify `ads.txt` shipped**

Run:
```bash
ls dist/ads.txt
cat dist/ads.txt
```
Expected: file exists at `dist/ads.txt` and the contents match the line in Step 1.

- [ ] **Step 5: Commit**

```bash
git add public/ads.txt src/config/ads.ts
git commit -m "Add AdSense ads.txt and slot config foundation"
```

---

### Task 2: Build the `AdUnit` component

**Files:**
- Create: `src/components/AdUnit.astro`

- [ ] **Step 1: Create `src/components/AdUnit.astro`**

Create the file with exactly this content:

```astro
---
import { ADSENSE_CLIENT } from '../config/ads';

interface Props {
  slot: string;
  format?: 'auto' | 'fluid';
  layoutKey?: string;
  fullWidth?: boolean;
  minHeight?: string;
  class?: string;
}

const {
  slot,
  format = 'auto',
  layoutKey,
  fullWidth = true,
  minHeight,
  class: className = '',
} = Astro.props;

const reservedHeight = minHeight ?? (format === 'fluid' ? '200px' : '260px');
const hasSlot = slot.length > 0;
const layoutKeyAttr = format === 'fluid' ? layoutKey : undefined;
const responsiveAttr = format === 'auto' ? (fullWidth ? 'true' : 'false') : undefined;
---

<div
  class:list={['ad-slot my-12 mx-auto', className]}
  data-nosnippet
  style={`min-height:${reservedHeight};`}
>
  <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium text-center mb-3">
    Advertisement
  </p>
  {hasSlot && (
    <ins
      class="adsbygoogle"
      style="display:block;"
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout-key={layoutKeyAttr}
      data-full-width-responsive={responsiveAttr}
    />
  )}
  {hasSlot && (
    <script is:inline>
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  )}
</div>
```

Notes on the markup choices (do not change):
- `data-nosnippet` keeps ad content out of search snippets.
- `data-ad-layout-key` is only emitted when format is `fluid` (it's required for in-feed, not for display).
- `data-full-width-responsive` is only emitted when format is `auto` (it's a display-ad attribute).
- `is:inline` on the `<script>` prevents Astro from bundling it as a module.

- [ ] **Step 2: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds. The component is not yet used anywhere, so no rendered output to verify yet.

- [ ] **Step 3: Commit**

```bash
git add src/components/AdUnit.astro
git commit -m "Add reusable AdUnit component for AdSense placements"
```

---

### Task 3: Add end-of-article ad slot

**Files:**
- Modify: `src/layouts/ArticleLayout.astro`

- [ ] **Step 1: Import the component and config**

In `src/layouts/ArticleLayout.astro`, in the frontmatter (between the existing imports), add:

```astro
import AdUnit from '../components/AdUnit.astro';
import { AD_SLOTS } from '../config/ads';
```

- [ ] **Step 2: Render the end-of-article ad**

In `src/layouts/ArticleLayout.astro`, locate this block:

```astro
      <div class="prose">
        <slot />
      </div>

      {related.length > 0 && (
```

Insert an `<AdUnit>` between the closing `</div>` of the prose container and the `{related.length > 0` block, so the markup becomes:

```astro
      <div class="prose">
        <slot />
      </div>

      <div class="max-w-3xl mx-auto">
        <AdUnit slot={AD_SLOTS.articleEnd} />
      </div>

      {related.length > 0 && (
```

The `max-w-3xl mx-auto` wrapper keeps the ad visually anchored to the article column rather than stretching to the full container width — looks more intentional next to the narrow prose column above it.

- [ ] **Step 3: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Verify ad markup landed in an article**

Run (Windows PowerShell):
```powershell
Select-String -Path dist/troubleshooting/flat-loaves-five-causes/index.html -Pattern 'class="ad-slot'
```

Or (bash):
```bash
grep -c 'class="ad-slot' dist/troubleshooting/flat-loaves-five-causes/index.html
```

Expected: at least one match (the end-of-article ad reserved-space wrapper). With `AD_SLOTS.articleEnd` empty, no `<ins>` is emitted yet — only the wrapper div and label.

Also verify: `grep "Advertisement" dist/troubleshooting/flat-loaves-five-causes/index.html` returns at least one match.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/ArticleLayout.astro
git commit -m "Add end-of-article ad slot above Keep Reading"
```

---

### Task 4: Add mid-article auto-injection script

**Files:**
- Modify: `src/layouts/ArticleLayout.astro`

- [ ] **Step 1: Add the injection script to the layout**

In `src/layouts/ArticleLayout.astro`, immediately before the closing `</Layout>` tag at the bottom of the template (after the `</main>` tag), add this script block:

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
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  })();
</script>
```

Also add `ADSENSE_CLIENT` to the existing import line in the frontmatter:

```astro
import { AD_SLOTS, ADSENSE_CLIENT } from '../config/ads';
```

The `define:vars` directive injects the slot ID and client ID server-side, so the script ships with concrete values rather than reaching into module state at runtime. The early-return on empty `midSlot` means an empty config is a no-op.

- [ ] **Step 2: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Verify the script shipped**

Run:
```bash
grep -c "firstH2.before" dist/troubleshooting/flat-loaves-five-causes/index.html
```
Expected: at least 1 match — the injection script is in the article HTML.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/ArticleLayout.astro
git commit -m "Auto-inject mid-article ad before first H2"
```

---

### Task 5: Add homepage ad slot 1 (post-newsletter, pre-baker's-percent)

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Import the component and config**

In the frontmatter of `src/pages/index.astro`, with the other imports near the top, add:

```astro
import AdUnit from '../components/AdUnit.astro';
import { AD_SLOTS } from '../config/ads';
```

- [ ] **Step 2: Insert the ad between newsletter and baker's percent sections**

In `src/pages/index.astro`, locate the closing `</section>` of the newsletter section (around line 1189) followed by the comment `<!-- Baker's Percentage Section -->` and the `<section ... id="bakers-percent">` opener (around line 1192). The current markup looks like:

```astro
    </div>
  </section>

  <!-- Baker's Percentage Section -->
  <section class="py-16 bg-[var(--cream-warm)]" id="bakers-percent">
```

Change it to:

```astro
    </div>
  </section>

  <div class="container">
    <AdUnit slot={AD_SLOTS.homepagePostNewsletter} class="max-w-4xl" />
  </div>

  <!-- Baker's Percentage Section -->
  <section class="py-16 bg-[var(--cream-warm)]" id="bakers-percent">
```

The `container` + `max-w-4xl` wrapper matches the width of the surrounding educational sections (the baker's percent section uses `container max-w-4xl` internally).

- [ ] **Step 3: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Verify the ad rendered on homepage**

Run:
```bash
grep -c 'class="ad-slot' dist/index.html
```
Expected: 1 match (just this ad — the second homepage ad lands in Task 6).

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add homepage ad slot between newsletter and bakers-percent"
```

---

### Task 6: Add homepage ad slot 2 (pre-FAQ)

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Insert the ad between equipment and FAQ sections**

In `src/pages/index.astro`, locate the closing `</section>` of the equipment section (around line 1421) followed by the `<section ... id="faq">` opener (around line 1422). The current markup looks like:

```astro
    </div>
  </section>

  <section class="py-16 bg-[var(--cream-warm)]" id="faq">
```

Change it to:

```astro
    </div>
  </section>

  <div class="container">
    <AdUnit slot={AD_SLOTS.homepagePreFaq} class="max-w-4xl" />
  </div>

  <section class="py-16 bg-[var(--cream-warm)]" id="faq">
```

The imports added in Task 5 already cover this slot — no frontmatter change needed.

- [ ] **Step 2: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Verify both homepage ads rendered**

Run:
```bash
grep -c 'class="ad-slot' dist/index.html
```
Expected: 2 matches.

Also verify ordering — the post-newsletter ad should appear in the HTML before the pre-FAQ ad:

```bash
grep -n 'class="ad-slot\|id="bakers-percent\|id="faq' dist/index.html
```

Expected output order: `ad-slot` → `bakers-percent` → `ad-slot` → `faq`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add homepage ad slot between equipment and FAQ"
```

---

### Task 7: Add category in-feed ad

**Files:**
- Modify: `src/pages/[category]/index.astro`

- [ ] **Step 1: Import the component and config**

In the frontmatter of `src/pages/[category]/index.astro`, with the existing imports, add:

```astro
import AdUnit from '../../components/AdUnit.astro';
import { AD_SLOTS, AD_LAYOUT_KEYS } from '../../config/ads';
```

- [ ] **Step 2: Replace the article-grid map with one that splices in an ad after card index 2**

In `src/pages/[category]/index.astro`, locate the existing block:

```astro
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {articlesWithReading.map(({ article, readingMinutes }: any) => (
            <ArticleCard article={article} readingMinutes={readingMinutes} />
          ))}
        </div>
```

Replace with:

```astro
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {articlesWithReading.map(({ article, readingMinutes }: any, i: number) => (
            <>
              <ArticleCard article={article} readingMinutes={readingMinutes} />
              {i === 2 && articlesWithReading.length >= 4 && (
                <AdUnit
                  slot={AD_SLOTS.categoryInFeed}
                  format="fluid"
                  layoutKey={AD_LAYOUT_KEYS.categoryInFeed}
                  class="card !p-6 !my-0"
                  minHeight="200px"
                />
              )}
            </>
          ))}
        </div>
```

The ad uses `class="card !p-6 !my-0"` so its outer container picks up the same `.card` styling (border, background, hover) as a real article card — it visually integrates with the grid. The `!my-0` (Tailwind important modifier) overrides the component's default `my-12` so the ad sits flush in the grid row like its sibling cards rather than expanding the row with extra vertical margin. The `!p-6` ensures consistent padding with article cards.

The `i === 2 && articlesWithReading.length >= 4` guard means: only render when there are at least 4 articles, and only as the fourth grid item (after the 3rd article card). This keeps short categories from getting an ad shoved in awkwardly.

- [ ] **Step 3: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Verify the ad rendered on a populous category**

Run:
```bash
grep -c 'class:list\|class="ad-slot' dist/fundamentals/index.html
```

Expected: at least 1 `ad-slot` match. The `fundamentals` category has 5 articles (≥ 4), so the in-feed ad should render. Verify it sits as the 4th item in the grid:

```bash
grep -n 'card block p-6\|class="ad-slot' dist/fundamentals/index.html
```

Expected: the order should show 3 article cards, then the ad-slot, then the remaining article cards.

- [ ] **Step 5: Verify a small category does NOT render the ad**

`troubleshooting` has only 3 articles, so the guard should short-circuit:

```bash
grep -c 'class="ad-slot' dist/troubleshooting/index.html
```

Expected: 0 matches.

- [ ] **Step 6: Commit**

```bash
git add src/pages/[category]/index.astro
git commit -m "Add in-feed ad after 3rd article on category index pages"
```

---

### Task 8: Augment privacy disclosure with NAI/EDAA opt-out links

**Files:**
- Modify: `src/pages/privacy.astro`

The existing privacy page already has a "Google AdSense" section. This task adds links to the network-wide opt-out tools (NAI and EDAA / Your Online Choices) that AdSense recommends including, without rewriting the existing copy.

- [ ] **Step 1: Append NAI/EDAA paragraph to the AdSense section**

In `src/pages/privacy.astro`, locate this paragraph inside the "Google AdSense" section:

```astro
      <p>
        We do not control the cookies used by Google or any other third-party advertiser. Their use of cookies is governed by their own privacy policies.
      </p>
```

Immediately AFTER that paragraph (still inside the AdSense H2 block, before the next `<h2>Analytics</h2>`), insert:

```astro
      <p>
        For broader opt-out options across many advertising networks, you can visit the <a href="https://optout.networkadvertising.org/" rel="noopener" target="_blank">Network Advertising Initiative opt-out page</a> or the <a href="https://www.youronlinechoices.eu/" rel="noopener" target="_blank">Your Online Choices</a> page (EU/EEA visitors).
      </p>
```

- [ ] **Step 2: Run the build**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Verify the new links are in the privacy page**

Run:
```bash
grep -c "optout.networkadvertising.org\|youronlinechoices.eu" dist/privacy/index.html
```
Expected: 2 matches.

- [ ] **Step 4: Commit**

```bash
git add src/pages/privacy.astro
git commit -m "Add NAI and EDAA opt-out links to privacy AdSense section"
```

---

### Task 9: Final build, preview, and deployment-readiness verification

**Files:** none modified — this task is a verification gate before the user populates slot IDs and ships.

- [ ] **Step 1: Clean build and preview**

Run:
```bash
npm run build
npm run preview
```

The preview server should start at `http://localhost:4321` (or similar — note the URL it prints).

- [ ] **Step 2: Browser walkthrough (manual)**

Open the preview URL and confirm each of the following:

1. **Homepage (`/`):**
   - No "Advertisement" label appears above or inside the calculator.
   - One "Advertisement" label appears between the newsletter section and the baker's percent section.
   - One "Advertisement" label appears between the equipment section and the FAQ.
   - Reserved space is visible (~260px) for each ad, but no actual ad fills it (slot IDs still blank — this is correct).

2. **An article page (e.g., `/troubleshooting/flat-loaves-five-causes/`):**
   - One "Advertisement" label appears just before the first `<h2>` (the first major section heading).
   - One "Advertisement" label appears between the article body and the "Keep Reading" related-articles row.
   - No layout shift visible when the page loads.

3. **A populous category index (e.g., `/fundamentals/`):**
   - The article-card grid shows 3 article cards, then a card-shaped "Advertisement" tile, then the remaining article cards.

4. **A sparse category index (e.g., `/troubleshooting/` — 3 articles):**
   - No ad tile in the grid.

5. **Calculator UI (within `/`):**
   - Calculator inputs, sliders, and result panels look identical to before — no ads inserted into the tool.

6. **Newsletter section:**
   - No ads adjacent to or inside the newsletter signup.

7. **Static pages:**
   - `/about/`, `/contact/`, `/privacy/`, `/guides/` — zero "Advertisement" labels on any of these pages.

8. **Privacy page:**
   - The Google AdSense section now includes the new paragraph with NAI and Your Online Choices links.

- [ ] **Step 3: Verify `ads.txt` is reachable**

In a separate terminal:
```bash
curl http://localhost:4321/ads.txt
```
Expected: `google.com, pub-7820884299125377, DIRECT, f08c47fec0942fa0`

- [ ] **Step 4: Stop the preview server**

In the preview terminal: `Ctrl+C`.

- [ ] **Step 5: Confirm no uncommitted changes**

Run:
```bash
git status
```
Expected: clean working tree (besides `.claude/settings.local.json` which is not part of this work).

- [ ] **Step 6: Document deployment steps for the user**

The implementation is complete in code, but the ads will not actually fill until the user does the following in the AdSense console (this is a checklist for the user, NOT a code change):

1. Create five ad units in the AdSense console:
   - **Display ad** — name "Homepage Post-Newsletter", responsive
   - **Display ad** — name "Homepage Pre-FAQ", responsive
   - **Display ad** — name "Article Mid", responsive
   - **Display ad** — name "Article End", responsive
   - **In-feed ad** — name "Category In-Feed" (run the in-feed wizard against `/fundamentals/`)
2. Copy each slot ID from the AdSense console.
3. Paste them into `src/config/ads.ts`:
   ```ts
   export const AD_SLOTS = {
     homepagePostNewsletter: '<id from console>',
     homepagePreFaq: '<id from console>',
     articleMid: '<id from console>',
     articleEnd: '<id from console>',
     categoryInFeed: '<id from console>',
   } as const;

   export const AD_LAYOUT_KEYS = {
     categoryInFeed: '<layout key from in-feed wizard>',
   } as const;
   ```
4. `npm run build && npm run preview`, confirm at least one slot fills with a real ad in the browser.
5. Commit and push.
6. After deploy, allow up to ~1 hour for AdSense to start filling ad requests on the new slots. Check the AdSense console "Sites" tab for any policy issues 24h after going live.

This list is informational and does not require a commit on its own. If you make any final tweaks while running the verification above, commit them now.

---

## Self-Review Notes

This plan has been self-reviewed for:

- **Spec coverage:** Every slot in the spec's "Ad Slot Inventory" has a corresponding implementation task (slots 1–2 in Tasks 5–6, slots 3–4 in Tasks 3–4, slot 5 in Task 7). The `ads.txt` file is in Task 1. The privacy disclosure is in Task 8. The AdUnit component is in Task 2. Final verification is in Task 9.
- **Placeholders:** No "TBD" / "TODO" / "implement later" / "similar to" references. Every code block contains the exact code to write.
- **Type consistency:** `AD_SLOTS.articleEnd`, `AD_SLOTS.articleMid`, `AD_SLOTS.homepagePostNewsletter`, `AD_SLOTS.homepagePreFaq`, `AD_SLOTS.categoryInFeed`, `AD_LAYOUT_KEYS.categoryInFeed`, and `ADSENSE_CLIENT` are defined in Task 1 and referenced under those exact names in every subsequent task.
