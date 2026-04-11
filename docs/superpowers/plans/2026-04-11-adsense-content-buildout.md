# AdSense Content Buildout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand The Dough Formula from a single-page calculator into a content-backed site with 22 articles, legal pages, and site-wide navigation, so Google AdSense will approve the site on first submission.

**Architecture:** Astro content collections drive a typed Markdown library organized into five topic categories. Dynamic routes generate category index pages and article pages at build time. A shared `ArticleLayout.astro` renders all articles. The existing `Layout.astro` gains a site-wide nav and footer so every page (home, guides, about, contact, privacy, articles) has consistent chrome.

**Tech Stack:** Astro 5, `@astrojs/mdx` for Markdown/MDX content, Tailwind v4, Zod schemas for content validation, existing `@astrojs/sitemap` picks up new routes automatically.

**Note on testing:** The project has no unit test framework. The verification gate for every task is `npm run build` succeeding. Visual and behavioral verification is done in `npm run preview`. Treat "build succeeds" as the "test passes" criterion.

**Spec reference:** `docs/superpowers/specs/2026-04-11-adsense-content-buildout-design.md`

---

## File Map

**New files:**
- `src/content/config.ts` — Zod schema and 5 content collection definitions
- `src/layouts/ArticleLayout.astro` — shared article page template
- `src/components/SiteNav.astro` — site-wide navigation component
- `src/components/SiteFooter.astro` — site-wide footer component
- `src/components/CategoryCard.astro` — reused card for category grid
- `src/components/ArticleCard.astro` — reused card for article lists
- `src/pages/[category]/index.astro` — dynamic category index route
- `src/pages/[category]/[slug].astro` — dynamic article route
- `src/pages/guides/index.astro` — guides hub page
- `src/pages/about.astro`
- `src/pages/contact.astro`
- `src/pages/privacy.astro`
- `src/content/fundamentals/*.md` (5 files)
- `src/content/techniques/*.md` (5 files)
- `src/content/ingredients/*.md` (4 files)
- `src/content/styles/*.md` (5 files)
- `src/content/troubleshooting/*.md` (3 files)

**Modified files:**
- `src/layouts/Layout.astro` — wire in `SiteNav` and `SiteFooter`
- `src/pages/index.astro` — remove inline nav, add "Explore Guides" section and "Latest" strip
- `src/styles/global.css` — add `.prose` block for article body styling
- `package.json` — adds `@astrojs/mdx`
- `astro.config.mjs` — register MDX integration

---

## Phase 1: Scaffolding

Goal: Get content collections, routes, and templates in place. Build must succeed with empty collections.

### Task 1: Install MDX integration and register it

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Install the MDX integration**

Run:
```bash
cd C:/Users/zckpe/Documents/claude-projects/thedoughformula
npm install @astrojs/mdx
```
Expected: package installs with no peer dependency warnings.

- [ ] **Step 2: Register MDX in `astro.config.mjs`**

Replace the contents of `astro.config.mjs` with:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://thedoughformula.com',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 3: Verify build still succeeds**

Run:
```bash
npm run build
```
Expected: build completes with no errors and output includes existing `index.html`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json astro.config.mjs
git commit -m "Install @astrojs/mdx and register integration"
```

### Task 2: Create content collection config

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum([
    'fundamentals',
    'techniques',
    'ingredients',
    'styles',
    'troubleshooting',
  ]),
  publishedDate: z.date(),
  updatedDate: z.date().optional(),
  coverImage: z.string().optional(),
  draft: z.boolean().default(false),
});

const fundamentals = defineCollection({ type: 'content', schema: articleSchema });
const techniques = defineCollection({ type: 'content', schema: articleSchema });
const ingredients = defineCollection({ type: 'content', schema: articleSchema });
const styles = defineCollection({ type: 'content', schema: articleSchema });
const troubleshooting = defineCollection({ type: 'content', schema: articleSchema });

export const collections = {
  fundamentals,
  techniques,
  ingredients,
  styles,
  troubleshooting,
};
```

- [ ] **Step 2: Create empty collection folders so Astro detects them**

Run:
```bash
mkdir -p src/content/fundamentals src/content/techniques src/content/ingredients src/content/styles src/content/troubleshooting
```

- [ ] **Step 3: Add `.gitkeep` files so the empty directories are tracked**

Run:
```bash
touch src/content/fundamentals/.gitkeep src/content/techniques/.gitkeep src/content/ingredients/.gitkeep src/content/styles/.gitkeep src/content/troubleshooting/.gitkeep
```

- [ ] **Step 4: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds. Astro may log a warning about empty collections; that is fine.

- [ ] **Step 5: Commit**

```bash
git add src/content/
git commit -m "Add content collection config with five category collections"
```

### Task 3: Add prose styles to global.css

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Append a `.prose` block at the end of `src/styles/global.css`**

Append:
```css
/* ============================================
   ARTICLE PROSE STYLES
   ============================================ */

.prose {
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
  color: var(--espresso);
  font-family: var(--font-editorial, Georgia, serif);
  font-size: 1.0625rem;
  line-height: 1.75;
}

.prose > * + * {
  margin-top: 1.25em;
}

.prose h2 {
  font-family: var(--font-display, Georgia, serif);
  font-size: 1.875rem;
  line-height: 1.2;
  margin-top: 2em;
  margin-bottom: 0.5em;
  color: var(--espresso);
}

.prose h3 {
  font-family: var(--font-display, Georgia, serif);
  font-size: 1.375rem;
  line-height: 1.25;
  margin-top: 1.6em;
  margin-bottom: 0.4em;
  color: var(--espresso);
}

.prose p {
  margin: 1.25em 0;
}

.prose a {
  color: var(--accent-gold);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.prose a:hover {
  text-decoration-thickness: 2px;
}

.prose strong {
  font-weight: 600;
  color: var(--espresso);
}

.prose em {
  font-style: italic;
}

.prose ul, .prose ol {
  margin: 1.25em 0;
  padding-left: 1.5em;
}

.prose ul { list-style: disc; }
.prose ol { list-style: decimal; }

.prose li {
  margin: 0.5em 0;
}

.prose li > p {
  margin: 0.25em 0;
}

.prose blockquote {
  border-left: 3px solid var(--accent-gold);
  padding: 0.5em 1.25em;
  margin: 1.5em 0;
  font-family: var(--font-editorial, Georgia, serif);
  font-style: italic;
  color: var(--crust-brown);
}

.prose code {
  background: var(--cream-warm);
  padding: 0.125em 0.375em;
  border-radius: 3px;
  font-size: 0.9em;
}

.prose hr {
  border: 0;
  border-top: 1px solid var(--border-light);
  margin: 2.5em 0;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds with the new CSS bundled.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "Add .prose styles for article body typography"
```

### Task 4: Create ArticleCard component

**Files:**
- Create: `src/components/ArticleCard.astro`

- [ ] **Step 1: Write the component**

```astro
---
import type { CollectionEntry } from 'astro:content';

type AnyArticle =
  | CollectionEntry<'fundamentals'>
  | CollectionEntry<'techniques'>
  | CollectionEntry<'ingredients'>
  | CollectionEntry<'styles'>
  | CollectionEntry<'troubleshooting'>;

interface Props {
  article: AnyArticle;
  readingMinutes: number;
}

const { article, readingMinutes } = Astro.props;
const href = `/${article.data.category}/${article.slug}/`;
const dateLabel = article.data.publishedDate.toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
});
---

<a href={href} class="card block p-6 hover:shadow-md transition-all">
  <div class="flex items-center gap-3 mb-3">
    <span class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium">
      {article.data.category}
    </span>
    <span class="text-xs text-[var(--crust-brown)]">
      {readingMinutes} min read
    </span>
  </div>
  <h3 class="font-display text-xl mb-2 leading-snug">{article.data.title}</h3>
  <p class="text-[var(--crust-brown)] text-sm leading-relaxed mb-3">
    {article.data.description}
  </p>
  <p class="text-xs text-[var(--crust-brown)]">{dateLabel}</p>
</a>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds (the component is unused but must compile).

- [ ] **Step 3: Commit**

```bash
git add src/components/ArticleCard.astro
git commit -m "Add ArticleCard component for article listing displays"
```

### Task 5: Create CategoryCard component

**Files:**
- Create: `src/components/CategoryCard.astro`

- [ ] **Step 1: Write the component**

```astro
---
interface Props {
  slug: string;
  name: string;
  description: string;
  count: number;
  icon: string;
}

