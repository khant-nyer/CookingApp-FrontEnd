import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { unitOptions } from '../features/backend-explorer/constants/units';
import useBackendExplorerController from '../features/backend-explorer/hooks/useBackendExplorerController';
import { useFoodsTabProps } from '../features/backend-explorer/hooks/useFoodsTabProps';
import { useIngredientsTabProps } from '../features/backend-explorer/hooks/useIngredientsTabProps';
import { useRecipeSearchableValues } from '../features/backend-explorer/hooks/useRecipeSearchableValues';
import { useRecipesTabProps } from '../features/backend-explorer/hooks/useRecipesTabProps';
import { getItemId } from '../features/backend-explorer/utils/ids';
import { iconAssets } from './iconAssets';
import CreateEntityModal from '../features/backend-explorer/modals/CreateEntityModal';
import DeleteConfirmModal from '../features/backend-explorer/modals/DeleteConfirmModal';
import UpdateEntityModal from '../features/backend-explorer/modals/UpdateEntityModal';
import FoodsTab from '../features/backend-explorer/tabs/FoodsTab';
import IngredientsTab from '../features/backend-explorer/tabs/IngredientsTab';
import NutritionTab from '../features/backend-explorer/tabs/NutritionTab';
import RecipesTab from '../features/backend-explorer/tabs/RecipesTab';
import type { Recipe, TabKey } from '../features/backend-explorer/types';
import { AllergyWarningToggle } from '../features/backend-explorer/shared/ExplorerShared';

// ─── Local icon components ────────────────────────────────────────────────────

interface IconProps {
  className?: string;
}

interface ImageIconProps extends IconProps {
  src: string;
  fallbackSrc: string;
}

function ImageIcon({ className, src, fallbackSrc }: ImageIconProps) {
  return (
      <img
          src={src}
          alt=""
          className={className}
          aria-hidden
          onError={(event) => {
            if (event.currentTarget.src !== fallbackSrc) {
              event.currentTarget.src = fallbackSrc;
            }
          }}
      />
  );
}

const createSummaryIcon = (src: string, fallbackSrc: string) =>
    ({ className }: IconProps) => (
        <ImageIcon src={src} fallbackSrc={fallbackSrc} className={className} />
    );

const FoodSummaryIcon       = createSummaryIcon(iconAssets.foodSummaryAnimated,       iconAssets.foodSummaryFallback);
const IngredientSummaryIcon = createSummaryIcon(iconAssets.ingredientSummaryAnimated, iconAssets.ingredientSummaryFallback);
const RecipeSummaryIcon     = createSummaryIcon(iconAssets.recipeSummaryAnimated,     iconAssets.recipeSummaryFallback);
const ChefHatIcon           = createSummaryIcon(iconAssets.recipe,                   iconAssets.recipeSummaryFallback);

// ─── Dashboard sub-components ─────────────────────────────────────────────────

function DashboardCard({ title, total, icon }: { title: string; total: number; icon: ReactNode }) {
  return (
      <article className="dashboard-card">
        <div>
          <p className="dashboard-card-title">{title}</p>
          <strong className="dashboard-card-total">{total}</strong>
        </div>
        <span className="dashboard-card-icon" aria-hidden>{icon}</span>
      </article>
  );
}

// ─── Recipe title helpers ─────────────────────────────────────────────────────

function pickRecipeFoodName(recipe: Recipe) {
  if (recipe.foodName) return recipe.foodName;
  if (recipe.description) return recipe.description.split(/[.!?]/)[0];
  return 'Untitled recipe';
}

function pickRecipeTitle(recipe: Recipe) {
  const foodName  = pickRecipeFoodName(recipe);
  const createdBy = recipe.createdBy?.trim();
  return createdBy ? `${createdBy}'s ${foodName}` : foodName;
}

function pickRecipeVersion(recipe: Recipe) {
  const version = String(recipe.version ?? '').trim();
  return version || 'N/A';
}

// ─── Search placeholder map ───────────────────────────────────────────────────

