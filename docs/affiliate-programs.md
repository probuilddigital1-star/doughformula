# Affiliate programs for bread gear

Research date: 2026-09-09; Challenger Breadware section updated 2026-09-26 after the program went live. Figures marked *primary* come from the merchant's or network's own page; figures marked *directory* come from affiliate directories and should be confirmed on the application page before relying on them. Nothing here has been applied to, except where a section says the program is live.

## Summary

| Merchant | Fit for this site | Runs through | Commission | Cookie | Payout minimum | Source quality |
|---|---|---|---|---|---|---|
| ThermoWorks | Thermapen already listed | Impact (moved from Post Affiliate Pro; confirmed 2026-09-09) | 10% | 30 days | Impact terms (threshold set by publisher, $10 minimum) | primary |
| Brød & Taylor | Proofer, bread steel | Own portal (US portal currently broken) | 7% of net (EU terms) | 30 days (EU) | not stated | primary (EU), US unconfirmed |
| Challenger Breadware | Cast-iron bread pan, high ticket (**live since 2026-09-25**) | Own portal (AffiliateWP) | 10% | not stated | not stated | primary (signed agreement) |
| King Arthur Baking | Flour, bannetons, Dutch ovens | Awin (merchant 98207) | 5% new customer, 2% coupon/loyalty | 30 days | $50 (Awin) | primary (network profile) |
| Baking Steel | Alternative to the ThermiChef steel | UpPromote | 10% | 30 days | not stated | primary |
| Cultures for Health | Sourdough starters | UpPromote direct; FlexOffers listing | 10% direct; 7% via FlexOffers | not stated direct; 30 days FlexOffers | not stated | primary |
| Pleasant Hill Grain | Mixers, mills, brick ovens | Ascend by Partnerize | 3.25% (2% on items $6,000+) | 60 days | not stated | primary (network profile) |
| Emile Henry USA | Bread cloche | ShareASale (merchant 99803) plus email vetting | not stated | not stated | not stated | primary (terms withheld) |
| Wire Monkey | Lames (UFO lame already listed) | Refersion | not stated; customers get 10% off | not stated | not stated | primary (terms withheld) |
| Ooni | Adjacent: pizza, focaccia | Awin (US merchant 77074) | ~9 to 10% | 30 days | $50 monthly | directory |
| Etsy | Handmade bannetons, lames, couches | Awin (merchant 6220), migrating to Rakuten | ~4%, category based | 30 days | not stated | directory |
| OXO | Bench scraper already listed | Impact | ~5% | 30 days | not stated | directory |
| Mockmill | Grain mills | Own dashboard (mockmill.us) | not public | not public | not public | none |
| Amazon Associates (baseline) | Everything, already live | Amazon | 4.5% Kitchen & Dining | 24 hours | $10 direct deposit, $100 check | primary (seen in SiteStripe) |

**No program found:** Breadtopia (customer rewards only), Lodge Cast Iron (Cohley ambassador program only), USA Pan, Nordic Ware, Ankarsrum, Escali.

## Recommendation

Apply to three, in this order:

1. **ThermoWorks.** The Thermapen is already on every page's universal gear list at Amazon's 4.5%. Moving that one link to ThermoWorks direct more than doubles the rate, adds a 30-day cookie in place of Amazon's 24 hours, and the $10 direct-deposit threshold means it actually pays out at this traffic level. Approval criteria are published and this site meets them.
2. **Brød & Taylor.** The folding proofer is the single most on-brand product for a calculator that deals in fermentation temperature, and nothing like it is on the site today. The US affiliate portal is showing an app error as of this writing, so the path is to email them; the EU program's terms (7% of net, 30-day cookie, paid two months after month end) are the best available indication of what the US program looks like.
3. **Challenger Breadware.** Joined; live since 2026-09-25. One high-ticket item ($299 at signup) on the Dutch-oven recipe pages and the calculator pages. 10% of $299 is about $30 per sale.

**A fourth, if you are willing to open an Awin publisher account:** King Arthur Baking. Awin also hosts Ooni and Etsy, so one account unlocks three merchants. Awin's publisher signup takes a small refundable deposit (historically $5; confirm on the signup page) and King Arthur requires a US audience, which this site has (48% US impressions).

Concentration matters more than coverage at ~800 visits a month: each program holds earnings until its threshold, so four programs is the practical ceiling before payouts fragment into piles that never clear.

## Per-merchant detail

### ThermoWorks