const { slug, name, description, count, icon } = Astro.props;
---

<a href={`/${slug}/`} class="card block p-6 hover:shadow-md transition-all">
  <div class="w-12 h-12 mb-4 flex items-center justify-center text-[var(--accent-gold)]" set:html={icon} />
  <h3 class="font-display text-xl mb-2">{name}</h3>
  <p class="text-[var(--crust-brown)] text-sm leading-relaxed mb-3">
    {description}
  </p>
  <p class="text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium">
    {count} {count === 1 ? 'guide' : 'guides'}
  </p>
</a>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/CategoryCard.astro
git commit -m "Add CategoryCard component for guide category grid"
```

### Task 6: Create ArticleLayout

**Files:**
- Create: `src/layouts/ArticleLayout.astro`

- [ ] **Step 1: Write the layout**

```astro
---
import Layout from './Layout.astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import ArticleCard from '../components/ArticleCard.astro';

type AnyArticle =
  | CollectionEntry<'fundamentals'>
  | CollectionEntry<'techniques'>
  | CollectionEntry<'ingredients'>
  | CollectionEntry<'styles'>
  | CollectionEntry<'troubleshooting'>;

interface Props {
  article: AnyArticle;
  rawBody: string;
}

const { article, rawBody } = Astro.props;
const category = article.data.category;

const words = rawBody.trim().split(/\s+/).length;
const readingMinutes = Math.max(1, Math.ceil(words / 200));

const dateLabel = article.data.publishedDate.toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const categoryCollections = {
  fundamentals: await getCollection('fundamentals'),
  techniques: await getCollection('techniques'),
  ingredients: await getCollection('ingredients'),
  styles: await getCollection('styles'),
  troubleshooting: await getCollection('troubleshooting'),
};
const sameCategory = categoryCollections[category].filter(
  (a) => a.slug !== article.slug && !a.data.draft
);
const related = sameCategory
  .sort((a, b) => +b.data.publishedDate - +a.data.publishedDate)
  .slice(0, 3);

const relatedWordCounts = related.map((r) => r.body.trim().split(/\s+/).length);
const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thedoughformula.com/' },
    { '@type': 'ListItem', position: 2, name: categoryLabel, item: `https://thedoughformula.com/${category}/` },
    { '@type': 'ListItem', position: 3, name: article.data.title, item: `https://thedoughformula.com/${category}/${article.slug}/` },
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.data.title,
  description: article.data.description,
  datePublished: article.data.publishedDate.toISOString(),
  dateModified: (article.data.updatedDate ?? article.data.publishedDate).toISOString(),
  author: { '@type': 'Organization', name: 'The Dough Formula' },
  publisher: {
    '@type': 'Organization',
    name: 'The Dough Formula',
    url: 'https://thedoughformula.com/',
  },
  mainEntityOfPage: `https://thedoughformula.com/${category}/${article.slug}/`,
};
---

<Layout title={`${article.data.title} | The Dough Formula`} description={article.data.description}>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(breadcrumbJsonLd)} />
    <script type="application/ld+json" set:html={JSON.stringify(articleJsonLd)} />
  </Fragment>

  <main id="main-content" class="py-10 md:py-16">
    <article class="container">
      <nav aria-label="Breadcrumb" class="text-sm text-[var(--crust-brown)] mb-8 max-w-[680px] mx-auto">
        <a href="/" class="hover:text-[var(--espresso)]">Home</a>
        <span class="mx-2">/</span>
        <a href={`/${category}/`} class="hover:text-[var(--espresso)]">{categoryLabel}</a>
        <span class="mx-2">/</span>
        <span class="text-[var(--espresso)]">{article.data.title}</span>
      </nav>

      <header class="max-w-[680px] mx-auto mb-10">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">
          {categoryLabel}
        </p>
        <h1 class="font-display text-4xl md:text-5xl leading-tight mb-5">
          {article.data.title}
        </h1>
        <p class="font-editorial text-lg text-[var(--crust-brown)] leading-relaxed mb-6">
          {article.data.description}
        </p>
        <p class="text-sm text-[var(--crust-brown)]">
          {dateLabel} · {readingMinutes} min read
        </p>
      </header>

      <div class="prose">
        <slot />
      </div>

      {related.length > 0 && (
        <section class="mt-20 max-w-5xl mx-auto">
          <h2 class="font-display text-2xl md:text-3xl mb-6 text-center">Keep Reading</h2>
          <div class="grid md:grid-cols-3 gap-4">
            {related.map((r, i) => (
              <ArticleCard article={r} readingMinutes={Math.max(1, Math.ceil(relatedWordCounts[i] / 200))} />
            ))}
          </div>
        </section>
      )}
    </article>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds. Layout is not yet referenced from any route.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/ArticleLayout.astro
git commit -m "Add ArticleLayout with breadcrumbs, JSON-LD, and related articles"
```

### Task 7: Create dynamic category index route

**Files:**
- Create: `src/pages/[category]/index.astro`

- [ ] **Step 1: Write the route**

```astro
---
import Layout from '../../layouts/Layout.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const categories = [
    { slug: 'fundamentals', name: 'Fundamentals', description: 'The core ideas every home baker should understand: percentages, hydration, fermentation, and dough temperature.' },
    { slug: 'techniques', name: 'Techniques', description: 'The hands-on methods that turn flour and water into bread with structure, flavor, and an open crumb.' },
    { slug: 'ingredients', name: 'Ingredients', description: 'What each ingredient in your dough is actually doing, and how to choose the right one for the bread you want.' },
    { slug: 'styles', name: 'Bread Styles', description: 'Deep dives into classic bread styles, from sourdough and baguettes to focaccia and ciabatta.' },
    { slug: 'troubleshooting', name: 'Troubleshooting', description: 'Diagnose what went wrong with your last bake and fix it on the next one.' },
  ];

  return Promise.all(
    categories.map(async (cat) => {
      const articles = await getCollection(cat.slug as any, ({ data }) => !data.draft);
      const sorted = articles.sort(
        (a, b) => +b.data.publishedDate - +a.data.publishedDate
      );
      return {
        params: { category: cat.slug },
        props: { name: cat.name, description: cat.description, articles: sorted },
      };
    })
  );
}

const { name, description, articles } = Astro.props;

const articlesWithReading = articles.map((a: any) => ({
  article: a,
  readingMinutes: Math.max(1, Math.ceil(a.body.trim().split(/\s+/).length / 200)),
}));
---

<Layout title={`${name} | The Dough Formula`} description={description}>
  <main id="main-content" class="py-16">
    <div class="container">
      <header class="text-center mb-14 max-w-2xl mx-auto">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">
          The Dough Formula Guides
        </p>
        <h1 class="font-display text-4xl md:text-5xl mb-5">{name}</h1>
        <p class="text-[var(--crust-brown)] leading-relaxed">{description}</p>
      </header>

      {articles.length === 0 ? (
        <p class="text-center text-[var(--crust-brown)]">No articles yet. Check back soon.</p>
      ) : (
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {articlesWithReading.map(({ article, readingMinutes }: any) => (
            <ArticleCard article={article} readingMinutes={readingMinutes} />
          ))}
        </div>
      )}
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds. Five category index routes generated under `dist/` even though they render empty state. Verify at least one exists:
```bash
ls dist/fundamentals/index.html dist/techniques/index.html
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/[category]/index.astro
git commit -m "Add dynamic category index route for all five collections"
```

### Task 8: Create dynamic article route

**Files:**
- Create: `src/pages/[category]/[slug].astro`

- [ ] **Step 1: Write the route**

