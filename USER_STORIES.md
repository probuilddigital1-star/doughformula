# The Dough Formula — User Stories

## Epic 1: Core Calculator Experience

### US-1.1: Bread Style Selection
**As a** home baker
**I want to** select from preset bread styles (Sourdough, Baguette, Focaccia, etc.)
**So that** I get optimized hydration, flour, and timing recommendations for my chosen bread type

**Acceptance Criteria:**
- [ ] 7 bread style cards displayed (Sourdough, Baguette, Focaccia, Sandwich, Ciabatta, Enriched, Custom)
- [ ] Each card shows icon, name, brief description
- [ ] Selected card has gold border and subtle glow
- [ ] Selecting a style updates recipe card instantly
- [ ] Custom option allows manual percentage entry

---

### US-1.2: Dough Quantity Configuration
**As a** home baker
**I want to** specify number of loaves and weight per loaf
**So that** I get exact ingredient measurements for my batch size

**Acceptance Criteria:**
- [ ] Number input for loaves (1-12 range)
- [ ] Number input for weight per loaf (in grams)
- [ ] Increment/decrement buttons on inputs
- [ ] Total dough weight calculated and displayed
- [ ] Quick preset buttons: 1 loaf, 2 loaves, 4 loaves
- [ ] Recipe updates in real-time as values change

---

### US-1.3: Recipe Card Display
**As a** home baker
**I want to** see my complete recipe with ingredients and instructions
**So that** I can follow along while baking

**Acceptance Criteria:**
- [ ] Recipe card shows bread style name and yield
- [ ] Ingredients listed with weight (g) and baker's percentage
- [ ] Tips section shows water temperature and flour recommendation
- [ ] Step-by-step instructions numbered clearly
- [ ] Torn parchment visual styling
- [ ] Unit toggle: grams/ounces

---

### US-1.4: Recipe Actions (Print/Share/Copy)
**As a** home baker
**I want to** print, share, or copy my recipe
**So that** I can reference it while baking or share with friends

**Acceptance Criteria:**
- [ ] Print button opens print-optimized view
- [ ] Share button copies shareable URL with recipe parameters
- [ ] Copy button copies recipe text to clipboard
- [ ] Toast notification confirms action success
- [ ] Shareable URL reconstructs exact recipe when visited

---

### US-1.5: Advanced Options
**As an** experienced baker
**I want to** fine-tune hydration, whole grain %, salt %, and yeast type
**So that** I can customize recipes to my preferences

**Acceptance Criteria:**
- [ ] Collapsible "Advanced Options" accordion
- [ ] Hydration slider (65-85%)
- [ ] Whole grain percentage slider (0-50%)
- [ ] Salt percentage input (1.8-2.5%)
- [ ] Yeast type selector (Sourdough starter / Instant / Fresh)
- [ ] Changes reflect immediately in recipe card

---

## Epic 2: Content Pages

### US-2.1: Bread Styles Guide
**As a** beginner baker
**I want to** learn about different bread types and their characteristics
**So that** I can choose the right style for my skill level and taste

**Acceptance Criteria:**
- [ ] Individual sections for each bread style
- [ ] Key specs: hydration, flour type, fermentation time, bake temp
- [ ] Recommended flour brands
- [ ] Pro tips for each style
- [ ] "Calculate This Style" CTA linking to calculator with preset

---

### US-2.2: Baker's Percentages Education
**As a** new baker
**I want to** understand what baker's percentages are and why they matter
**So that** I can scale recipes confidently and troubleshoot issues

**Acceptance Criteria:**
- [ ] Clear explanation of baker's math concept
- [ ] Visual examples showing percentage calculations
- [ ] Benefits of using percentages over volume measurements
- [ ] Common percentage ranges for different bread types
- [ ] Link to calculator for hands-on practice

---

### US-2.3: FAQ Section
**As a** home baker
**I want to** find answers to common bread baking questions
**So that** I can troubleshoot problems and improve my technique

**Acceptance Criteria:**
- [ ] Accordion-style expandable questions
- [ ] 12+ frequently asked questions covered
- [ ] Clear, concise answers
- [ ] Links to relevant calculator features or guide sections

---

## Epic 3: SEO Optimization

### US-3.1: Technical SEO Foundation
**As the** site owner
**I want** proper technical SEO implementation
**So that** the site ranks well in search engines and attracts organic traffic

**Acceptance Criteria:**
- [ ] Semantic HTML5 structure (header, main, section, article, footer)
- [ ] Unique, descriptive title tags per page (<60 chars)
- [ ] Meta descriptions per page (150-160 chars)
- [ ] Canonical URLs implemented
- [ ] XML sitemap generated
- [ ] robots.txt configured
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card meta tags
- [ ] Structured data (JSON-LD) for Recipe schema

---

### US-3.2: Content SEO
**As the** site owner
**I want** SEO-optimized content structure
**So that** pages rank for target keywords