- **Program page:** https://www.thermoworks.com/pages/affiliate
- **Sign-up:** "Apply Today" button on the program page, which goes to Impact (the Post Affiliate Pro signup URL now returns 404, observed 2026-09-09)
- **Runs through:** Impact (publisher account required; same network as OXO)
- **Commission:** 10% of sale value
- **Cookie:** 30 days from the initial click
- **Payout:** $10 minimum by direct deposit, $100 by check; paid approximately 30 days after the end of each calendar month
- **Approval requirements:** site content must be relevant to ThermoWorks products. Rejected: incomplete or under-construction sites, sites without unique content, sites irrelevant to the core products, explicit or discriminatory content, illegal activity or spam, IP violations, links to prohibited sites.
- **Fit:** replace the Thermapen Amazon link in `GEAR_SETS.universal` with a `merchant: 'direct'` entry. The data model already supports it.
- Source: program page (10%, 30 days); the old Post Affiliate Pro FAQ is gone

### Brød & Taylor

- **Program pages:** US https://brodandtaylor.com/pages/affiliates (currently returns "Sorry, this page is currently unavailable. Please install GrowthHero Affiliate App", so the US program appears to run on GrowthHero and the app is uninstalled or misconfigured); EU https://brodandtaylor.eu/en/affiliate-program/; Canada references a Partner Portal at https://account.brodandtaylor.com
- **Runs through:** own affiliate system (GrowthHero on the US Shopify store, per the error message)
- **Commission (EU program):** 7% on the net sales price
- **Cookie (EU):** 30 days; orders cancelled within 30 days do not qualify
- **Payout (EU):** two months after a qualified sale, rounded to month end; bank transfer or PayPal; minimum not stated
- **Approval:** registration form; criteria not published
- **Fit:** the folding proofer and the Bread Steel. Their affiliate contact is not published; use the site's contact form and mention the broken portal.
- Sources: EU program page above; US portal error observed 2026-09-09

### Challenger Breadware

- **Status:** active since 2026-09-25 (agreement signed as ProBuild Digital)
- **Program page:** https://challengerbreadware.com/affiliate-area/
- **Runs through:** own AffiliateWP portal
- **Commission:** 10% per sale
- **Product:** The Challenger Bread Pan, $299 at signup. Reference only: no price appears on the site.
- **Link format:** `https://challengerbreadware.com/product/the-challenger-bread-pan/?ref=probuilddigital&campaign=<tag>`
- **Campaign tags:** `recipe` (featured card on recipe pages), `recipe-step` (the one-sentence mention in the bake step), `calculator` (featured card in the calculator gear blocks)
- **Images:** official media kit images only. The site uses `src/assets/gear/challenger-bread-pan.jpg` from the kit.
- **Restrictions:** no paid search bidding on the Challenger brand
- **On the site:** `challenger-bread-pan` in `src/data/equipment.ts`, shown through `FEATURED_GEAR['dutch-oven']` as a featured card on the sourdough, country loaf and no-knead recipe pages and in the gear block on both calculator pages. Never on the homepage. It is not in any plain gear list.

### King Arthur Baking

