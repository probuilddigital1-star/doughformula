import {
  calculateRecipe,
  createDefaultEnrichments,
  createDefaultFlourBlend,
  createDefaultState,
  ingredientRows,
  prefermentRows,
  type EnrichmentState,
  type FlourEntry,
  type IngredientRow,
  type PrefermentIngredients,
  type PrefermentRow,
  type Recipe,
  type RecipeState,
} from '../../../src/lib/bread-calculator';

export interface Printed {
  state: RecipeState;
  enrichments: EnrichmentState;
  recipe: Recipe;
  preferment: PrefermentIngredients | null;
  /** The ingredient list as the recipe card prints it ("Final Dough" with a preferment). */
  rows: IngredientRow[];
  /** The preferment box above it; empty without a preferment. */
  prefermentRows: PrefermentRow[];
  /** Grams of every printed ingredient row added up. */
  rowsTotal: number;
}

/** Builds what the homepage prints for a state, in the order the page's updateUI() does. */
export function printed(
  state: RecipeState,
  enrichments: EnrichmentState = createDefaultEnrichments(),
  flourBlend: FlourEntry[] = createDefaultFlourBlend(),
): Printed {
  const recipe = calculateRecipe(state, enrichments, flourBlend);
  const preferment = recipe.preferment;
  const rows = ingredientRows(state, enrichments, recipe);
  return {
    state,
    enrichments,
    recipe,
    preferment,
    rows,
    prefermentRows: prefermentRows(state, recipe),
    rowsTotal: rows.reduce((sum, r) => sum + r.weight, 0),
  };
}

/** The default calculator state with some fields changed. */
export function stateWith(over: Partial<RecipeState> = {}): RecipeState {
  return { ...createDefaultState(), ...over };
}

export const row = (p: Printed, name: string): IngredientRow | undefined => p.rows.find((r) => r.name === name);