**Acceptance Criteria:**
- [ ] H1 tag on every page (one per page)
- [ ] Logical heading hierarchy (H1 → H2 → H3)
- [ ] Target keywords in headings and first paragraph
- [ ] Alt text on all images
- [ ] Internal linking between related content
- [ ] Breadcrumb navigation with schema markup

**Target Keywords:**
- "bread calculator"
- "baker's percentage calculator"
- "sourdough recipe calculator"
- "bread hydration calculator"
- "baguette dough recipe"
- "focaccia baker's percentage"

---

### US-3.3: Performance SEO
**As the** site owner
**I want** fast page load speeds
**So that** Core Web Vitals pass and rankings aren't penalized

**Acceptance Criteria:**
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Images optimized (WebP format, lazy loading)
- [ ] CSS/JS minified
- [ ] Fonts preloaded with display:swap

---

## Epic 4: Monetization (Amazon Affiliates)

### US-4.1: Equipment Recommendations Section
**As a** home baker
**I want to** see recommended baking equipment
**So that** I can purchase quality tools to improve my bread

**Acceptance Criteria:**
- [ ] "Essential Bread Equipment" section on homepage
- [ ] 6 product cards: Dutch Oven, Scale, Bench Scraper, Banneton, Lame, Thermometer
- [ ] Each card shows: product name, price range, brief description
- [ ] "View on Amazon →" link with affiliate tag
- [ ] Cards styled consistently with site design (not intrusive)

---

### US-4.2: Contextual Product Links
**As the** site owner
**I want** contextual affiliate links within content
**So that** recommendations feel natural and drive conversions

**Acceptance Criteria:**
- [ ] Flour recommendations link to Amazon (e.g., King Arthur, Caputo)
- [ ] Recipe card "Recommended flour" links to product
- [ ] Bread Styles guide includes relevant equipment links
- [ ] Links open in new tab with rel="noopener sponsored"
- [ ] Affiliate disclosure clearly visible

---

### US-4.3: Affiliate Disclosure
**As the** site owner
**I want** proper FTC-compliant affiliate disclosure
**So that** the site meets legal requirements

**Acceptance Criteria:**
- [ ] Disclosure statement in footer: "We may earn commission from purchases"
- [ ] Dedicated /affiliate-disclosure page with full policy
- [ ] Disclosure near equipment section
- [ ] Links marked with rel="sponsored"

---

## Epic 5: Newsletter & Lead Generation

### US-5.1: Primary Newsletter CTA
**As a** home baker
**I want to** subscribe to bread baking tips
**So that** I can improve my skills over time

**Acceptance Criteria:**
- [ ] Newsletter section with dark background (visual contrast)
- [ ] Headline: "Level Up Your [Style] Game" (dynamic based on selected bread)
- [ ] Subheadline describing value: "weekly tips, troubleshooting guides, pro techniques"
- [ ] Email input field with placeholder
- [ ] "Subscribe" / "Get Tips" CTA button in gold
- [ ] Checkbox: "I agree to receive bread tips and updates"
- [ ] Privacy policy link
- [ ] "No spam, ever. Unsubscribe anytime." reassurance text

---

### US-5.2: Inline Newsletter CTAs
**As the** site owner
**I want** newsletter prompts at multiple touchpoints
**So that** conversion opportunities are maximized

**Acceptance Criteria:**
- [ ] CTA after recipe card: "Get tips for perfect [bread style]"
- [ ] CTA in Bread Styles guide sidebar
- [ ] CTA in footer (compact version)
- [ ] Exit-intent popup (desktop only, shows once per session)
- [ ] CTAs don't stack or feel spammy

---

### US-5.3: Newsletter Form Functionality
**As the** site owner
**I want** newsletter signups captured and stored
**So that** I can build an email list

**Acceptance Criteria:**
- [ ] Form validates email format before submit
- [ ] Loading state on submit button
- [ ] Success message: "You're in! Check your inbox."
- [ ] Error handling for failed submissions
- [ ] Integration ready for email service (Mailchimp, ConvertKit, etc.)
- [ ] Honeypot field for spam prevention

---

## Epic 6: Mobile Responsiveness

### US-6.1: Mobile Layout Adaptation
**As a** mobile user
**I want** the site to work perfectly on my phone
**So that** I can use the calculator while baking in my kitchen

**Acceptance Criteria:**
- [ ] Single-column layout on mobile (<640px)
- [ ] Touch-friendly tap targets (min 44x44px)
- [ ] No horizontal scrolling
- [ ] Text readable without zooming (min 16px body)
- [ ] Calculator inputs easy to use on touch screens

---

### US-6.2: Mobile Navigation
**As a** mobile user
**I want** easy navigation on small screens
**So that** I can access all site sections

**Acceptance Criteria:**
- [ ] Hamburger menu icon on mobile
- [ ] Full-screen mobile menu overlay
- [ ] Menu items large and tappable
- [ ] Current page indicated in menu
- [ ] Menu closes on item selection or outside tap

