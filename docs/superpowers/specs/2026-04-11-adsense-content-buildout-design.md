# AdSense Content Buildout Design

**Date:** 2026-04-11
**Goal:** Expand The Dough Formula from a single-page bread calculator into a content-backed site that can pass Google AdSense review on first submission.

## Context

The site is currently a single Astro page (`src/pages/index.astro`) wrapping a bread calculator. It has no written content beyond the calculator UI, no About page, no Privacy Policy, and no footer. An AdSense application in its current state would almost certainly be rejected for thin content and missing required pages.

This design covers the work to add a full content library, the required legal and meta pages, site-wide navigation, and a footer, while preserving the existing hero and calculator as the primary landing experience.

## Scope Summary

- **Volume:** 22 long-form articles (1200 to 1800 words each), roughly 30,000 words total
- **Voice:** Brand voice as "The Dough Formula." No named author, no invented persona
- **Structure:** Topic categories, not a flat blog or pillar clusters
- **Legal pages:** About, Contact, Privacy Policy
- **Contact email:** `admin@thedoughformula.com` (forwarding configured via Cloudflare Email Routing)
- **Design alignment:** All new pages must match the existing visual language (cream background, Fraunces display font, accent-gold highlights, `.card` patterns)

## Content Architecture

Articles are managed via Astro content collections, not as individual `.astro` files per page.

```
src/content/
  config.ts
  fundamentals/
    bakers-percentages-explained.md
    hydration-60-to-90.md
    what-fermentation-actually-does.md
    desired-dough-temperature.md
    preferments-101.md
  techniques/
    autolyse-step-by-step.md
    stretch-folds-vs-coil-folds.md
    shaping-a-boule.md
    scoring-sourdough.md
    windowpane-test.md
  ingredients/
    bread-flour-vs-all-purpose.md
    working-with-whole-grains.md
    role-of-salt-in-bread.md
    yeast-types-compared.md
  styles/
    sourdough-for-beginners.md
    classic-french-baguette.md
    high-hydration-focaccia.md
    ciabatta-explained.md
    country-loaf-pain-de-campagne.md
  troubleshooting/
    gummy-crumb-explained.md
    flat-loaves-five-causes.md
    reading-overproofed-dough.md
```

Each collection uses a Zod schema defined in `src/content/config.ts`:

```ts
const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['fundamentals', 'techniques', 'ingredients', 'styles', 'troubleshooting']),
  publishedDate: z.date(),
  updatedDate: z.date().optional(),
  coverImage: z.string().optional(),
  draft: z.boolean().default(false),
});
```

### Routes

- `src/pages/[category]/index.astro` — dynamic category index. Lists all articles in that category with cover image, title, description, reading time.
- `src/pages/[category]/[slug].astro` — article page. Reads from the content collection and renders via `ArticleLayout.astro`.
- `src/pages/guides/index.astro` — optional top-level hub listing all 5 categories and the 6 most recent articles.

URL examples:
- `thedoughformula.com/techniques/autolyse-step-by-step`
- `thedoughformula.com/fundamentals/bakers-percentages-explained`
- `thedoughformula.com/styles/high-hydration-focaccia`

## Article Page Template

New file: `src/layouts/ArticleLayout.astro`. Used by all article pages. Structure:

1. Site nav (inherited from `Layout.astro`)
2. Breadcrumbs (`Home > [Category] > [Article]`)
3. Article header: category badge, title (Fraunces display), one-line description, published date, reading time (computed in `ArticleLayout.astro` from the raw body at 200 words per minute, rounded up)
4. Cover image if provided (Astro `Image` component, `loading="eager"`, responsive widths)
5. Article body, wrapped in a `.prose` container
6. Related articles strip: 3 articles from the same category, excluding the current one
7. Footer (inherited from `Layout.astro`)

JSON-LD structured data is injected in the head for both `BreadcrumbList` and `Article` schemas.

### Prose styling

A new CSS block added to `src/styles/global.css`:

```css
.prose {
  max-width: 680px;
  line-height: 1.75;
}
.prose h2 { /* Fraunces, larger */ }
.prose h3 { /* Fraunces, medium */ }
.prose p { margin: 1.25em 0; }
.prose a { /* accent-gold with underline offset */ }
.prose ul, .prose ol { /* tight but breathable */ }
.prose blockquote { /* italic Cormorant, border-left accent-gold */ }
```

