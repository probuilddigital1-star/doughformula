// The bread style cards on the homepage: each style's recipe settings together with the words
// that go with it (description, recommended flour, steps).
//
// The settings live in ./bread-calculator.ts (STYLE_RECIPES), because the calculator's math
// reads them in the browser. The words live here, and only the server-rendered page and the
// tests load this file: the browser gets the words from the page's HTML, so they stay out of
// the script every homepage visit downloads.
import { STYLE_RECIPES, type StyleRecipe } from './bread-calculator';

export interface BreadStyle extends StyleRecipe {
  description: string;
  flour: string;
  /** The steps, with `{rise}`, `{proof}`, `{then-fridge}` and `{cold}` where the times go. styleSteps()
   *  in ./bread-calculator.ts fills them from the style's times, as the Timing tab shows them. */
  instructions: string[];
}

const STYLE_TEXT: Record<string, Pick<BreadStyle, 'description' | 'flour' | 'instructions'>> = {
  'sourdough': {
    description: 'Wild yeast, complex tang, overnight fermentation',
    flour: 'Bread Flour + Whole Wheat',
    instructions: [
      'Mix flour and water, autolyse 30-60 minutes',
      'Add starter and salt, mix until combined',
      'Bulk ferment {rise} at room temperature, with a stretch and fold every 30 min for the first 2 hours',
      'Shape and proof {proof}',
      'Bake in Dutch oven at 500°F for 20 min covered, 25 min uncovered'
    ]
  },
  'baguette': {
    description: 'Crisp crust, open crumb, classic French',
    flour: 'Bread Flour or T65',
    instructions: [
      'Mix flour, water, yeast. Autolyse 20 minutes',
      'Add salt, mix until smooth',
      'Bulk ferment {rise} until doubled, with a fold every 30 minutes for the first 1.5 hours',
      'Divide and pre-shape, rest 20 minutes',
      'Final shape into baguettes, proof {proof}',
      'Score and bake at 475°F with steam for 22-25 minutes'
    ]
  },
  'focaccia': {
    description: 'Olive oil enriched, dimpled, herbaceous',
    flour: 'Bread Flour or All-Purpose',
    // The olive oil is on the ingredient list (5% of the flour), so the step names no amount.
    instructions: [
      'Mix flour, water, yeast, and the olive oil',
      'Add salt, mix until smooth and elastic',
      'Bulk ferment {rise}, with a stretch and fold every 30 min for the first hour',
      'Pour into oiled pan, dimple with fingers',
      'Proof {proof} until puffy',
      'Dimple again, drizzle olive oil, add toppings',
      'Bake at 425°F for 20-25 minutes until golden'
    ]
  },
  'sandwich': {
    description: 'Soft, tender crumb for everyday slicing',
    flour: 'Bread Flour or All-Purpose',
    // Instant yeast goes in with the flour. With active dry picked, the recipe card adds the
    // line about blooming it first. The butter is on the ingredient list (5% of the flour).
    instructions: [
      'Mix flour, salt, and yeast',
      'Add the water and the butter (or oil)',
      'Knead 8-10 minutes until smooth',
      'Bulk ferment {rise} until doubled',
      'Shape into loaf, place in greased pan',
      'Proof {proof} until risen above pan',
      'Bake at 375°F for 30-35 minutes'
    ]
  },
  'ciabatta': {
    description: 'High hydration, irregular holes, rustic',
    flour: 'Bread Flour',
    instructions: [
      'Mix flour, water, yeast into shaggy dough',
      'Rest 30 minutes (autolyse)',
      'Add salt, fold until incorporated',
      'Bulk ferment {rise} until very bubbly, with a stretch and fold every 30 min for the first 1.5 hours',
      'Gently turn out, divide without degassing',
      'Proof {proof}, bake at 475°F with steam for 20-25 min'
    ]
  },
  'brioche': {
    description: 'Butter and eggs for rich, tender bread',
    flour: 'All-Purpose Flour',
    instructions: [
      'Mix flour, sugar (8%), eggs, milk, and yeast',
      'Knead until smooth, about 10 minutes',
      'Gradually add soft butter (25%), knead until silky',
      'Add salt, knead 2 more minutes',
      'Bulk ferment {rise}{then-fridge}',
      'Shape the{cold} dough, proof {proof} until doubled',
      'Egg wash and bake at 350°F for 25-30 minutes'
    ]
  },
  'no-knead': {
    description: 'Hands-off, long ferment, crispy crust',
    flour: 'Bread Flour or All-Purpose',
    instructions: [
      'Mix flour, water, salt, and yeast until shaggy (2 min)',
      'Cover and let rise at room temperature {rise}',
      'Dough is ready when bubbly and doubled',
      'Turn out onto floured surface, fold into ball',
      'Let rest 15 min, then shape into round',
      'Proof in bowl lined with floured towel {proof}',
      'Preheat Dutch oven at 450°F for 30 min',
      'Bake covered 30 min, uncovered 15-20 min until deep golden'
    ]
  },
  'custom': {
    description: 'Your recipe, your rules',
    flour: 'Your choice',
    instructions: [
      'Mix ingredients according to your method',
      'Knead or fold as needed',
      'Ferment according to your schedule',
      'Shape and proof',
      'Bake at appropriate temperature'
    ]
  }
};

/** The style cards, in the order the homepage shows them. The first is selected on load. */
export const BREAD_STYLES: BreadStyle[] = STYLE_RECIPES.map((recipe) => ({ ...recipe, ...STYLE_TEXT[recipe.id] }));