---

### US-6.3: Mobile Calculator Experience
**As a** mobile user
**I want** the calculator optimized for touch
**So that** I can easily select styles and adjust quantities

**Acceptance Criteria:**
- [ ] Bread style cards stack vertically (2 per row or single column)
- [ ] Recipe card full-width below style selection
- [ ] Number inputs use numeric keyboard on mobile
- [ ] Increment/decrement buttons large enough for touch
- [ ] Action buttons (Print/Share/Copy) full-width on mobile

---

### US-6.4: Mobile Recipe Card
**As a** mobile user
**I want** the recipe card optimized for kitchen use
**So that** I can follow along with floury hands

**Acceptance Criteria:**
- [ ] Large, readable text
- [ ] High contrast for visibility
- [ ] Instructions spaced for easy scanning
- [ ] Sticky "Copy Recipe" button for quick access
- [ ] Screen stays awake while viewing recipe (optional PWA feature)

---

## Epic 7: Performance & Lighthouse

### US-7.1: Lighthouse Performance Score (95+)
**As the** site owner
**I want** a Lighthouse performance score of 95+
**So that** the site loads fast and ranks well

**Acceptance Criteria:**
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Total Blocking Time (TBT) < 200ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Speed Index < 3.5s

**Implementation:**
- [ ] Static site generation (Astro)
- [ ] Minimal JavaScript (vanilla, no heavy frameworks)
- [ ] Font subsetting and preloading
- [ ] Image optimization (WebP, srcset, lazy loading)
- [ ] CSS inlined for critical path
- [ ] Deferred non-critical resources

---

### US-7.2: Lighthouse Accessibility Score (95+)
**As a** user with disabilities
**I want** the site to be fully accessible
**So that** I can use it with assistive technologies

**Acceptance Criteria:**
- [ ] Color contrast ratios meet WCAG AA (4.5:1 for text)
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible and clear
- [ ] ARIA labels on icon-only buttons
- [ ] Form inputs have associated labels
- [ ] Skip to main content link
- [ ] Alt text on images
- [ ] No auto-playing media

---

### US-7.3: Lighthouse Best Practices Score (95+)
**As the** site owner
**I want** to follow web best practices
**So that** the site is secure and modern

**Acceptance Criteria:**
- [ ] HTTPS enforced
- [ ] No browser console errors
- [ ] No deprecated APIs used
- [ ] Correct image aspect ratios (no distortion)
- [ ] Links have descriptive text (no "click here")
- [ ] External links have rel="noopener"

---

### US-7.4: Lighthouse SEO Score (100)
**As the** site owner
**I want** perfect Lighthouse SEO score
**So that** technical SEO is verified

**Acceptance Criteria:**
- [ ] Document has <title>
- [ ] Document has meta description
- [ ] Page has successful HTTP status code
- [ ] Links are crawlable
- [ ] Page isn't blocked from indexing
- [ ] Image elements have alt attributes
- [ ] Document has valid hreflang (if multilingual)
- [ ] Document has valid canonical
- [ ] Document uses legible font sizes
- [ ] Tap targets sized appropriately

---

## Epic 8: Design System & Polish

### US-8.1: Visual Consistency
**As a** user
**I want** a cohesive, polished visual experience
**So that** the site feels professional and trustworthy

**Acceptance Criteria:**
- [ ] CSS variables for all colors, fonts, spacing
- [ ] Consistent border radius across components
- [ ] Consistent shadow styles
- [ ] Consistent button styles (primary, secondary, ghost)
- [ ] Flour dust texture applied consistently
- [ ] Scoring mark dividers used between sections

---

### US-8.2: Animation & Micro-interactions
**As a** user
**I want** subtle, delightful animations
**So that** the site feels alive and responsive

**Acceptance Criteria:**
- [ ] Page load: staggered fade-in "rise" animation
- [ ] Button hover: golden glow effect
- [ ] Card hover: subtle lift with shadow
- [ ] Card selection: border and glow transition
- [ ] Accordion: smooth expand/collapse
- [ ] Toast notifications: slide in/out
- [ ] All animations respect prefers-reduced-motion

---

### US-8.3: Print Stylesheet
**As a** home baker
**I want** to print a clean recipe
**So that** I have a physical copy in my kitchen

**Acceptance Criteria:**
- [ ] Print view shows only recipe card content
- [ ] Navigation, footer, CTAs hidden in print
- [ ] Black and white optimized
- [ ] Page breaks handled properly
- [ ] Recipe fits on single page when possible
- [ ] Print button triggers native print dialog

---

## Priority Matrix