No `@tailwindcss/typography` plugin. Keeping the CSS lean.

## Navigation and Home Page Integration

### Top nav

The existing nav in `index.astro` is lightweight. It gets replaced with a site-wide nav component that includes:

- Logo and site name (left, unchanged)
- `Guides` link with a hover dropdown listing the 5 categories
- `About` link
- `Begin Your Bake` CTA button (unchanged)
- Mobile: hamburger toggle opens a sheet with the same links

The nav moves from `index.astro` into `Layout.astro` so it appears on every page.

### Home page additions

Added below the existing "Understanding Baker's Percentages" section:

**"Explore Guides" section**
- 5 category cards in a responsive grid
- Each card: icon, category name (Fraunces), short description, article count
- Links to `/fundamentals/`, `/techniques/`, etc.
- Styled with the existing `.card` class

**"Latest from the Guides" strip**
- 4 most recent articles (sorted by `publishedDate` descending) as horizontal cards
- Cover image, category badge, title, reading time
- Links to article pages

### Footer (new, site-wide)

Added to `Layout.astro` so it appears on every page, including the existing home page. Four columns on desktop, stacked on mobile:

1. **Brand column**: small logo, site name, one-line tagline
2. **Categories**: 5 links, one per category
3. **Company**: About, Contact, Privacy Policy
4. **Tagline**: "Built for home bakers"

Copyright row at the bottom with current year and site name.

## Legal and Meta Pages

Three standalone pages, each using `Layout.astro` for the shared nav and footer.

### `/about/` (`src/pages/about.astro`)

Roughly 500 words in brand voice. Covers:
- What The Dough Formula is (calculator plus guide library)
- Who it is for (home bakers who want real numbers)
- The problem it solves (recipes that do not scale, confusing percentages)
- An invitation to explore the guides

No invented founder story. No fake timeline. No author photo.

### `/contact/` (`src/pages/contact.astro`)

Short page. Contains:
- One paragraph on how to reach the site
- Prominent mailto link to `admin@thedoughformula.com`
- Short "what to expect" note: response time, what we can help with, what we cannot
- No contact form (removes a failure surface and keeps the page static)

### `/privacy/` (`src/pages/privacy.astro`)

Full policy. Includes all sections AdSense specifically checks for.

Sections:
1. Introduction and effective date
2. Information we collect (usage data only, not directly collected PII)
3. Cookies and tracking technologies
4. Google AdSense disclosure (the critical block for approval):
   - States Google as a third-party vendor uses cookies to serve ads
   - References DoubleClick DART cookie
   - Provides opt-out link: `https://www.google.com/settings/ads`
   - Links to Google's partner policy
5. Cloudflare Web Analytics disclosure
6. Third-party links disclaimer
7. Children's privacy (COPPA: no data from children under 13)
8. User rights (access, deletion, opt-out)
9. Changes to the policy
10. Contact for privacy questions (admin email)

Effective date: set to the deployment date.

## Writing Guidelines

Every article in the content collection must follow these rules. These apply to legal and meta pages too where tone permits.

### Voice

- Warm but practical. Like a baker friend who has been doing this a while.
- Second person ("you") for instructions
- First person plural ("we") used sparingly
- Never "I" (no named author)
- Short paragraphs, 2 to 4 sentences each
- Specifics over abstractions

### Structural rules

- Open with a concrete scene or problem, not a definition
- H2 heading every 200 to 400 words
- Mix prose and lists. No wall of bullet points.
- Every article has at least one "common mistakes" or "what goes wrong" passage
- End with a concrete next step or related-article link, not a summary paragraph

### Forbidden elements

Em dashes of any kind, including `—`, `–`, and `--`. Use commas, parentheses, or two sentences.

Banned phrases and patterns:
- "It's worth noting that"
- "In conclusion"
- "Let's dive in" / "Let's explore"
- "Not just X, but Y"
- "In the world of [X]"
- "Navigate the complexities of"
- "Harness the power of"
- "Delve into"
- "Unleash"
- "At the end of the day"
- Rule-of-three phrases ("clear, concise, and effective")
- "Game changer," "revolutionary," "next level"
- More than one paragraph opener like "Moreover," "Furthermore," "Additionally," per article

### Formatting