```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import ArticleLayout from '../../layouts/ArticleLayout.astro';

type AnyArticle =
  | CollectionEntry<'fundamentals'>
  | CollectionEntry<'techniques'>
  | CollectionEntry<'ingredients'>
  | CollectionEntry<'styles'>
  | CollectionEntry<'troubleshooting'>;

export async function getStaticPaths() {
  const collections = ['fundamentals', 'techniques', 'ingredients', 'styles', 'troubleshooting'] as const;
  const paths: { params: { category: string; slug: string }; props: { article: AnyArticle } }[] = [];

  for (const col of collections) {
    const articles = await getCollection(col, ({ data }) => !data.draft);
    for (const article of articles) {
      paths.push({
        params: { category: col, slug: article.slug },
        props: { article },
      });
    }
  }
  return paths;
}

const { article } = Astro.props;
const { Content } = await article.render();
---

<ArticleLayout article={article} rawBody={article.body}>
  <Content />
</ArticleLayout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds. No article routes are generated yet because collections are empty.

- [ ] **Step 3: Commit**

```bash
git add src/pages/[category]/[slug].astro
git commit -m "Add dynamic article route rendering via ArticleLayout"
```

### Task 9: Create guides hub page

**Files:**
- Create: `src/pages/guides/index.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Layout from '../../layouts/Layout.astro';
import ArticleCard from '../../components/ArticleCard.astro';
import CategoryCard from '../../components/CategoryCard.astro';
import { getCollection } from 'astro:content';

const categories = [
  {
    slug: 'fundamentals',
    name: 'Fundamentals',
    description: 'The core ideas every baker should know.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>`,
  },
  {
    slug: 'techniques',
    name: 'Techniques',
    description: 'Hands-on methods that shape good bread.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 18c3-6 13-6 16 0"/><path d="M8 10c1-2 3-3 4-3s3 1 4 3"/></svg>`,
  },
  {
    slug: 'ingredients',
    name: 'Ingredients',
    description: 'What goes into dough, and why it matters.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 10c0-3 3-6 7-6s7 3 7 6-3 6-7 6-7-3-7-6z"/><path d="M7 16l-2 4M17 16l2 4"/></svg>`,
  },
  {
    slug: 'styles',
    name: 'Bread Styles',
    description: 'Deep dives into classic loaves.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="9" ry="6"/><path d="M6 11c2-3 5-4 6-4s4 1 6 4"/></svg>`,
  },
  {
    slug: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Diagnose and fix common bake failures.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h0"/></svg>`,
  },
];

const allCollections = await Promise.all([
  getCollection('fundamentals', ({ data }) => !data.draft),
  getCollection('techniques', ({ data }) => !data.draft),
  getCollection('ingredients', ({ data }) => !data.draft),
  getCollection('styles', ({ data }) => !data.draft),
  getCollection('troubleshooting', ({ data }) => !data.draft),
]);
const allArticles = allCollections.flat();
const recent = allArticles
  .sort((a, b) => +b.data.publishedDate - +a.data.publishedDate)
  .slice(0, 6);
const recentWithReading = recent.map((a) => ({
  article: a,
  readingMinutes: Math.max(1, Math.ceil(a.body.trim().split(/\s+/).length / 200)),
}));

const countsBySlug: Record<string, number> = Object.fromEntries(
  allCollections.map((col, i) => [categories[i].slug, col.length])
);
---