| Priority | Epic | Stories |
|----------|------|---------|
| P0 - MVP | Core Calculator | US-1.1 through US-1.4 |
| P0 - MVP | Mobile | US-6.1 through US-6.4 |
| P0 - MVP | Performance | US-7.1 |
| P1 - Launch | SEO | US-3.1 through US-3.3 |
| P1 - Launch | Newsletter | US-5.1, US-5.3 |
| P1 - Launch | Monetization | US-4.1, US-4.3 |
| P1 - Launch | Accessibility | US-7.2 |
| P2 - Enhance | Content | US-2.1 through US-2.3 |
| P2 - Enhance | Advanced Calc | US-1.5 |
| P2 - Enhance | Newsletter | US-5.2 |
| P2 - Enhance | Monetization | US-4.2 |
| P3 - Polish | Design | US-8.1 through US-8.3 |
| P3 - Polish | Best Practices | US-7.3, US-7.4 |

---

---

## Epic 9: Yeast Type Selection

### US-9.1: Yeast Type Selector
**As a** home baker
**I want to** select my preferred yeast type (instant, active dry, fresh, or sourdough starter)
**So that** I get accurate yeast quantities for my chosen leavening method

**Acceptance Criteria:**
- [ ] Yeast type dropdown/segmented control in Advanced Options
- [ ] Options: Instant Yeast, Active Dry Yeast, Fresh Yeast Cake, Sourdough Starter
- [ ] Default selection based on bread style (Sourdough → Starter, others → Instant)
- [ ] Recipe card updates yeast quantity based on selection
- [ ] Visual icon for each yeast type

**Baker's Conversion Ratios:**
- Instant Yeast (baseline): 1.0%
- Active Dry Yeast: 1.25× instant (needs hydration)
- Fresh Yeast: 3× instant
- Sourdough Starter: 20-30% (replaces commercial yeast)

---

### US-9.2: Yeast Usage Tips
**As a** baker new to different yeast types
**I want to** see guidance on how to use my selected yeast
**So that** I don't make mistakes in preparation

**Acceptance Criteria:**
- [ ] Contextual tip appears when yeast type selected
- [ ] Instant: "Add directly to flour"
- [ ] Active Dry: "Bloom in warm water (38°C/100°F) for 5-10 min before mixing"
- [ ] Fresh: "Crumble into flour or dissolve in water"
- [ ] Starter: "Feed starter 4-8 hours before use; use at peak activity"
- [ ] Tips styled consistently with recipe card Tips section

---

### US-9.3: Starter Hydration Input
**As a** sourdough baker
**I want to** specify my starter's hydration level
**So that** the calculator correctly adjusts flour and water in my recipe

**Acceptance Criteria:**
- [ ] Starter hydration input appears when "Sourdough Starter" selected
- [ ] Default: 100% hydration (equal flour:water)
- [ ] Range: 50-200% (common range for stiff to liquid starters)
- [ ] Recipe automatically subtracts starter's flour/water from totals
- [ ] Calculation formula displayed: "Your starter contributes Xg flour and Yg water"

**Calculation:**
```
Starter flour = Starter weight / (1 + hydration%)
Starter water = Starter weight - Starter flour
```

---

## Epic 10: Temperature Modeling

### US-10.1: Desired Dough Temperature (DDT)
**As an** experienced baker
**I want to** set my desired dough temperature
**So that** fermentation proceeds at a predictable pace

**Acceptance Criteria:**
- [ ] DDT input in Advanced Options (default: 24°C / 75°F)
- [ ] Range: 20-30°C (68-86°F)
- [ ] Unit toggle: Celsius / Fahrenheit
- [ ] Slider with numeric input for precision
- [ ] Explanation tooltip: "Target temperature for dough after mixing"

**Recommended DDT by Bread Style:**
- Baguettes: 23-24°C (73-75°F)
- Sourdough: 24-26°C (75-79°F)
- Enriched: 24-25°C (75-77°F)
- Focaccia: 25-27°C (77-81°F)

---

### US-10.2: Room Temperature Input
**As a** home baker
**I want to** input my kitchen's current temperature
**So that** water temperature is calculated correctly

**Acceptance Criteria:**
- [ ] Room temperature input field
- [ ] Default: 21°C (70°F)
- [ ] Placeholder text: "Enter your kitchen temp"
- [ ] Auto-detect option (uses device if available, with permission)
- [ ] Unit synced with DDT unit selection

---

### US-10.3: Flour Temperature Input
**As a** precision baker
**I want to** input my flour temperature
**So that** water temp calculation is more accurate

**Acceptance Criteria:**
- [ ] Flour temperature input (optional, collapses by default)
- [ ] Default: Same as room temperature
- [ ] Note: "If stored in cool area, flour may be 2-3°C cooler"
- [ ] Advanced users can override

---

### US-10.4: Water Temperature Calculation
**As a** baker
**I want** the calculator to tell me what temperature water to use
**So that** I achieve my desired dough temperature

