import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { unitOptions } from '../features/backend-explorer/constants/units';
import useBackendExplorerController from '../features/backend-explorer/hooks/useBackendExplorerController';
import { getItemId } from '../features/backend-explorer/utils/ids';
import { iconAssets } from './iconAssets';
import CreateEntityModal from '../features/backend-explorer/modals/CreateEntityModal';
import DeleteConfirmModal from '../features/backend-explorer/modals/DeleteConfirmModal';
import UpdateEntityModal from '../features/backend-explorer/modals/UpdateEntityModal';
import FoodsTab from '../features/backend-explorer/tabs/FoodsTab';
import IngredientsTab from '../features/backend-explorer/tabs/IngredientsTab';
import NutritionTab from '../features/backend-explorer/tabs/NutritionTab';
import RecipesTab from '../features/backend-explorer/tabs/RecipesTab';
import type { EntityType, Food, Ingredient, Recipe, TabKey } from '../features/backend-explorer/types';
import { AllergyWarningToggle } from '../features/backend-explorer/shared/ExplorerShared';

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

function ChefHatIcon({ className }: IconProps) {
  return <ImageIcon src={iconAssets.recipe} fallbackSrc={iconAssets.recipeSummaryFallback} className={className} />;
}

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

function FoodSummaryAnimatedIcon({ className }: IconProps) {
  return <ImageIcon src={iconAssets.foodSummaryAnimated} fallbackSrc={iconAssets.foodSummaryFallback} className={className} />;
}

function IngredientSummaryAnimatedIcon({ className }: IconProps) {
  return <ImageIcon src={iconAssets.ingredientSummaryAnimated} fallbackSrc={iconAssets.ingredientSummaryFallback} className={className} />;
}

function RecipeSummaryAnimatedIcon({ className }: IconProps) {
  return <ImageIcon src={iconAssets.recipeSummaryAnimated} fallbackSrc={iconAssets.recipeSummaryFallback} className={className} />;
}

function pickRecipeTitle(recipe: Recipe) {
  if (recipe.foodName) return recipe.foodName;
  if (recipe.description) return recipe.description.split(/[.!?]/)[0];
  return 'Untitled recipe';
}

function pickRecipeVersion(recipe: Recipe) {
  if (recipe.version && String(recipe.version).trim()) return String(recipe.version).trim();
  return 'N/A';
}

interface BackendExplorerProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  foodSearchQuery?: string;
  onFoodSearchQueryChange?: (value: string) => void;
  userAllergies?: string[];
}