<Layout title="Guides | The Dough Formula" description="Articles, techniques, and troubleshooting for home bread bakers. Learn baker's percentages, shaping, hydration, and more.">
  <main id="main-content" class="py-16">
    <div class="container">
      <header class="text-center max-w-2xl mx-auto mb-14">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">
          The Guide Library
        </p>
        <h1 class="font-display text-4xl md:text-5xl mb-5">Learn The Craft</h1>
        <p class="text-[var(--crust-brown)] leading-relaxed">
          Practical articles on the techniques, ingredients, and styles that make good bread. Browse by category or start with the most recent guides below.
        </p>
      </header>

      <section class="mb-20">
        <h2 class="font-display text-2xl mb-6 text-center">Browse By Category</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {categories.map((cat) => (
            <CategoryCard
              slug={cat.slug}
              name={cat.name}
              description={cat.description}
              count={countsBySlug[cat.slug] ?? 0}
              icon={cat.icon}
            />
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 class="font-display text-2xl mb-6 text-center">Most Recent</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {recentWithReading.map(({ article, readingMinutes }) => (
              <ArticleCard article={article} readingMinutes={readingMinutes} />
            ))}
          </div>
        </section>
      )}
    </div>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds and `dist/guides/index.html` exists.

- [ ] **Step 3: Commit**

```bash
git add src/pages/guides/index.astro
git commit -m "Add /guides/ hub page with categories and recent strip"
```

---

## Phase 2: Chrome and structural pages

Goal: Site-wide nav and footer, About/Contact/Privacy pages, home page integration.

### Task 10: Create SiteNav component

**Files:**
- Create: `src/components/SiteNav.astro`

- [ ] **Step 1: Write the component**

Copy the existing nav markup from `src/pages/index.astro:199-220` and extract it into a standalone component that adds a `Guides` and `About` link. Use this content:

```astro
---
const pathname = new URL(Astro.request.url).pathname;
const isHome = pathname === '/' || pathname === '';
---

<nav class="sticky top-0 z-50 bg-[var(--cream-flour)]/95 backdrop-blur-sm border-b border-[var(--border-light)]">
  <div class="container flex items-center justify-between py-4">
    <a href="/" class="flex items-center gap-2">
      <svg class="w-7 h-7 text-[var(--accent-gold)]" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 28V12"/>
        <path d="M16 12c-2-3-2-6 0-8 2 2 2 5 0 8z"/>
      </svg>
      <span class="font-display text-lg">The Dough Formula</span>
    </a>

    <div class="hidden md:flex items-center gap-8">
      <a href="/guides/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">Guides</a>
      <a href="/about/" class="text-sm hover:text-[var(--accent-gold)] transition-colors">About</a>
      {isHome ? (
        <a href="#calculator" class="btn btn-primary text-sm px-5 py-2">Begin Your Bake</a>
      ) : (
        <a href="/#calculator" class="btn btn-primary text-sm px-5 py-2">Begin Your Bake</a>
      )}
    </div>

    <button
      id="nav-toggle"
      class="md:hidden p-2"
      aria-label="Open navigation"
      aria-expanded="false"
      aria-controls="mobile-nav"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>

  <div id="mobile-nav" class="md:hidden hidden border-t border-[var(--border-light)] bg-[var(--cream-flour)]">
    <div class="container flex flex-col py-4 gap-4">
      <a href="/guides/" class="py-2">Guides</a>
      <a href="/about/" class="py-2">About</a>
      <a href="/contact/" class="py-2">Contact</a>
      <a href={isHome ? '#calculator' : '/#calculator'} class="btn btn-primary text-sm px-5 py-2 w-max">Begin Your Bake</a>
    </div>
  </div>
</nav>

<script is:inline>
  (() => {
    const toggle = document.getElementById('nav-toggle');
    const panel = document.getElementById('mobile-nav');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  })();
</script>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteNav.astro
git commit -m "Add SiteNav component with Guides and About links"
```

### Task 11: Create SiteFooter component

**Files:**
- Create: `src/components/SiteFooter.astro`

- [ ] **Step 1: Write the component**

```astro
---
const year = new Date().getFullYear();
---

<footer class="border-t border-[var(--border-light)] bg-[var(--cream-warm)] mt-20">
  <div class="container py-14">
    <div class="grid md:grid-cols-4 gap-10">
      <div class="md:col-span-1">
        <a href="/" class="flex items-center gap-2 mb-4">
          <svg class="w-7 h-7 text-[var(--accent-gold)]" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 28V12"/>
            <path d="M16 12c-2-3-2-6 0-8 2 2 2 5 0 8z"/>
          </svg>
          <span class="font-display text-lg">The Dough Formula</span>
        </a>
        <p class="text-sm text-[var(--crust-brown)] leading-relaxed">
          A bread calculator and guide library for home bakers who want real numbers, not guesses.
        </p>
      </div>

      <div>
        <h3 class="text-xs uppercase tracking-[0.2em] font-medium mb-4 text-[var(--accent-gold)]">Guides</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/fundamentals/" class="hover:text-[var(--accent-gold)]">Fundamentals</a></li>
          <li><a href="/techniques/" class="hover:text-[var(--accent-gold)]">Techniques</a></li>
          <li><a href="/ingredients/" class="hover:text-[var(--accent-gold)]">Ingredients</a></li>
          <li><a href="/styles/" class="hover:text-[var(--accent-gold)]">Bread Styles</a></li>
          <li><a href="/troubleshooting/" class="hover:text-[var(--accent-gold)]">Troubleshooting</a></li>
        </ul>
      </div>

      <div>
        <h3 class="text-xs uppercase tracking-[0.2em] font-medium mb-4 text-[var(--accent-gold)]">Company</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/about/" class="hover:text-[var(--accent-gold)]">About</a></li>
          <li><a href="/contact/" class="hover:text-[var(--accent-gold)]">Contact</a></li>
          <li><a href="/privacy/" class="hover:text-[var(--accent-gold)]">Privacy Policy</a></li>
        </ul>
      </div>

      <div>
        <h3 class="text-xs uppercase tracking-[0.2em] font-medium mb-4 text-[var(--accent-gold)]">Built For</h3>
        <p class="text-sm text-[var(--crust-brown)]">
          Home bakers chasing better bread, one formula at a time.
        </p>
      </div>
    </div>

    <div class="border-t border-[var(--border-light)] mt-10 pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-[var(--crust-brown)]">
      <p>&copy; {year} The Dough Formula. All rights reserved.</p>
      <p>Made for bakers who measure.</p>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteFooter.astro
git commit -m "Add SiteFooter with category and company links"
```

### Task 12: Wire SiteNav and SiteFooter into Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Import the components and render them around the slot**

Update `src/layouts/Layout.astro` so the `<body>` contents become:
```astro
---
import '../styles/global.css';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';

// (keep all existing frontmatter code)
---
```

Then replace the existing `<body>` block:
```astro
  <body class="flour-dusted min-h-screen">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--espresso)] focus:text-white focus:px-4 focus:py-2 focus:rounded-md">
      Skip to main content
    </a>
    <SiteNav />
    <slot />
    <SiteFooter />
  </body>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds. The home page will now have two navs (old inline nav in `index.astro` + new global nav). We fix that in the next task.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "Wire SiteNav and SiteFooter into root Layout"
```

### Task 13: Remove inline nav from index.astro

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Delete the inline `<nav>` block**

Find the existing `<nav class="sticky top-0 z-50 ...">` block in `src/pages/index.astro` (starts near line 199). Delete the entire `<nav>` element and its contents, leaving the following `<section>` blocks intact.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds. Home page should now have a single nav from `Layout.astro`.

- [ ] **Step 3: Manual preview check**

Run: `npm run preview` (in background if desired), open `http://localhost:4321/`, confirm:
- Only one nav visible at the top
- Logo and "Begin Your Bake" button both work
- Scrolling does not reveal a duplicate nav

Kill preview when done.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Remove inline nav from index.astro; global SiteNav handles it"
```

### Task 14: Create About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="About | The Dough Formula" description="Who we are, what The Dough Formula is, and who this site is for.">
  <main id="main-content" class="py-16">
    <article class="container prose">
      <header class="mb-10 not-prose">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">About</p>
        <h1 class="font-display text-4xl md:text-5xl leading-tight">About The Dough Formula</h1>
      </header>

      <p>
        The Dough Formula is a calculator and a guide library for people who bake bread at home and want their recipes to work. Not sometimes. Every time.
      </p>

      <p>
        Most recipes you find online are written for a specific flour, a specific kitchen, and a specific number of loaves, which is great until any of those change. Then the bread comes out different and you are not sure why. That gap between a recipe and a formula is what this site exists to close.
      </p>

      <h2>What you will find here</h2>

      <p>
        The calculator on the home page lets you scale any standard bread style to the number of loaves you want, at the weight you want, and shows you the baker's percentages behind it. You can adjust hydration, pick a preferment, set your dough temperature, and watch the recipe update.
      </p>

      <p>
        The guide library backs up the calculator with plain-language articles on the techniques, ingredients, and styles the tool uses. If you click a setting and wonder what it actually means, there is usually a guide that explains it in more depth than a tooltip could.
      </p>

      <h2>Who this site is for</h2>

      <p>
        Home bakers who want to understand what they are doing. Not professionals, not food scientists. People who are past their first loaf and want the next one to be better, and the one after that to be predictable.
      </p>

      <p>
        If you are brand new to bread, the guides in the Fundamentals category are the place to start. If you are comfortable with sourdough and want to branch out, the Styles section has you covered.
      </p>

      <h2>Who we are</h2>

      <p>
        The Dough Formula is a small project built by bakers for bakers. We are not a brand selling flour, a publisher chasing traffic, or a startup with a pivot in the works. The tool is free, the guides are free, and they will stay that way.
      </p>

      <p>
        If you spot a mistake in a formula, disagree with a recommendation, or want to suggest a topic, the <a href="/contact/">contact page</a> is the best way to reach us.
      </p>
    </article>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `dist/about/index.html` exists.

- [ ] **Step 3: Scan output for em dashes**

Run:
```bash
grep -n "—" src/pages/about.astro || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/about.astro
git commit -m "Add /about page"
```

### Task 15: Create Contact page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Contact | The Dough Formula" description="Get in touch with The Dough Formula team.">
  <main id="main-content" class="py-16">
    <article class="container prose">
      <header class="mb-10 not-prose">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">Contact</p>
        <h1 class="font-display text-4xl md:text-5xl leading-tight">Get In Touch</h1>
      </header>

      <p>
        The best way to reach us is email. Whether you have a question about a recipe, found a bug in the calculator, want to suggest a new guide, or just want to tell us how your last bake went, we read every message.
      </p>

      <p class="not-prose my-10">
        <a
          href="mailto:admin@thedoughformula.com"
          class="btn btn-primary text-lg px-8 py-4 inline-flex"
        >
          admin@thedoughformula.com
        </a>
      </p>

      <h2>What we can help with</h2>

      <p>
        We are happy to answer questions about the calculator, explain something in one of the guides, or take suggestions for topics we have not covered yet. If you tried a formula and something went sideways, tell us what you did and what happened and we will try to help you figure out where it went wrong.
      </p>

      <h2>What we cannot help with</h2>

      <p>
        We are not in a position to review commercial bakery recipes, act as a bakery consultant, or troubleshoot equipment failures for professional ovens. This site is for home bakers, and that is where our expertise is.
      </p>

      <h2>Response time</h2>

      <p>
        We read email within a couple of days and reply when we can. There is no support queue and no ticket system. If we miss your message, feel free to follow up.
      </p>
    </article>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `dist/contact/index.html` exists.

- [ ] **Step 3: Scan for em dashes**

Run:
```bash
grep -n "—" src/pages/contact.astro || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.astro
git commit -m "Add /contact page with admin email mailto link"
```

### Task 16: Create Privacy Policy page

**Files:**
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: Write the page**

```astro
---
import Layout from '../layouts/Layout.astro';

const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
---

<Layout title="Privacy Policy | The Dough Formula" description="The Dough Formula privacy policy, including information about cookies, analytics, and Google AdSense.">
  <main id="main-content" class="py-16">
    <article class="container prose">
      <header class="mb-10 not-prose">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">Legal</p>
        <h1 class="font-display text-4xl md:text-5xl leading-tight">Privacy Policy</h1>
        <p class="text-sm text-[var(--crust-brown)] mt-4">Effective date: {effectiveDate}</p>
      </header>

      <p>
        This privacy policy explains how The Dough Formula (the "site") handles information when you visit thedoughformula.com. We have tried to write it in plain language. If anything here is unclear, email us at <a href="mailto:admin@thedoughformula.com">admin@thedoughformula.com</a>.
      </p>

      <h2>Information we collect</h2>

      <p>
        The Dough Formula does not ask you to create an account, and the calculator runs entirely in your browser. We do not directly collect your name, email address, or any other personal information unless you choose to send it to us by email.
      </p>

      <p>
        We do collect anonymous usage data through the analytics and advertising providers listed below. That data is aggregate and is not tied to your identity.
      </p>

      <h2>Cookies and tracking technologies</h2>

      <p>
        Like most websites, we and our partners use cookies and similar technologies to understand how the site is used and, if ads are enabled, to serve relevant advertising.
      </p>

      <p>
        You can disable or clear cookies at any time through your browser settings. Disabling cookies may affect how some parts of the site work, but the calculator itself will continue to function.
      </p>

      <h2>Google AdSense</h2>

      <p>
        The Dough Formula uses Google AdSense to serve advertisements. Google is a third-party vendor, and as such it uses cookies, including the DoubleClick DART cookie, to serve ads based on your visits to this site and other sites on the internet.
      </p>

      <p>
        You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="noopener" target="_blank">Google Ads Settings</a>. You can also read more about how Google uses data from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">Google's partner policies page</a>.
      </p>

      <p>
        We do not control the cookies used by Google or any other third-party advertiser. Their use of cookies is governed by their own privacy policies.
      </p>

      <h2>Analytics</h2>

      <p>
        We use Cloudflare Web Analytics to measure basic, aggregate traffic such as page views, referring pages, and general geographic region. Cloudflare Web Analytics does not use cookies or fingerprint visitors, and it does not collect personally identifying information.
      </p>

      <h2>Third-party links</h2>

      <p>
        This site contains links to other websites. We are not responsible for the content or privacy practices of those sites. We recommend you review the privacy policies of any site you visit.
      </p>

      <h2>Children's privacy</h2>

      <p>
        The Dough Formula is not directed at children under the age of 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will remove it.
      </p>

      <h2>Your rights</h2>

      <p>
        Depending on where you live, you may have the right to request access to the information we hold about you, correct it, or ask us to delete it. Because we do not directly collect personal information, there is generally nothing for us to look up, but if you have a specific request, email us at <a href="mailto:admin@thedoughformula.com">admin@thedoughformula.com</a> and we will do our best to help.
      </p>

      <h2>Changes to this policy</h2>

      <p>
        We may update this policy from time to time. When we do, we will update the effective date at the top of this page. If the change is significant, we will make a clear note of it.
      </p>

      <h2>Contact</h2>

      <p>
        Questions about this policy can be sent to <a href="mailto:admin@thedoughformula.com">admin@thedoughformula.com</a>.
      </p>
    </article>
  </main>
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `dist/privacy/index.html` exists.

- [ ] **Step 3: Scan for em dashes**

Run:
```bash
grep -n "—" src/pages/privacy.astro || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/privacy.astro
git commit -m "Add /privacy policy with Google AdSense disclosure"
```

### Task 17: Add "Explore Guides" section to home page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Locate the "Understanding Baker's Percentages" section**

Grep for the `id="bakers-percent"` section in `src/pages/index.astro`. The new section will be inserted immediately after the closing `</section>` of that block.

- [ ] **Step 2: Add the section**

Insert this block immediately after the `bakers-percent` section's closing tag:

```astro
  <!-- Explore Guides Section -->
  <section class="py-16 md:py-20">
    <div class="container">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <p class="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)] font-medium mb-4">The Guide Library</p>
        <h2 class="font-display text-3xl md:text-4xl mb-4">Explore The Guides</h2>
        <p class="text-[var(--crust-brown)]">
          Articles on the techniques, ingredients, and styles behind good bread. Pick a category to dive in.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        <a href="/fundamentals/" class="card block p-6 hover:shadow-md transition-all">
          <h3 class="font-display text-xl mb-2">Fundamentals</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Percentages, hydration, fermentation, and the core ideas every baker should understand.</p>
        </a>
        <a href="/techniques/" class="card block p-6 hover:shadow-md transition-all">
          <h3 class="font-display text-xl mb-2">Techniques</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Shaping, folding, scoring, and the hands-on methods that make good bread.</p>
        </a>
        <a href="/ingredients/" class="card block p-6 hover:shadow-md transition-all">
          <h3 class="font-display text-xl mb-2">Ingredients</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Flour, salt, yeast, water. What each one does and how to choose well.</p>
        </a>
        <a href="/styles/" class="card block p-6 hover:shadow-md transition-all">
          <h3 class="font-display text-xl mb-2">Bread Styles</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Sourdough, baguettes, focaccia, ciabatta. Deep dives into classic loaves.</p>
        </a>
        <a href="/troubleshooting/" class="card block p-6 hover:shadow-md transition-all">
          <h3 class="font-display text-xl mb-2">Troubleshooting</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Diagnose gummy crumb, flat loaves, overproofed dough, and more.</p>
        </a>
        <a href="/guides/" class="card block p-6 hover:shadow-md transition-all bg-[var(--cream-warm)]">
          <h3 class="font-display text-xl mb-2">All Guides</h3>
          <p class="text-[var(--crust-brown)] text-sm leading-relaxed">Browse the full library of articles in one place.</p>
        </a>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add Explore Guides section to home page"
```

### Task 18: Phase 2 verification

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: build succeeds. Generated files for `/about/`, `/contact/`, `/privacy/`, `/guides/`, and all 5 category indexes exist.

- [ ] **Step 2: Preview smoke test**

Run `npm run preview` in the background. Manually verify in a browser:
- Home page still renders correctly with hero and calculator intact
- Global nav shows on home and all other pages
- Footer shows on every page with working links
- About, Contact, Privacy, Guides pages all render
- Category pages render empty state

Kill preview when done.

- [ ] **Step 3: Confirm no em dashes in Phase 2 pages**

Run:
```bash
grep -rn "—" src/pages src/components src/layouts || echo "clean"
```
Expected: `clean`.

---

## Phase 3: Article writing

Goal: Write all 22 articles as Markdown files.

**Cover images: explicitly deferred.** The article schema has `coverImage` as optional. None of the 22 articles created in this plan will ship with cover images. The article template already handles the absence gracefully. Cover images can be added in a follow-up pass after AdSense approval without schema changes.

**Per-article verification procedure (used by every article task below):**

After writing any article file at path `<FILE>`, every task runs these four commands in order. The task is only complete after all four succeed.

```bash
# 1. Word count (must be 1200 to 1800)
wc -w <FILE>

# 2. Em dash scan (must print "clean")
grep -n "—" <FILE> || echo "clean"

# 3. Build (must succeed)
npm run build

# 4. Commit
git add <FILE>
git commit -m "Add article: <Title>"
```

If any check fails, fix the article before proceeding. Do not skip to the next task.

**Writing guidelines (apply to every article):**

- Word count between 1200 and 1800 words
- No em dashes (`—`, `–`, or `--`). Use commas, parentheses, or two sentences.
- No banned phrases from the spec: "it's worth noting that," "in conclusion," "let's dive in," "let's explore," "in the world of," "navigate the complexities of," "harness the power of," "delve into," "unleash," "at the end of the day," "game changer," "revolutionary," "next level," "not just X but Y"
- No rule-of-three phrases ("clear, concise, and effective")
- At most one paragraph opener among "Moreover," "Furthermore," "Additionally," per article
- Open with a concrete scene or problem, not a definition
- H2 every 200 to 400 words
- At least one "common mistakes" passage per article
- End with a concrete next step or related link, not a summary
- Fahrenheit first, Celsius in parentheses
- Percentages as `70% hydration`
- Use the calculator's terms where they match (DDT, preferment, hydration, etc.)
- Cross-link to the home page calculator or to sibling guides naturally

**Frontmatter format (every article):**

```yaml
---
title: "Title Case Headline"
description: "One sentence description, 120 to 160 characters, used for meta description and article cards."
category: fundamentals
publishedDate: 2026-02-10
---
```

Publish dates should be distributed across the past 6 to 10 weeks (so between roughly 2026-02-01 and 2026-04-08), with no two articles sharing the same date.

**Verification after each article:** run `npm run build`. If the frontmatter schema or Markdown parses wrong, the build fails and you know immediately.

### Fundamentals articles

### Task 19: Write "Baker's Percentages Explained For Home Bakers"

**File:** `src/content/fundamentals/bakers-percentages-explained.md`

- [ ] **Step 1: Write the article**

Use this frontmatter:
```yaml
---
title: "Baker's Percentages Explained For Home Bakers"
description: "The universal language of bread bakers, in plain English. Learn how flour always equals 100% and why that makes every recipe scale instantly."
category: fundamentals
publishedDate: 2026-02-08
---
```

Body: 1400-1600 words covering: what a baker's percentage is (flour is always 100%, every other ingredient is a percentage of flour weight), why bakers use this format (scaling, comparing formulas at a glance, consistency across flour brands), a worked example converting a volumetric recipe to percentages, a second example scaling from 2 loaves to 5, the idea of "total dough weight" as the sum of all percentages, how hydration fits into the system, and common mistakes (forgetting to include water from starter, confusing flour percent with total percent). End with a link to the calculator and to the "Hydration In Bread Dough" guide.

- [ ] **Step 2: Verify word count**

Run:
```bash
wc -w src/content/fundamentals/bakers-percentages-explained.md
```
Expected: between 1200 and 1800 words.

- [ ] **Step 3: Verify no em dashes**

Run:
```bash
grep -n "—" src/content/fundamentals/bakers-percentages-explained.md || echo "clean"
```
Expected: `clean`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds and `dist/fundamentals/bakers-percentages-explained/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add src/content/fundamentals/bakers-percentages-explained.md
git commit -m "Add article: Baker's Percentages Explained"
```

### Task 20: Write "Hydration In Bread Dough, From 60% To 90%"

**File:** `src/content/fundamentals/hydration-60-to-90.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Hydration In Bread Dough, From 60% To 90%"
description: "What hydration actually means, how it changes dough behavior, and how to choose the right level for the bread you want to bake."
category: fundamentals
publishedDate: 2026-02-12
---
```

Body: 1300-1600 words covering the definition of hydration (water weight divided by flour weight), a walk through the practical differences at 60%, 70%, 75%, 80%, and 85% hydration (how the dough feels, what it can become, what styles land there), how flour protein affects how much water a given dough can hold, why whole grain flours change the numbers, and common mistakes (chasing high hydration before the fundamentals are solid, comparing hydration across flours without adjusting, ignoring ambient humidity). Close with links to the calculator and the "High Hydration Focaccia" guide.

- [ ] **Step 2: Word count** — `wc -w`, expect 1200-1800.
- [ ] **Step 3: Em dash scan** — `grep -n "—"`, expect clean.
- [ ] **Step 4: Build** — `npm run build`, expect success.
- [ ] **Step 5: Commit** — `git add` + `git commit -m "Add article: Hydration In Bread Dough"`.

### Task 21: Write "What Fermentation Actually Does To Dough"

**File:** `src/content/fundamentals/what-fermentation-actually-does.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "What Fermentation Actually Does To Dough"
description: "Fermentation is not just about rise. It builds flavor, develops structure, and makes bread digestible. Here is what is actually happening in your dough."
category: fundamentals
publishedDate: 2026-02-16
---
```

Body: 1300-1600 words covering: a plain-language explanation of how yeast and bacteria eat sugars and produce CO2, ethanol, and organic acids; how gluten development interacts with gas retention; the difference between bulk fermentation and final proof; how temperature affects fermentation rate (rough doubling every 10°F/5.5°C above roughly 65°F/18°C); signs a dough has fermented enough (jiggle test, volume increase, dome shape, surface bubbles); and common mistakes (relying on time rather than visual cues, proofing too warm, over-fermenting because the dough "looks the same"). End with a pointer to the calculator's DDT settings and the "Desired Dough Temperature" guide.

- [ ] **Step 2: Word count** — `wc -w`, expect 1200-1800.
- [ ] **Step 3: Em dash scan** — clean.
- [ ] **Step 4: Build** — success.
- [ ] **Step 5: Commit** — `git commit -m "Add article: What Fermentation Does To Dough"`.

### Task 22: Write "Desired Dough Temperature And Why It Matters"

**File:** `src/content/fundamentals/desired-dough-temperature.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Desired Dough Temperature And Why It Matters"
description: "DDT is the single most underrated number in bread baking. Here is what it is, how to hit it, and why it changes every other part of your bake."
category: fundamentals
publishedDate: 2026-02-22
---
```

Body: 1300-1600 words covering: what DDT is (the final temperature of your dough right after mixing), why it matters (it drives the pace of fermentation and the flavor profile), the standard formula (Water = (DDT × 3) - Room - Flour - Friction), a worked example using real numbers, the role of friction factor by mixer type, how to measure flour temperature and room temperature accurately, and common mistakes (ignoring DDT entirely, using cold water to "slow things down" without targeting a number, assuming friction factor is constant regardless of dough size). Cross-link to the calculator's DDT panel.

- [ ] **Step 2: Word count** — expect 1200-1800.
- [ ] **Step 3: Em dash scan** — clean.
- [ ] **Step 4: Build** — success.
- [ ] **Step 5: Commit** — `git commit -m "Add article: Desired Dough Temperature"`.

### Task 23: Write "Preferments 101: Poolish, Biga, And Levain Compared"

**File:** `src/content/fundamentals/preferments-101.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Preferments 101: Poolish, Biga, And Levain Compared"
description: "Why skilled bakers mix a small part of the dough hours before the rest. A practical comparison of poolish, biga, and levain."
category: fundamentals
publishedDate: 2026-02-27
---
```

Body: 1400-1700 words covering: why preferments exist (longer fermentation of a portion of the flour builds flavor and strength without rushing the final dough), poolish explained (100% hydration, commercial yeast, French origin, used in baguettes), biga (50-60% hydration, stiff, Italian, used in ciabatta and focaccia), levain (natural starter build, sourdough), timing and temperature targets for each, when to choose which, how preferments affect final dough hydration math (and a nod to the calculator handling it), and common mistakes (using a cold poolish, pushing a levain past peak, confusing total dough hydration with final dough hydration when a preferment is involved). Link to calculator's preferment panel.

- [ ] **Step 2: Word count** — expect 1200-1800.
- [ ] **Step 3: Em dash scan** — clean.
- [ ] **Step 4: Build** — success.
- [ ] **Step 5: Commit** — `git commit -m "Add article: Preferments 101"`.

### Techniques articles

### Task 24: Write "How To Do An Autolyse (And When To Skip It)"

**File:** `src/content/techniques/autolyse-step-by-step.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "How To Do An Autolyse (And When To Skip It)"
description: "Autolyse is a simple rest that transforms the dough. Here is how to do one, how long to wait, and when it is not worth the trouble."
category: techniques
publishedDate: 2026-03-02
---
```

Body: 1300-1600 words covering: what autolyse is (mixing flour and water and letting it rest before adding salt and yeast or starter), what it does (hydrates the flour, develops gluten passively, improves extensibility), how long (30 minutes is the typical sweet spot, up to a couple hours for higher-protein flours), how to do it step by step, how it changes the feel of the dough when you come back to it, when to skip (very wet doughs, very stiff doughs, doughs with a high preferment percentage that already has fermentation running), common mistakes (adding salt or starter at the start of autolyse, autolysing for too long and losing extensibility, expecting autolyse to fix a weak flour). End with pointer to the calculator's autolyse toggle.

- [ ] **Step 2: Word count** — expect 1200-1800.
- [ ] **Step 3: Em dash scan** — clean.
- [ ] **Step 4: Build** — success.
- [ ] **Step 5: Commit** — `git commit -m "Add article: How To Do An Autolyse"`.

### Task 25: Write "Stretch And Folds Versus Coil Folds"

**File:** `src/content/techniques/stretch-folds-vs-coil-folds.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Stretch And Folds Versus Coil Folds"
description: "Two gentle ways to build strength in bread dough without kneading. Which one to use depends on how wet your dough is."
category: techniques
publishedDate: 2026-03-05
---
```

Body: 1300-1600 words covering: why we fold dough during bulk (build gluten network while preserving gas), stretch and folds step by step (reach under the dough, stretch up, fold over, rotate and repeat), coil folds step by step (lift from the middle, let the ends tuck under, rotate bowl), when to use each (stretch for moderate hydration, coil for high hydration where sticky dough rips during a classic stretch), how often and for how long (every 30 minutes for the first 2 hours, four to six total), and common mistakes (folding too late in bulk, being too aggressive with a slack dough, forgetting to wet your hand). End with a link to the shaping guide.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 26: Write "Shaping A Round Boule That Holds Its Form"

**File:** `src/content/techniques/shaping-a-boule.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Shaping A Round Boule That Holds Its Form"
description: "A boule that rises up instead of spreading out comes from a specific sequence of folds and tension building. Here is the whole process."
category: techniques
publishedDate: 2026-03-08
---
```

Body: 1300-1600 words covering: preshape vs final shape, bench rest, the importance of surface tension, a step-by-step walkthrough of the letter fold and the stitch method, how to know the dough is ready for the banneton (skin smooths, bottom closes), how to move it seam-down, and common mistakes (over-flouring the surface so tension cannot form, squeezing instead of pulling, skipping bench rest, shaping a dough that is under-fermented). Link to the country loaf guide and the preferment guide.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 27: Write "Scoring Sourdough: Patterns And Blade Angles"

**File:** `src/content/techniques/scoring-sourdough.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Scoring Sourdough: Patterns And Blade Angles"
description: "Scoring is not decoration. It controls how the loaf opens in the oven. Here is the blade angle, the depth, and the patterns that work."
category: techniques
publishedDate: 2026-03-12
---
```

Body: 1300-1600 words covering: why we score (control where the loaf expands instead of tearing randomly), blade types (razor on a stick, lame, kitchen knife as fallback), blade angle (steep for ears, shallow for patterns, straight down for bakery-grade basic cuts), depth (quarter inch is a useful default), a few patterns explained (single slash, cross, wheat stalk, simple geometric), scoring cold dough vs room-temperature, and common mistakes (scoring too shallow, scoring a dough that is already torn from mishandling, scoring through a heavy rice flour layer that kills expansion). Link to beginner sourdough.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 28: Write "The Windowpane Test: Reading Gluten Development"

**File:** `src/content/techniques/windowpane-test.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "The Windowpane Test: Reading Gluten Development"
description: "The single most reliable test for whether your dough has enough gluten. What to look for and how to interpret what you see."
category: techniques
publishedDate: 2026-03-15
---
```

Body: 1300-1600 words covering: what the test is (pulling a small piece of dough thin enough to see light through it without tearing), how to do it step by step, what a passing windowpane looks like for different hydration levels, what a failing windowpane tells you (more folds, longer rest, stronger flour), the role of fermentation in the result, and common mistakes (testing too early, testing with flour-coated hands, expecting a see-through pane on a very low protein flour). Link to stretch and folds and the hydration guide.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Ingredients articles

### Task 29: Write "Bread Flour Versus All Purpose: What Actually Changes"

**File:** `src/content/ingredients/bread-flour-vs-all-purpose.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Bread Flour Versus All Purpose: What Actually Changes"
description: "Protein content is the headline number, but it is not the whole story. Here is how bread flour and all purpose flour actually behave differently."
category: ingredients
publishedDate: 2026-03-18
---
```

Body: 1300-1600 words covering: the protein spread (10-11% for AP, 12-13% for bread flour in the US), how that protein turns into gluten and changes dough behavior (stronger structure, higher possible hydration, more oven spring), when to reach for bread flour and when AP is fine, why milling and ash content also matter (not just protein), and common mistakes (assuming all 12% flours are equivalent across brands, using AP for high-hydration doughs and then blaming the recipe, adding vital wheat gluten as a fix without understanding what it changes). Link to the hydration guide and the whole grain guide.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 30: Write "Working Whole Grain Flours Into Your Dough"

**File:** `src/content/ingredients/working-with-whole-grains.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Working Whole Grain Flours Into Your Dough"
description: "Whole grain flour soaks up more water, ferments faster, and cuts gluten. Here is how to balance it without wrecking the loaf."
category: ingredients
publishedDate: 2026-03-21
---
```

Body: 1300-1600 words covering: why whole grain flours behave differently (bran absorbs water, germ contains enzymes, sharper particles cut gluten), how to adjust hydration upward when adding whole wheat, rye, or spelt, how fermentation speeds up and what to do about it (cooler DDT, shorter bulk), practical percentages to start with (10%, 25%, 50%, 100% whole wheat), and common mistakes (keeping hydration constant when adding whole grain, skipping the soak, ignoring that whole grain flour ages faster and can taste rancid). Link to hydration and fermentation guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 31: Write "The Role Of Salt In Bread (It's More Than Flavor)"

**File:** `src/content/ingredients/role-of-salt-in-bread.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "The Role Of Salt In Bread (It's More Than Flavor)"
description: "Salt seasons the loaf, but it also controls fermentation speed, tightens gluten, and changes the crust. Here is what it is actually doing."
category: ingredients
publishedDate: 2026-03-24
---
```

Body: 1300-1600 words covering: baker's percentage for salt (usually 1.8% to 2.2%), how salt slows fermentation by restricting yeast activity, how it tightens gluten networks, how it affects crust color, flavor balance at different percentages, why bread without salt tastes and looks wrong, and common mistakes (salting at different times without knowing why, using table salt and fine sea salt interchangeably by volume, forgetting to account for salt when using very low fermentation times). Mention the calculator's salt percentage field.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 32: Write "Instant, Active Dry, Or Fresh Yeast: A Practical Guide"

**File:** `src/content/ingredients/yeast-types-compared.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Instant, Active Dry, Or Fresh Yeast: A Practical Guide"
description: "Three forms of the same organism, all good at the same job. Here is how they differ and how to swap between them without guessing."
category: ingredients
publishedDate: 2026-03-27
---
```

Body: 1300-1600 words covering: each yeast form (instant dry yeast, active dry yeast, fresh/cake yeast), conversion ratios between them, whether to bloom or not, storage differences, flavor implications (minimal in most cases), and common mistakes (blooming instant yeast unnecessarily, using expired active dry, storing fresh yeast poorly). Link to fermentation and DDT guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Styles articles

### Task 33: Write "A Beginner's Guide To Sourdough"

**File:** `src/content/styles/sourdough-for-beginners.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "A Beginner's Guide To Sourdough"
description: "Starter, schedule, and a simple country loaf to learn on. The shortest path from no experience to a good sourdough boule."
category: styles
publishedDate: 2026-02-10
---
```

Body: 1500-1800 words covering: what a sourdough starter is and why, building one (short version, with a pointer to dedicated starter resources), a simple 75% hydration country loaf formula in baker's percentages, a realistic schedule for a weekend bake, expected signs at each step, and common mistakes (using a starter that is not yet active, skipping bulk fermentation signs, proofing in a banneton that is too warm). Link to baker's percentages, hydration, shaping, and scoring guides.

- [ ] **Step 2-5:** Word count (1200-1800), em dash scan, build, commit.

### Task 34: Write "Baking A Classic French Baguette At Home"

**File:** `src/content/styles/classic-french-baguette.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Baking A Classic French Baguette At Home"
description: "The home version of a French baguette is not a compromise if you know what to focus on. A simple poolish formula and a shaping walkthrough."
category: styles
publishedDate: 2026-02-18
---
```

Body: 1400-1700 words covering: what makes a classic baguette (crisp crust, open but not sourdough-wild crumb, subtle sweetness), a poolish-based formula at roughly 70% hydration in baker's percentages, a schedule, shaping the baguette (cylinder to baton to baguette), scoring at the right angle, steam in a home oven (skillet with boiling water, ice on a preheated pan, or lava rocks), and common mistakes (over-flouring the couche, over-proofing before the oven, skipping steam). Link to poolish and scoring guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 35: Write "High Hydration Focaccia, Step By Step"

**File:** `src/content/styles/high-hydration-focaccia.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "High Hydration Focaccia, Step By Step"
description: "Focaccia at 80% hydration is the most forgiving bread you can bake. Here is a no-knead schedule and the shaping that makes it rise."
category: styles
publishedDate: 2026-03-01
---
```

Body: 1400-1700 words covering: why focaccia is beginner friendly (pan support, high hydration forgiveness, short active time), a simple 80% hydration formula, a same-day or cold-retard schedule, stretching into the pan without deflating, dimpling with oil-coated fingers, toppings and salt, and common mistakes (under-fermenting, skipping final proof in the pan, oiling the pan too lightly so the crust does not fry, baking at too low a temperature). Link to hydration guide.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 36: Write "Ciabatta: The Dough That Shouldn't Work, But Does"

**File:** `src/content/styles/ciabatta-explained.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Ciabatta: The Dough That Shouldn't Work, But Does"
description: "Ciabatta dough is wetter than seems reasonable. A biga, a slow fermentation, and a specific set of folds turn it into an open, airy loaf."
category: styles
publishedDate: 2026-03-10
---
```

Body: 1400-1700 words covering: the defining features of ciabatta (high hydration, biga base, minimal handling), a 80% to 82% hydration formula with a biga at 20% of total flour, coil folds during bulk, wet-hand handling, dividing and shaping with a bench knife, how the loaf looks wrong until the oven transforms it, and common mistakes (adding flour on the bench out of panic, under-fermenting the biga, not preheating the stone long enough). Link to biga and coil fold guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 37: Write "The Country Loaf (Pain De Campagne)"

**File:** `src/content/styles/country-loaf-pain-de-campagne.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "The Country Loaf (Pain De Campagne)"
description: "A rustic mix of bread flour, whole wheat, and rye, leavened with a levain. The classic French country loaf as a home baker can make it."
category: styles
publishedDate: 2026-03-22
---
```

Body: 1400-1700 words covering: what defines a pain de campagne (blended flours, natural leavening, deep flavor, open crumb), a typical formula (80% bread flour, 15% whole wheat, 5% rye, 78% hydration, 20% levain, 2% salt), a schedule with cold retard, shaping and scoring, and common mistakes (skipping rye because it seems minor, proofing too warm and losing acidity balance, scoring too timid so the loaf tears along the seam). Link to shaping, scoring, whole grain guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Troubleshooting articles

### Task 38: Write "Why Your Crumb Is Gummy (And How To Fix It)"

**File:** `src/content/troubleshooting/gummy-crumb-explained.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Why Your Crumb Is Gummy (And How To Fix It)"
description: "Gummy crumb almost always traces back to one of four causes. Here is how to diagnose yours and the specific fix for each."
category: troubleshooting
publishedDate: 2026-03-30
---
```

Body: 1300-1600 words covering: the four main causes of gummy crumb (underbaked, cut too early, under-fermented, too much rye or whole grain for the hydration), how to tell them apart (internal temperature, time since bake, how the dough looked at shaping, recipe ratio), specific fix for each, and common mistakes (blaming the oven instead of the fermentation, increasing bake time when the real problem is under-proof). Link to fermentation and hydration guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 39: Write "Flat Loaves: Diagnosing The Five Most Common Causes"

**File:** `src/content/troubleshooting/flat-loaves-five-causes.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Flat Loaves: Diagnosing The Five Most Common Causes"
description: "Five reasons loaves come out of the oven wide and low, with a diagnostic question for each so you can tell which one is yours."
category: troubleshooting
publishedDate: 2026-04-02
---
```

Body: 1300-1600 words covering: the five causes (overproofing, weak gluten development, shaping without tension, weak starter, oven not hot enough), a diagnostic question for each, specific fix for each, and common mistakes (fixing the wrong thing because you guessed, adding more flour to a wet dough instead of building tension). Link to shaping, fermentation, and scoring guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

### Task 40: Write "Reading An Overproofed Dough Before It's Too Late"

**File:** `src/content/troubleshooting/reading-overproofed-dough.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```yaml
---
title: "Reading An Overproofed Dough Before It's Too Late"
description: "Once a dough is overproofed, options narrow fast. Here are the warning signs to catch it early, and how to save it if you catch it at the edge."
category: troubleshooting
publishedDate: 2026-04-06
---
```

Body: 1300-1600 words covering: visual and tactile signs of approaching overproof (loss of dome, skin loses tension, poke test springs back very slowly or not at all, bubbles on the surface flatten), the physical and chemical reasons it happens (gluten structure breaks down after peak fermentation), what to do if caught early (bake sooner, reshape with minimal handling, score shallow), what to do if caught late (accept a denser loaf, scale back next bake), and common mistakes (confusing overproof with underproof because both can deflate on score, relying on a timer instead of the dough). Link to fermentation and DDT guides.

- [ ] **Step 2:** Run the per-article verification procedure from the Phase 3 header with `<FILE>` set to this task's file path. All four commands must succeed before moving on.

---

## Phase 4: Polish and verify

### Task 41: Full site verification

- [ ] **Step 1: Run full build**

Run:
```bash
npm run build
```
Expected: build succeeds with no errors or warnings. Output should include:
- `dist/index.html`
- `dist/about/index.html`
- `dist/contact/index.html`
- `dist/privacy/index.html`
- `dist/guides/index.html`
- `dist/fundamentals/index.html` through `dist/troubleshooting/index.html`
- 22 individual article HTML files under the category directories
- `dist/sitemap-0.xml` containing all new routes

- [ ] **Step 2: Verify sitemap includes new routes**

Run:
```bash
grep -c "<loc>" dist/sitemap-0.xml
```
Expected: at least 32 URLs (home + 5 category indexes + guides hub + about + contact + privacy + 22 articles = 32 minimum).

- [ ] **Step 3: Verify AdSense script still loads in built HTML**

Run:
```bash
grep "pagead2.googlesyndication" dist/index.html dist/about/index.html dist/privacy/index.html
```
Expected: the AdSense script tag appears in all three. If it is missing from any, the Layout slot wiring is off and must be fixed before shipping.

- [ ] **Step 4: Site-wide em dash scan**

Run:
```bash
grep -rn "—" src/content src/pages src/layouts src/components || echo "clean"
```
Expected: `clean`.

- [ ] **Step 5: Site-wide banned phrase scan**

Run (one line, pipes to grep -v for case-insensitive):
```bash
grep -rniE "it's worth noting|in conclusion|let's dive in|let's explore|in the world of|navigate the complexities|harness the power|delve into|unleash|at the end of the day|game changer|not just .* but" src/content src/pages || echo "clean"
```
Expected: `clean`.

- [ ] **Step 6: Preview smoke test**

Start `npm run preview` in the background. Open in a browser:
- `http://localhost:4321/` — hero + calculator unchanged, new "Explore Guides" section visible, footer present
- `http://localhost:4321/guides/` — hub page with category grid and recent articles
- `http://localhost:4321/fundamentals/` — 5 articles listed
- `http://localhost:4321/fundamentals/bakers-percentages-explained/` — article renders, breadcrumb works, related strip shows 3 sibling articles
- `http://localhost:4321/about/`, `/contact/`, `/privacy/` — all render correctly
- Footer on every page contains working `/privacy/` link

Kill preview when done.

- [ ] **Step 7: Final commit**

If any verification step required fixes, commit them with:
```bash
git add -A
git commit -m "Polish and verify content buildout"
```

- [ ] **Step 8: Push to main**

```bash
git push origin main
```

Expected: Cloudflare Pages picks up the new commit and deploys. After a few minutes, the live site should show all new content. Verify `https://thedoughformula.com/privacy/` is reachable before submitting to AdSense.

### Task 42: Submit to AdSense (manual step)

This is a manual step the user performs outside of code.

- [ ] Verify the site is live with the content changes
- [ ] Log into AdSense, submit the site for review
- [ ] Wait for approval (typically 1 to 14 days)