**Acceptance Criteria:**
- [ ] Calculated water temperature displayed prominently
- [ ] Formula used: `Water Temp = (DDT × 3) - Room Temp - Flour Temp - Friction Factor`
- [ ] Friction factor: 6°C for hand mixing, 12°C for stand mixer, 18°C for spiral
- [ ] Mixer type selector (Hand, Stand Mixer, Spiral)
- [ ] Warning if calculated water temp is <4°C (too cold) or >43°C (kills yeast)
- [ ] Recipe card Tips section shows: "Use water at X°C (Y°F)"

---

### US-10.5: Temperature Unit Toggle
**As a** user
**I want to** switch between Celsius and Fahrenheit
**So that** I can use my preferred measurement system

**Acceptance Criteria:**
- [ ] Single toggle for all temperature fields
- [ ] Persists in local storage
- [ ] Instant conversion when toggled
- [ ] Default based on locale (°F for US, °C elsewhere)

---

## Epic 11: Fermentation Estimation

### US-11.1: Bulk Fermentation Time Estimate
**As a** home baker
**I want to** know approximately how long bulk fermentation will take
**So that** I can plan my baking schedule

**Acceptance Criteria:**
- [ ] Estimated bulk fermentation time displayed (range, e.g., "3-4 hours")
- [ ] Based on: DDT, yeast type, enrichment level
- [ ] Visual timeline showing fermentation stages
- [ ] Note: "Times are estimates. Watch for 50-75% rise, not the clock"

**Base Times (at 24°C/75°F):**
- Instant/Active Dry Yeast: 1.5-2 hours
- Fresh Yeast: 1.5-2 hours
- Sourdough Starter: 4-6 hours

**Temperature Adjustment:**
- Every 1°C increase: -10% time
- Every 1°C decrease: +10% time

---

### US-11.2: Cold Retard Option
**As a** baker who wants convenience
**I want to** plan an overnight cold ferment
**So that** I can bake fresh bread in the morning

**Acceptance Criteria:**
- [ ] "Cold Retard" toggle in Advanced Options
- [ ] When enabled: Shows refrigerator fermentation option
- [ ] Two presets: "Same Day" vs "Overnight Cold Retard"
- [ ] Cold retard shows: "8-18 hours at 3-5°C (38-41°F)"
- [ ] Adjusted instructions in recipe card

---

### US-11.3: Proofing Time Estimate
**As a** baker
**I want to** know how long final proofing takes
**So that** I can time my preheat and bake

**Acceptance Criteria:**
- [ ] Final proof time estimate displayed
- [ ] Based on dough temperature and enrichment level
- [ ] Room temp proof: 45 min - 2 hours (depending on factors)
- [ ] Cold proof option: 8-18 hours
- [ ] "Poke test" guidance linked

---

### US-11.4: Baking Schedule Generator
**As a** home baker
**I want to** see a full baking timeline
**So that** I can plan backwards from when I want fresh bread

**Acceptance Criteria:**
- [ ] "Plan My Bake" button opens schedule modal
- [ ] Input: "I want bread ready at [time]"
- [ ] Generates timeline: Start mixing → Bulk → Shape → Proof → Bake → Cool
- [ ] Option to add to calendar (generates .ics file)
- [ ] Accounts for selected fermentation method (same day vs cold retard)

---

## Epic 12: Enrichments

### US-12.1: Enrichment Selection
**As a** baker making enriched breads
**I want to** add enrichments (butter, oil, eggs, milk, sugar)
**So that** the calculator adjusts hydration and provides accurate measurements

**Acceptance Criteria:**
- [ ] Enrichments section in Advanced Options (collapsed by default)
- [ ] Expands for enriched bread styles automatically
- [ ] Toggle switches for each enrichment type
- [ ] Percentage input when enabled
- [ ] Recipe card shows enrichments in ingredients list

**Available Enrichments:**
- Butter / Oil (fats)
- Eggs (whole, yolk only, white only)
- Milk / Cream (dairy)
- Sugar / Honey (sweeteners)

---

### US-12.2: Fat Enrichment (Butter/Oil)
**As a** baker
**I want to** add butter or oil to my dough
**So that** I get a softer, richer crumb

**Acceptance Criteria:**
- [ ] Fat type selector: Butter, Olive Oil, Vegetable Oil
- [ ] Percentage input: 0-30% of flour weight
- [ ] Default for enriched bread: 5-10%
- [ ] Water content adjustment for butter (15% water in butter)
- [ ] Tip: "Add softened butter after initial gluten development"

**Calculation:**
- Butter contains ~15% water, ~85% fat
- When butter added, reduce water by: butter weight × 0.15

---

### US-12.3: Egg Enrichment
**As a** baker making brioche or challah
**I want to** add eggs to my dough
**So that** I get a rich, golden crumb

**Acceptance Criteria:**
- [ ] Egg type selector: Whole Eggs, Yolks Only, Whites Only
- [ ] Input by count or by percentage
- [ ] Large egg weight reference: 50g total (30g white, 20g yolk)
- [ ] Water content adjusted: whole eggs ~75% water, yolks ~50%, whites ~90%
- [ ] Recipe shows: "2 large eggs (100g)" format