const SEARCH_PLACEHOLDERS: Record<TabKey, string> = {
  dashboard:   '',
  foods:       'Search foods by name, category, or creator',
  ingredients: 'Search ingredients by name, category, or description',
  recipes:     'Search recipes by food, version, or description',
  nutrition:   'Search nutrient ingredients by name or category',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BackendExplorerProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  introComplete?: boolean;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  foodSearchQuery?: string;
  onFoodSearchQueryChange?: (value: string) => void;
  userAllergies?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BackendExplorer({
                                          isAuthenticated,
                                          onRequireAuth,
                                          introComplete = true,
                                          activeTab: externalActiveTab,
                                          onTabChange,
                                          foodSearchQuery,
                                          onFoodSearchQueryChange,
                                          userAllergies,
                                        }: BackendExplorerProps) {
  const [tabAnimationCycle, setTabAnimationCycle] = useState(0);

  const { viewState, createFlow, updateFlow, deleteFlow, entities } = useBackendExplorerController();
  const {
    selectedId,
    setSelectedId,
    selectedNutrient,
    setSelectedNutrient,
    setActiveTab,
    activeTab: controllerActiveTab,
    loadTabData,
    loading,
    error,
    pagination,
  } = viewState;

  const activeTab = externalActiveTab ?? controllerActiveTab;

  useEffect(() => {
    if (introComplete) setTabAnimationCycle((prev) => prev + 1);
  }, [activeTab, introComplete]);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  const runProtectedAction = useCallback(
      (action: () => void) => {
        if (!isAuthenticated) { onRequireAuth(); return; }
        action();
      },
      [isAuthenticated, onRequireAuth],
  );

  // ── Allergy awareness ───────────────────────────────────────────────────────

  const normalizedAllergies = useMemo(
      () => (userAllergies ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean),
      [userAllergies],
  );

  const buildAllergyAwarenessText = useCallback(
      (searchableValues: Array<string | undefined>): string | undefined => {
        if (!normalizedAllergies.length) return undefined;
        const text = searchableValues.map((v) => String(v ?? '').toLowerCase()).join(' ');
        if (!text.trim()) return undefined;
        const matched = [...new Set(normalizedAllergies.filter((a) => text.includes(a)))];
        return matched.length ? `Contains allergens: ${matched.join(', ')}` : undefined;
      },
      [normalizedAllergies],
  );

  // ── Recipe searchability (shared by dashboard + RecipesTab) ─────────────────

  const { getRecipeSearchableValues } = useRecipeSearchableValues(entities.ingredients);

  // ── Tab switch ──────────────────────────────────────────────────────────────

  const handleTabSwitch = useCallback(
      (tab: TabKey) => (onTabChange ? onTabChange(tab) : setActiveTab(tab)),
      [onTabChange, setActiveTab],
  );

  // ── Tab prop hooks ──────────────────────────────────────────────────────────

  const foodsTabProps = useFoodsTabProps({
    foods:                entities.foods,
    selectedFood:         entities.selectedFood,
    selectedId,
    setSelectedId,
    pagination:           pagination.foods,
    loading,
    createSuccess:        createFlow.createSuccess,
    openCreateModal:      createFlow.openCreateModal,
    openFoodUpdateModal:  updateFlow.openFoodUpdateModal,
    handleDeleteFood:     deleteFlow.handleDeleteFood,
    loadTabData,
    runProtectedAction,
    buildAllergyAwarenessText,
    searchQuery:          foodSearchQuery,
    onSearchQueryChange:  onFoodSearchQueryChange,
  });

  const ingredientsTabProps = useIngredientsTabProps({
    ingredients:                entities.ingredients,
    selectedIngredient:         entities.selectedIngredient,
    selectedId,
    setSelectedId,
    pagination:                 pagination.ingredients,
    loading,
    createSuccess:              createFlow.createSuccess,
    openCreateModal:            createFlow.openCreateModal,
    openIngredientUpdateModal:  updateFlow.openIngredientUpdateModal,
    handleDeleteIngredient:     deleteFlow.handleDeleteIngredient,
    loadTabData,
    runProtectedAction,
    buildAllergyAwarenessText,
    searchQuery: foodSearchQuery,
  });

  const recipesTabProps = useRecipesTabProps({
    recipes:               entities.recipes,
    foods:                 entities.foods,
    selectedRecipe:        entities.selectedRecipe,
    selectedId,
    setSelectedId,
    pagination:            pagination.recipes,
    loading,
    createSuccess:         createFlow.createSuccess,
    openCreateModal:       createFlow.openCreateModal,
    openRecipeUpdateModal: updateFlow.openRecipeUpdateModal,
    handleDeleteRecipe:    deleteFlow.handleDeleteRecipe,
    loadTabData,
    runProtectedAction,
    buildAllergyAwarenessText,
    getRecipeSearchableValues,
    searchQuery: foodSearchQuery,
  });

  // NutritionTab props are simple pass-throughs with no auth-guarded actions,
  // so a dedicated hook would add no value — assembled inline.
  const nutritionTabProps = {
    searchQuery:                 foodSearchQuery,
    selectedNutrient,
    setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab:                handleTabSwitch,
    getItemId,
  };

  // ── Dashboard derived data ──────────────────────────────────────────────────

  const totalFoods       = pagination.foods.totalElements       ?? entities.foods.length;
  const totalIngredients = pagination.ingredients.totalElements ?? entities.ingredients.length;
  const totalRecipes     = pagination.recipes.totalElements     ?? entities.recipes.length;

  const recentRecipes = entities.recipes.slice(0, 4);
  const latestFoods   = entities.foods.slice(0, 4);

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabAnimClass = introComplete ? 'tab-content-animate' : undefined;

  return (
      <section className="backend-explorer-scroll">
        {activeTab !== 'dashboard' && (
            <div className="explorer-search-row">
              <input
                  type="search"
                  placeholder={SEARCH_PLACEHOLDERS[activeTab]}
                  value={foodSearchQuery ?? ''}
                  onChange={(event) => onFoodSearchQueryChange?.(event.target.value)}
                  aria-label={SEARCH_PLACEHOLDERS[activeTab]}
              />
            </div>
        )}

        {error && <p className="error">{error}</p>}

        {activeTab === 'dashboard' && (
            <section
                key={`tab-cycle-dashboard-${tabAnimationCycle}`}
                className={introComplete
                    ? 'dashboard-layout tab-content-animate dashboard-layout-animate'
                    : 'dashboard-layout'}
            >
              <p className="development-notice">
                <strong>
                  App under development—update coming soon. All features are currently functional.
                  Please create an account to explore. Hi recruiters: please message me on LinkedIn
                  or via email for login credentials if you prefer not to sign up.
                </strong>
              </p>

              <div className="dashboard-cards">
                <DashboardCard title="Total Foods"  total={totalFoods}       icon={<FoodSummaryIcon       className="icon" />} />
                <DashboardCard title="Ingredients"  total={totalIngredients} icon={<IngredientSummaryIcon className="icon" />} />
                <DashboardCard title="Recipes"      total={totalRecipes}     icon={<RecipeSummaryIcon     className="icon" />} />
              </div>

              <div className="dashboard-lists">
                <article className="dashboard-list-card recent-recipes-card">
                  <h3>Recent Recipes</h3>
                  <ul>
                    {recentRecipes.map((recipe) => (
                        <li key={String(getItemId(recipe))} className="recent-recipe-item">
                    <span className="dashboard-list-icon" aria-hidden>
                      <ChefHatIcon className="icon" />
                    </span>
                          <div className="dashboard-list-content">
                            <strong>{pickRecipeTitle(recipe)}</strong>
                            <span>{recipe.description ?? 'No description available'}</span>
                          </div>
                          <div className="recipe-meta-stack dashboard-warning-stack">
                            <strong className="recipe-version-badge">{pickRecipeVersion(recipe)}</strong>
                            <AllergyWarningToggle
                                variant="dashboard"
                                alertText={buildAllergyAwarenessText(getRecipeSearchableValues(recipe))}
                            />
                          </div>
                        </li>
                    ))}
                    {!recentRecipes.length && <li>No recipes yet.</li>}
                  </ul>
                </article>

                <article className="dashboard-list-card latest-foods-card">
                  <h3>Latest Foods</h3>
                  <ul>
                    {latestFoods.map((food) => (
                        <li key={String(getItemId(food))}>
                          <img
                              src={food.imageUrl ?? 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=60'}
                              alt={food.name ?? 'Food image'}
                          />
                          <div className="dashboard-list-content">
                            <strong>{food.name ?? 'Unnamed food'}</strong>
                            <span>{food.category ?? 'No category'}</span>
                          </div>
                          <div className="latest-food-warning-stack dashboard-warning-stack">
                            <AllergyWarningToggle
                                variant="dashboard"
                                alertText={buildAllergyAwarenessText([
                                  food.name,
                                  food.category,
                                  ...(food.recipes ?? []).map((recipe) => recipe.name),
                                ])}
                            />
                          </div>
                        </li>
                    ))}
                    {!latestFoods.length && <li>No foods yet.</li>}
                  </ul>
                </article>
              </div>
            </section>
        )}

        {activeTab === 'foods' && (
            <div key={`tab-cycle-foods-${tabAnimationCycle}`} className={tabAnimClass}>
              <FoodsTab {...foodsTabProps} />
            </div>
        )}

        {activeTab === 'ingredients' && (
            <div key={`tab-cycle-ingredients-${tabAnimationCycle}`} className={tabAnimClass}>
              <IngredientsTab {...ingredientsTabProps} />
            </div>
        )}

        {activeTab === 'recipes' && (
            <div key={`tab-cycle-recipes-${tabAnimationCycle}`} className={tabAnimClass}>
              <RecipesTab {...recipesTabProps} />
            </div>
        )}

        {activeTab === 'nutrition' && (
            <div key={`tab-cycle-nutrition-${tabAnimationCycle}`} className={tabAnimClass}>
              <NutritionTab {...nutritionTabProps} />
            </div>
        )}

        <CreateEntityModal
            createModal={createFlow.createModal}
            createError={createFlow.createError}
            closeCreateModal={createFlow.closeCreateModal}
            createFood={createFlow.createFood}
            createIngredient={createFlow.createIngredient}
            createRecipe={createFlow.createRecipe}
            foodForm={createFlow.foodForm}
            setFoodForm={createFlow.setFoodForm}
            ingredientForm={createFlow.ingredientForm}
            setIngredientForm={createFlow.setIngredientForm}
            ingredientNutritions={createFlow.ingredientNutritions}
            setIngredientNutritions={createFlow.setIngredientNutritions}
            nutritionDraft={createFlow.nutritionDraft}
            setNutritionDraft={createFlow.setNutritionDraft}
            unitOptions={unitOptions}
            addNutrition={createFlow.addNutrition}
            recipeForm={createFlow.recipeForm}
            setRecipeForm={createFlow.setRecipeForm}
            foods={entities.foods}
            getItemId={getItemId}
            recipeIngredients={createFlow.recipeIngredients}
            setRecipeIngredients={createFlow.setRecipeIngredients}
            ingredients={entities.ingredients}
            recipeIngredientDraft={createFlow.recipeIngredientDraft}
            setRecipeIngredientDraft={createFlow.setRecipeIngredientDraft}
            addRecipeIngredient={createFlow.addRecipeIngredient}
            recipeInstructionDraft={createFlow.recipeInstructionDraft}
            setRecipeInstructionDraft={createFlow.setRecipeInstructionDraft}
            addRecipeInstruction={createFlow.addRecipeInstruction}
            recipeInstructions={createFlow.recipeInstructions}
            setRecipeInstructions={createFlow.setRecipeInstructions}
        />

        <DeleteConfirmModal
            deleteModal={deleteFlow.deleteModal}
            errorMessage={deleteFlow.deleteError}
            onCancel={() => deleteFlow.setDeleteModal({ open: false, message: '', action: null })}
            onConfirm={deleteFlow.confirmDelete}
        />

        <UpdateEntityModal
            updateModal={updateFlow.updateModal}
            errorMessage={updateFlow.updateError}
            setUpdateModal={updateFlow.setUpdateModal}
            unitOptions={unitOptions}
            foods={entities.foods}
            ingredients={entities.ingredients}
            getItemId={getItemId}
            updateNutritionDraft={updateFlow.updateNutritionDraft}
            setUpdateNutritionDraft={updateFlow.setUpdateNutritionDraft}
            addUpdateNutrition={updateFlow.addUpdateNutrition}
            confirmUpdate={updateFlow.confirmUpdate}
        />
      </section>
  );
}