- Fahrenheit first, Celsius in parentheses
- Baker's percentages as `70% hydration`
- Small fractions spelled ("one third") except in ingredient amounts or percentages
- Cross-links to the calculator page whenever an article mentions a number the calculator handles

### Quality bar

After drafting, every article gets re-read. Any generic-sounding paragraph gets rewritten before commit.

## Implementation Phases

Work proceeds in four phases so the site is never broken mid-build.

### Phase 1: Scaffolding

- Install `@astrojs/mdx`
- Create `src/content/config.ts` with five collections and the Zod schema
- Create `src/layouts/ArticleLayout.astro`
- Create dynamic routes `src/pages/[category]/index.astro` and `src/pages/[category]/[slug].astro`
- Create `src/pages/guides/index.astro` as a top-level hub
- Add `.prose` styles to `global.css`
- Build should succeed with zero articles (empty collections allowed)

### Phase 2: Structural pages and chrome

- Write About, Contact, Privacy pages
- Extract the nav from `index.astro` into `Layout.astro`
- Add the new footer to `Layout.astro`
- Add the "Explore Guides" section and "Latest from the Guides" strip to `index.astro`
- Build should succeed. Home page and all new pages render, even though article lists are empty.

### Phase 3: Article writing

- Write all 22 articles as Markdown files in the appropriate collection folder
- One category at a time in the order listed in the article list below
- Publish dates spread across the past 6 to 10 weeks to look natural, with roughly 2 to 3 articles per week and no two articles sharing the exact same date
- Source cover images (optional, per article) into `src/assets/articles/`
- Build succeeds after each category

### Phase 4: Polish and verify

- Run `npm run build`
- Verify the generated sitemap contains all new routes
- Verify AdSense script still loads in `<head>` of built HTML
- Open at least one article, one category index, and the guides hub in preview
- Verify internal links resolve
- Verify cover images are optimized and under 200KB each
- Verify Privacy Policy is reachable from the footer of every page (AdSense explicitly checks this)

## Article List

### Fundamentals

1. Baker's Percentages Explained For Home Bakers
2. Hydration In Bread Dough, From 60% To 90%
3. What Fermentation Actually Does To Dough
4. Desired Dough Temperature And Why It Matters
5. Preferments 101: Poolish, Biga, And Levain Compared

### Techniques

6. How To Do An Autolyse (And When To Skip It)
7. Stretch And Folds Versus Coil Folds
8. Shaping A Round Boule That Holds Its Form
9. Scoring Sourdough: Patterns And Blade Angles
10. The Windowpane Test: Reading Gluten Development

### Ingredients

11. Bread Flour Versus All Purpose: What Actually Changes
12. Working Whole Grain Flours Into Your Dough
13. The Role Of Salt In Bread (It's More Than Flavor)
14. Instant, Active Dry, Or Fresh Yeast: A Practical Guide

### Styles

15. A Beginner's Guide To Sourdough
16. Baking A Classic French Baguette At Home
17. High Hydration Focaccia, Step By Step
18. Ciabatta: The Dough That Shouldn't Work, But Does
19. The Country Loaf (Pain De Campagne)

### Troubleshooting

20. Why Your Crumb Is Gummy (And How To Fix It)
21. Flat Loaves: Diagnosing The Five Most Common Causes
22. Reading An Overproofed Dough Before It's Too Late

## Open Items and Non-Goals

**Open items deferred for later:**

- The non-functional newsletter form at `index.astro:1204` is left alone. Will be revisited after AdSense approval.
- Sending mail from `admin@thedoughformula.com` (only receiving/forwarding is set up). Reviewers do not check outbound.
- Post-approval performance optimizations (font trimming, input debouncing, innerHTML refactoring) are separate work.

**Explicitly out of scope for this spec:**

- Rewriting the existing calculator
- Adding new calculator features
- Analytics changes beyond what already exists
- Comment systems, user accounts, or any dynamic features
- Migrating away from Astro or Cloudflare Pages

## Success Criteria

- All 22 articles build and render correctly
- Privacy Policy, About, and Contact are reachable from the footer on every page, including home
- Sitemap contains all new routes
- Lighthouse run on a sample article shows no regression versus the home page (LCP under 2.5s, no layout shift)
- No em dashes exist in any article, legal page, or new UI copy
- No banned phrases from the writing guidelines appear in any article
- AdSense script in `Layout.astro` still loads correctly on every page
- Home page hero and calculator are unchanged from their current state