**Calculation:**
- Whole egg: 75% water, 13% protein, 11% fat
- Water reduction = egg weight × 0.75

---

### US-12.4: Dairy Enrichment (Milk/Cream)
**As a** baker
**I want to** replace water with milk
**So that** I get a softer crust and richer flavor

**Acceptance Criteria:**
- [ ] Dairy type selector: Whole Milk, Buttermilk, Heavy Cream
- [ ] Percentage input: What % of liquid is dairy
- [ ] Can do partial replacement (e.g., 50% water, 50% milk)
- [ ] Water content adjusted: milk ~87% water, cream ~58% water
- [ ] Tip: "Scald milk and cool before using to deactivate enzymes"

---

### US-12.5: Sweetener Enrichment
**As a** baker
**I want to** add sugar or honey to my dough
**So that** I get better browning and flavor

**Acceptance Criteria:**
- [ ] Sweetener type: Sugar, Honey, Maple Syrup, Malt Syrup
- [ ] Percentage input: 0-20% of flour weight
- [ ] Honey/liquid sweetener water content adjusted (~17-20% water)
- [ ] Warning at >10%: "High sugar may slow yeast; consider osmotolerant yeast"
- [ ] Tip: "Malt syrup at 1-2% improves crust color and flavor"

---

### US-12.6: Hydration Adjustment Display
**As a** baker using enrichments
**I want to** see how enrichments affect my dough's hydration
**So that** I understand the final dough consistency

**Acceptance Criteria:**
- [ ] "Effective hydration" displayed when enrichments active
- [ ] Shows: "Target: 72% → Effective: 68% (accounting for enrichments)"
- [ ] Breakdown: Water contribution from each enrichment
- [ ] Visual hydration bar updates in real-time

---

## Epic 13: Multi-Flour Support

### US-13.1: Multiple Flour Selection
**As a** baker using flour blends
**I want to** combine different flours
**So that** I can create custom flour blends

**Acceptance Criteria:**
- [ ] "Add Flour" button to add multiple flour types
- [ ] Up to 4 flour types supported
- [ ] Each flour has: Type dropdown, Percentage input
- [ ] Percentages must sum to 100%
- [ ] Validation error if percentages don't equal 100%

**Flour Types Available:**
- Bread Flour (12-14% protein)
- All-Purpose Flour (10-12% protein)
- Whole Wheat Flour
- Rye Flour (light, medium, dark)
- Spelt Flour
- Einkorn Flour
- Semolina/Durum
- Tipo 00 Flour
- High-Extraction Flour

---

### US-13.2: Flour Properties Database
**As a** baker
**I want to** see information about each flour type
**So that** I understand how it affects my bread

**Acceptance Criteria:**
- [ ] Info icon next to each flour shows tooltip
- [ ] Tooltip shows: Protein %, Absorption rate, Best uses
- [ ] Example: "Bread Flour: 12-14% protein, high gluten, ideal for artisan breads"
- [ ] Absorption adjustment suggestions for high-absorption flours

**Flour Data:**
| Flour | Protein | Absorption | Notes |
|-------|---------|------------|-------|
| Bread | 12-14% | 60-65% | Strong gluten network |
| AP | 10-12% | 55-60% | Versatile, softer crumb |
| Whole Wheat | 13-14% | 70-80% | Add 5-10% more water |
| Rye | 8-12% | 80-90% | Max 30% for structure |
| Spelt | 12-15% | 55-60% | Delicate gluten, mix gently |

---

### US-13.3: Whole Grain Percentage Calculator
**As a** baker
**I want to** see my total whole grain percentage
**So that** I know if I need to adjust hydration

**Acceptance Criteria:**
- [ ] Whole grain % calculated from flour blend
- [ ] Displayed prominently: "Whole Grain: 25%"
- [ ] Auto-suggests hydration increase for >20% whole grain
- [ ] Rule: Add 2-5% hydration for each 10% whole grain
- [ ] Warning at >50%: "High whole grain may need longer autolyse"

---

### US-13.4: Recommended Flour Blends
**As a** baker
**I want to** see suggested flour combinations for my bread style
**So that** I don't have to figure out blends from scratch

**Acceptance Criteria:**
- [ ] "Suggested Blend" button per bread style
- [ ] Sourdough: 90% Bread + 10% Whole Wheat
- [ ] Baguette: 100% Bread or French T65
- [ ] Focaccia: 100% Bread or Tipo 00
- [ ] Ciabatta: 80% Bread + 20% Semolina
- [ ] Clicking suggestion auto-fills flour inputs

---

## Epic 14: Preferments

### US-14.1: Preferment Type Selection
**As an** advanced baker
**I want to** add a preferment to my dough
**So that** I get improved flavor, extensibility, and keeping quality