export default function BackendExplorer({
  isAuthenticated,
  onRequireAuth,
  activeTab: externalActiveTab,
  onTabChange,
  foodSearchQuery,
  onFoodSearchQueryChange,
  userAllergies
}: BackendExplorerProps) {
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
    pagination
  } = viewState;

  const handleDeleteCancel = useCallback(() => {
    deleteFlow.setDeleteModal({ open: false, message: '', action: null });
  }, [deleteFlow]);

  const runProtectedAction = useCallback((action: () => void) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    action();
  }, [isAuthenticated, onRequireAuth]);

  const activeTab = externalActiveTab ?? controllerActiveTab;
  const normalizedAllergies = useMemo(() => {
    return (userAllergies || [])
      .map((allergy) => allergy.trim().toLowerCase())
      .filter(Boolean);
  }, [userAllergies]);

  const buildAllergyAwarenessText = useCallback((searchableValues: Array<string | undefined>) => {
    if (!normalizedAllergies.length) return undefined;
    const searchableText = searchableValues
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
    if (!searchableText.trim()) return undefined;
    const matchedAllergies = normalizedAllergies.filter((allergy) => searchableText.includes(allergy));
    if (!matchedAllergies.length) return undefined;
    return `Allergy awareness: contains ${Array.from(new Set(matchedAllergies)).join(', ')}`;
  }, [normalizedAllergies]);

  const handleTabSwitch = useCallback((tab: TabKey) => {
    if (onTabChange) {
      onTabChange(tab);
      return;
    }
    setActiveTab(tab);
  }, [onTabChange, setActiveTab]);

  const foodsTabProps = useMemo(() => ({
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedFood: entities.selectedFood,
    createSuccess: createFlow.createSuccess,
    openFoodUpdateModal: (food: Food) => runProtectedAction(() => updateFlow.openFoodUpdateModal(food)),
    getItemId,
    pagination: pagination.foods,
    onPageChange: (page: number) => loadTabData('foods', page),
    loading,
    onDeleteFood: (food: Food) => runProtectedAction(() => deleteFlow.handleDeleteFood(food)),
    onCreateFood: () => runProtectedAction(() => createFlow.openCreateModal('food')),
    searchQuery: foodSearchQuery,
    onSearchQueryChange: onFoodSearchQueryChange,
    allergyAlertText: buildAllergyAwarenessText([
      entities.selectedFood?.name,
      entities.selectedFood?.category,
      ...(entities.selectedFood?.recipes || []).map((recipe) => recipe.name)
    ])
  }), [entities.foods, selectedId, setSelectedId, entities.selectedFood, pagination.foods, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, createFlow, foodSearchQuery, onFoodSearchQueryChange, buildAllergyAwarenessText]);

  const ingredientsTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    ingredients: entities.ingredients,
    selectedId,
    setSelectedId,
    selectedIngredient: entities.selectedIngredient,
    createSuccess: createFlow.createSuccess,
    openCreateModal: (type: EntityType) => runProtectedAction(() => createFlow.openCreateModal(type)),
    openIngredientUpdateModal: (ingredient: Ingredient) => runProtectedAction(() => updateFlow.openIngredientUpdateModal(ingredient)),
    getItemId,
    pagination: pagination.ingredients,
    onPageChange: (page: number) => loadTabData('ingredients', page),
    loading,
    onDeleteIngredient: (ingredient: Ingredient) => runProtectedAction(() => deleteFlow.handleDeleteIngredient(ingredient)),
    allergyAlertText: buildAllergyAwarenessText([
      entities.selectedIngredient?.name,
      entities.selectedIngredient?.category,
      entities.selectedIngredient?.description
    ])
  }), [foodSearchQuery, entities.ingredients, selectedId, setSelectedId, entities.selectedIngredient, createFlow, pagination.ingredients, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, buildAllergyAwarenessText]);

  const recipesTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    recipes: entities.recipes,
    foods: entities.foods,
    selectedId,
    setSelectedId,
    selectedRecipe: entities.selectedRecipe,
    createSuccess: createFlow.createSuccess,
    openCreateModal: (type: EntityType) => runProtectedAction(() => createFlow.openCreateModal(type)),
    openRecipeUpdateModal: (recipe: Recipe) => runProtectedAction(() => updateFlow.openRecipeUpdateModal(recipe)),
    pagination: pagination.recipes,
    onPageChange: (page: number) => loadTabData('recipes', page),
    loading,
    onDeleteRecipe: (recipe: Recipe) => runProtectedAction(() => deleteFlow.handleDeleteRecipe(recipe)),
    allergyAlertText: buildAllergyAwarenessText([
      entities.selectedRecipe?.foodName,
      entities.selectedRecipe?.description,
      ...(entities.selectedRecipe?.ingredients || []).map((ingredient) => ingredient.ingredientName || String(ingredient.ingredientId))
    ])
  }), [foodSearchQuery, entities.recipes, entities.foods, selectedId, setSelectedId, entities.selectedRecipe, createFlow, pagination.recipes, loadTabData, loading, runProtectedAction, deleteFlow, updateFlow, buildAllergyAwarenessText]);

  const nutritionTabProps = useMemo(() => ({
    searchQuery: foodSearchQuery,
    selectedNutrient,
    setSelectedNutrient,
    nutrientFilteredIngredients: entities.nutrientFilteredIngredients,
    setActiveTab: handleTabSwitch,
    getItemId
  }), [foodSearchQuery, selectedNutrient, setSelectedNutrient, entities.nutrientFilteredIngredients, handleTabSwitch]);

  const totalFoods = pagination.foods.totalElements || entities.foods.length;
  const totalIngredients = pagination.ingredients.totalElements || entities.ingredients.length;
  const totalRecipes = pagination.recipes.totalElements || entities.recipes.length;

  const recentRecipes = entities.recipes.slice(0, 4);
  const latestFoods = entities.foods.slice(0, 4);
  const searchPlaceholder = activeTab === 'foods'
    ? 'Search foods by name, category, or creator'
    : activeTab === 'ingredients'
      ? 'Search ingredients by name, category, or description'
      : activeTab === 'recipes'
        ? 'Search recipes by food, version, or description'
        : 'Search nutrient ingredients by name or category';

  return (
    <section className="backend-explorer-scroll">
      {activeTab !== 'dashboard' ? (
        <div className="explorer-search-row">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={foodSearchQuery || ''}
            onChange={(event) => onFoodSearchQueryChange?.(event.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}
      {error && <p className="error">{error}</p>}

      {activeTab === 'dashboard' ? (
        <section className="dashboard-layout">
          <p className="development-notice"><strong>App under development—update coming soon. All features are currently functional. Please create an account to explore. Hi recruiters: please message me on LinkedIn or via email for login credentials if you prefer not to sign up.</strong></p>
          <div className="dashboard-cards">
            <DashboardCard title="Total Foods" total={totalFoods} icon={<FoodSummaryAnimatedIcon className="icon" />} />
            <DashboardCard title="Ingredients" total={totalIngredients} icon={<IngredientSummaryAnimatedIcon className="icon" />} />
            <DashboardCard title="Recipes" total={totalRecipes} icon={<RecipeSummaryAnimatedIcon className="icon" />} />
          </div>

          <div className="dashboard-lists">
            <article className="dashboard-list-card">
              <h3>Recent Recipes</h3>
              <ul>
                {recentRecipes.map((recipe) => (
                  <li key={String(getItemId(recipe))}>
                    <span className="dashboard-list-icon" aria-hidden>
                      <ChefHatIcon className="icon" />
                    </span>
                    <div>
                      <strong>{pickRecipeTitle(recipe)}</strong>
                      <span>{recipe.description || 'No description available'}</span>
                    </div>
                    <div className="recipe-meta-stack">
                      <strong className="recipe-version-badge">{pickRecipeVersion(recipe)}</strong>
                      <AllergyWarningToggle
                        variant="dashboard"
                        alertText={buildAllergyAwarenessText([
                          recipe.foodName,
                          recipe.description,
                          ...(recipe.ingredients || []).map((ingredient) => ingredient.ingredientName || String(ingredient.ingredientId))
                        ])}
                      />
                    </div>
                  </li>
                ))}
                {!recentRecipes.length && <li>No recipes yet.</li>}
              </ul>
            </article>

            <article className="dashboard-list-card">
              <h3>Latest Foods</h3>
              <ul>
                {latestFoods.map((food) => (
                  <li key={String(getItemId(food))}>
                    <img
                      src={food.imageUrl || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=60'}
                      alt={food.name || 'Food image'}
                    />
                    <div>
                      <strong>{food.name || 'Unnamed food'}</strong>
                      <span>{food.category || 'No category'}</span>
                    </div>
                    <AllergyWarningToggle
                      variant="dashboard"
                      alertText={buildAllergyAwarenessText([
                        food.name,
                        food.category,
                        ...(food.recipes || []).map((recipe) => recipe.name)
                      ])}
                    />
                  </li>
                ))}
                {!latestFoods.length && <li>No foods yet.</li>}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'foods' && <FoodsTab {...foodsTabProps} />}

      {activeTab === 'ingredients' && <IngredientsTab {...ingredientsTabProps} />}

      {activeTab === 'recipes' && <RecipesTab {...recipesTabProps} />}

      {activeTab === 'nutrition' && <NutritionTab {...nutritionTabProps} />}

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
        onCancel={handleDeleteCancel}
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