- **Network:** Awin, merchant 98207 (https://ui.awin.com/merchant-profile/98207); publisher signup at https://ui.awin.com/publisher-signup/en/awin/
- **Commission:** 5% on new customer orders; 2% for coupon and loyalty partners
- **Cookie:** 30 days
- **Payout:** $50 (Awin standard); monthly, around the 20th
- **Approval:** blogs, social, and content sites accepted; a US audience is required since King Arthur ships mainly within the US; no explicit, hateful, illegal, religious, or political content
- **Managed by:** Lab6 Media
- **Fit:** flour on the recipe pages, bannetons and Dutch ovens as alternatives to the Amazon picks
- Source: https://uppromote.com/affiliate-directory/king-arthur-baking/ (network profile summary)

### Baking Steel

- **Sign-up:** https://af.uppromote.com/baking-steel/register (also linked from https://bakingsteel.com/pages/affiliate-registration)
- **Runs through:** UpPromote
- **Commission:** 10% of total referral sales
- **Cookie:** 30 days
- **Customer incentive:** 10% off with the affiliate's code
- **Payout and approval:** not stated on the registration page
- **Fit:** The Original Baking Steel as a direct-link alternative to the ThermiChef Amazon listing on baguette and ciabatta pages
- Source: registration page above

### Cultures for Health

- **Sign-up (direct):** https://af.uppromote.com/cultures-for-health/register
- **Runs through:** UpPromote (direct); a FlexOffers listing also exists (https://www.flexoffers.com/affiliate-programs/cultures-health-affiliate-program/) showing 7% and a 30-day cookie, flagged there as "not currently offering this affiliate program in our system"
- **Commission (direct):** 10% of total referral sales
- **Cookie (direct):** not stated
- **Payout:** PayPal; schedule "notified on the Affiliate Guide page"; minimum not stated (one directory reports $100)
- **Approval:** at the merchant's "sole and absolute discretion"
- **Fit:** sourdough starters on the sourdough and country-loaf pages and in the preferment section
- Sources: registration page; FlexOffers listing

### Pleasant Hill Grain

- **Network:** Ascend by Partnerize (https://www.ascendpartner.com)
- **Commission:** 3.25% flat; 2% on new-customer orders for items priced $6,000 and up
- **Cookie:** 60 days
- **Restrictions:** no trademark bidding; no direct linking; no commission on 14 excluded brands including Mockmill, Haussler, and Rofco; email promotions only with prior approval and CAN-SPAM compliance
- **Payout and approval:** not stated
- **Fit:** stand mixers and brick ovens for the audience segment that has outgrown a Dutch oven; low rate, long cookie, high ticket
- Source: https://affi.io/m/pleasant-hill-grain

### Emile Henry USA

- **Program page:** https://www.emilehenryusa.com/pages/affiliate-program
- **Network:** ShareASale, merchant 99803 (https://www.shareasale.com/join/99803); the page also asks applicants to email info@eh-usa.com explaining the fit
- **Commission, cookie, payout:** not stated
- **Approval:** selective ("if we feel that you would be a great fit, an Emile Henry team member will reach out")
- **Fit:** the ceramic bread cloche as a Dutch-oven alternative
- Source: program page

### Wire Monkey

- **Sign-up:** https://wiremonkey.refersion.com/affiliate/registration (the "Apply to Become An Affiliate" link on wiremonkey.com)
- **Runs through:** Refersion
- **Commission, cookie, payout:** not published; customers referred through affiliate links receive 10% off
- **Fit:** the UFO lame is already in two gear sets via Amazon; a direct link would replace it
- Source: wiremonkey.com (link target observed 2026-09-09)

### Ooni

- **Program page:** https://ooni.com/pages/become-an-affiliate (links to Awin publisher signup); Awin US merchant 77074
- **Commission:** about 9 to 10% (directory)
- **Cookie:** 30 days (directory)
- **Payout:** $50 monthly minimum (directory)
- **Fit:** adjacent. Focaccia and pizza dough overlap, but the audience is a step away from bread; lower priority.
- Sources: program page; https://www.postaffiliatepro.com/affiliate-program-directory/ooni-pizza-ovens-affiliate-program/

### Etsy

- **Network:** Awin, merchant 6220; Etsy has announced a migration to Rakuten, so check which network is current when applying
- **Commission:** about 4% standard, category based, visible after approval
- **Cookie:** 30 days
- **Approval:** manual review, typically 2 to 5 business days
- **Restrictions:** no commission on purchases from your own shop; see https://www.etsy.com/legal/affiliates/
- **Fit:** handmade bannetons, walnut lames, linen couches; good for a "handmade alternative" line under the Amazon picks
- Sources: https://help.etsy.com/hc/en-us/articles/360000335987 (blocks automated fetch; via search summaries); Etsy affiliates policy

### OXO

- **Program page:** https://www.oxo.com/oxo-affiliate-program (blocks automated fetch)
- **Network:** Impact
- **Commission:** about 5% (directory)
- **Cookie:** 30 days (directory)
- **Fit:** the bench scraper is already in the universal set via Amazon; marginal gain
- Source: search summaries of the program page and Impact listing

### Mockmill

- An affiliate dashboard exists at https://mockmill.us/affiliate-dashboard/ (login only); the program changed in October 2023 and no longer offers audience discounts; terms are not public. Note that Pleasant Hill Grain excludes Mockmill from its commissions, so a direct Mockmill relationship is the only route for mills.

## Notes for when you apply

- Amazon's Operating Agreement allows other merchants alongside Amazon; none of the programs above requires exclusivity.
- Every program requires FTC-style disclosure near the links. The site's `AffiliateDisclosure` component already appends "Some links go to other retailers who also pay me a commission." automatically when any product in a placement has `merchant: 'direct'`.
- Amazon links may not appear in email; ThermoWorks, Brød & Taylor, and most direct programs allow them. Keep that in mind for the newsletter.
- Each program that pays $600 or more in a calendar year issues its own 1099.
- Adding a direct-merchant product is a data-file edit in `src/data/equipment.ts`: `merchant: 'direct'`, `href` set to the program's tracking link, `merchantLabel` set to the merchant name.