**Acceptance Criteria:**
- [ ] Preferment section in Advanced Options
- [ ] Types: None, Poolish, Biga, Pâte Fermentée, Levain (starter-based)
- [ ] Selecting preferment shows additional inputs
- [ ] Recipe card shows preferment as separate section with timing

**Preferment Characteristics:**
| Type | Hydration | Yeast | Ferment Time | Flavor |
|------|-----------|-------|--------------|--------|
| Poolish | 100% | 0.1-0.5% | 8-16 hours | Mild, extensible |
| Biga | 50-60% | 0.5-1% | 8-16 hours | Nutty, strong |
| Pâte Fermentée | Recipe hydration | Recipe | 1-3 hours | Mature dough |
| Levain | 100% | (starter) | 4-12 hours | Complex, tangy |

---

### US-14.2: Preferment Percentage
**As a** baker using preferments
**I want to** specify how much flour goes into the preferment
**So that** I control flavor intensity and dough handling

**Acceptance Criteria:**
- [ ] Percentage slider: 15-40% of total flour
- [ ] Default: 20% for poolish, 30% for biga
- [ ] Higher % = more flavor, more extensible dough
- [ ] Lower % = more strength, milder flavor
- [ ] Recipe shows preferment ingredients separately

---

### US-14.3: Preferment Timing Calculator
**As a** baker
**I want to** know when to start my preferment
**So that** it's ready when I need to mix my dough

**Acceptance Criteria:**
- [ ] Room temperature input affects timing
- [ ] Preferment ready indicators:
  - Poolish: Domed, bubbly, just starting to recede
  - Biga: Doubled, domed
  - Levain: Doubled, passes float test
- [ ] "Start preferment at X:XX" based on desired mix time
- [ ] Temperature adjustment: ±2 hours per 3°C difference

---

### US-14.4: Preferment Recipe Card Section
**As a** baker
**I want** my recipe to show preferment instructions clearly
**So that** I know exactly what to do and when

**Acceptance Criteria:**
- [ ] Recipe card has "Preferment" section before "Final Dough"
- [ ] Shows: Preferment ingredients, timing, ready signs
- [ ] Final Dough section shows remaining flour/water/yeast
- [ ] Clear labels: "POOLISH (make night before)" etc.
- [ ] Preferment ingredients not double-counted in totals

**Example Recipe Layout:**
```
POOLISH (make 12-16 hours before)
- Bread Flour: 150g (20%)
- Water: 150g
- Instant Yeast: 0.2g (tiny pinch)

FINAL DOUGH
- Bread Flour: 600g (remaining 80%)
- Water: 300g (adjust based on poolish)
- Salt: 15g (2%)
- All of the Poolish

INSTRUCTIONS
1. Night before: Mix poolish ingredients...
```

---

### US-14.5: Autolyse Timer
**As a** baker
**I want** an autolyse step option
**So that** I can improve gluten development and extensibility

**Acceptance Criteria:**
- [ ] Autolyse toggle in Advanced Options
- [ ] Duration selector: 20, 30, 45, 60 minutes
- [ ] Instructions updated: "Mix flour and water, rest X minutes before adding salt/yeast"
- [ ] Tooltip: "Autolyse hydrates flour and develops gluten with no kneading"
- [ ] Recommended for high-hydration and whole grain doughs

---

## Epic 15: Cross-Promotion & Sister Sites

### US-15.1: Pizza Dough Formula CTA
**As a** visitor interested in pizza dough
**I want to** see a clear path to The Pizza Dough Formula
**So that** I can use the specialized pizza calculator for my pizza-making needs

**Acceptance Criteria:**
- [x] Editorial-style CTA banner below bread style selector
- [x] Compelling copy: "Making Pizza? Discover *The Pizza Dough Formula*"
- [x] Subtext highlighting pizza styles: Neapolitan, New York, Detroit
- [x] Visual pizza icon matching site's iconography style
- [x] Hover animation (icon rotation, arrow slide)
- [x] Links to thepizzadoughformula.com in new tab
- [x] Styling matches editorial magazine aesthetic
- [x] Mobile responsive design

**Copy:**
- Label: "MAKING PIZZA?"
- Headline: "Discover *The Pizza Dough Formula*"
- Subtext: "Neapolitan, New York, Detroit & more — precision-crafted for the perfect pie"

---

## Enhanced Priority Matrix

| Priority | Epic | Stories | Sprint |
|----------|------|---------|--------|
| P0 - MVP | Core Calculator | US-1.1 through US-1.4 | ✅ Done |
| P0 - MVP | Mobile | US-6.1 through US-6.4 | ✅ Done |
| P0 - MVP | Performance | US-7.1 | ✅ Done |
| **P1 - Phase 1** | **Yeast Types** | **US-9.1, US-9.2, US-9.3** | **Sprint 1** |
| **P1 - Phase 1** | **Temperature** | **US-10.1 through US-10.5** | **Sprint 1** |
| **P1 - Phase 1** | **Fermentation** | **US-11.1, US-11.3** | **Sprint 1** |
| **P2 - Phase 2** | **Enrichments** | **US-12.1 through US-12.6** | **Sprint 2** |
| **P2 - Phase 2** | **Multi-Flour** | **US-13.1 through US-13.4** | **Sprint 2** |
| **P3 - Phase 3** | **Preferments** | **US-14.1 through US-14.5** | **Sprint 3** |
| **P3 - Phase 3** | **Fermentation+** | **US-11.2, US-11.4** | **Sprint 3** |
| P1 - Launch | SEO | US-3.1 through US-3.3 | Sprint 4 |
| P1 - Launch | Newsletter | US-5.1, US-5.3 | Sprint 4 |
| P1 - Launch | Monetization | US-4.1, US-4.3 | Sprint 4 |

---

## Implementation Sprints

### Sprint 1: Core Advanced Features (Yeast + Temperature + Basic Fermentation)
**Goal:** Make the calculator genuinely useful for serious bakers

**User Stories:**
- US-9.1: Yeast Type Selector
- US-9.2: Yeast Usage Tips
- US-9.3: Starter Hydration Input
- US-10.1: Desired Dough Temperature (DDT)
- US-10.2: Room Temperature Input
- US-10.3: Flour Temperature Input
- US-10.4: Water Temperature Calculation
- US-10.5: Temperature Unit Toggle
- US-11.1: Bulk Fermentation Time Estimate
- US-11.3: Proofing Time Estimate

**UI Changes:**
- Redesign Advanced Options accordion into tabbed interface
- Tab 1: Yeast & Temperature
- Tab 2: Enrichments (Sprint 2)
- Tab 3: Flour Blend (Sprint 2)
- Tab 4: Preferments (Sprint 3)

---

### Sprint 2: Enrichments & Multi-Flour
**Goal:** Support enriched breads and custom flour blends

**User Stories:**
- US-12.1: Enrichment Selection
- US-12.2: Fat Enrichment (Butter/Oil)
- US-12.3: Egg Enrichment
- US-12.4: Dairy Enrichment (Milk/Cream)
- US-12.5: Sweetener Enrichment
- US-12.6: Hydration Adjustment Display
- US-13.1: Multiple Flour Selection
- US-13.2: Flour Properties Database
- US-13.3: Whole Grain Percentage Calculator
- US-13.4: Recommended Flour Blends

**UI Changes:**
- Enrichments tab with toggle controls
- Multi-flour interface with percentage inputs
- Effective hydration display

---

### Sprint 3: Preferments & Advanced Scheduling
**Goal:** Professional-level preferment support

**User Stories:**
- US-14.1: Preferment Type Selection
- US-14.2: Preferment Percentage
- US-14.3: Preferment Timing Calculator
- US-14.4: Preferment Recipe Card Section
- US-14.5: Autolyse Timer
- US-11.2: Cold Retard Option
- US-11.4: Baking Schedule Generator

**UI Changes:**
- Preferments tab
- Enhanced recipe card with preferment section
- Schedule modal

---

### Sprint 4: SEO, Newsletter, Cross-Promotion, Polish
**Goal:** Launch-ready with monetization and cross-promotion

**User Stories:**
- US-15.1: Pizza Dough Formula CTA ✅ Done
- US-3.1 through US-3.3: SEO
- US-5.1, US-5.3: Newsletter
- US-4.1, US-4.3: Affiliate setup
- US-8.1 through US-8.3: Polish

---

## Design System Reference

All new components must maintain the existing aesthetic:

**Colors (CSS Variables):**
```css
--flour: #FAF7F2        /* Background */
--crust: #2C1810        /* Primary text */
--espresso: #1C0F09     /* Dark accents */
--golden-hour: #C4903D  /* Primary action */
--warm-cream: #F5EDE0   /* Card backgrounds */
--scoring-mark: #E8DDD0 /* Dividers */
```

**Typography:**
- Display: Fraunces (serifs with optical sizing)
- Body: DM Sans (clean, readable)
- Editorial: Cormorant Garamond (elegant accents)

**Component Patterns:**
- Cards: Warm cream background, subtle shadow, rounded corners
- Inputs: Outline style with golden focus ring
- Buttons: Primary (golden), Secondary (outline), Ghost (text only)
- Accordions: Smooth expand with scoring mark dividers
- Tooltips: Dark background, small text

**Animation Guidelines:**
- Transitions: 150-300ms ease-out
- Hover effects: Subtle lift, golden glow
- Page load: Staggered fade-in (100ms delay increment)
- Respect prefers-reduced-motion

---

## Definition of Done

A user story is complete when:

- [ ] All acceptance criteria met
- [ ] Responsive on mobile, tablet, desktop
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Lighthouse scores maintained (95+ Performance, Accessibility)
- [ ] No console errors
- [ ] Code reviewed
- [ ] Deployed to staging and verified
