import { useCallback } from 'react';
import type useBackendExplorerController from './useBackendExplorerController';
import type { Recipe } from '../types';

type ControllerReturn = ReturnType<typeof useBackendExplorerController>;
type ViewState        = ControllerReturn['viewState'];
type CreateFlow       = ControllerReturn['createFlow'];
type UpdateFlow       = ControllerReturn['updateFlow'];
type DeleteFlow       = ControllerReturn['deleteFlow'];
type RecipeEntity     = ControllerReturn['entities']['recipes'][number];

interface UseRecipesTabPropsArgs {
    // Data
    recipes:        ControllerReturn['entities']['recipes'];
    foods:          ControllerReturn['entities']['foods'];
    selectedRecipe: ControllerReturn['entities']['selectedRecipe'];
    selectedId:     ViewState['selectedId'];
    setSelectedId:  ViewState['setSelectedId'];
    pagination:     ViewState['pagination']['recipes'];
    loading:        ViewState['loading'];
    entityLoading:  ViewState['loadingByEntity']['recipes']['loading'];
    createSuccess:  CreateFlow['createSuccess'];

    // Actions (raw, un-guarded)
    openCreateModal:       CreateFlow['openCreateModal'];
    openRecipeUpdateModal: UpdateFlow['openRecipeUpdateModal'];
    handleDeleteRecipe:    DeleteFlow['handleDeleteRecipe'];
    loadTabData:           ViewState['loadTabData'];

    // Cross-cutting concerns
    runProtectedAction:        (action: () => void) => void;
    buildAllergyAwarenessText: (values: Array<string | undefined>) => string | undefined;
    getRecipeSearchableValues: (recipe: Recipe) => Array<string | undefined>;
    searchQuery?:              string;
}

export function useRecipesTabProps({
                                       recipes,
                                       foods,
                                       selectedRecipe,
                                       selectedId,
                                       setSelectedId,
                                       pagination,
                                       loading,
                                       entityLoading,
                                       createSuccess,
                                       openCreateModal,
                                       openRecipeUpdateModal,
                                       handleDeleteRecipe,
                                       loadTabData,
                                       runProtectedAction,
                                       buildAllergyAwarenessText,
                                       getRecipeSearchableValues,
                                       searchQuery,
                                   }: UseRecipesTabPropsArgs) {
    const onOpenCreateModal = useCallback(
        (type: Parameters<CreateFlow['openCreateModal']>[0]) =>
            runProtectedAction(() => openCreateModal(type)),
        [runProtectedAction, openCreateModal],
    );

    const onOpenRecipeUpdateModal = useCallback(
        (recipe: RecipeEntity) => runProtectedAction(() => openRecipeUpdateModal(recipe)),
        [runProtectedAction, openRecipeUpdateModal],
    );

    const onDeleteRecipe = useCallback(
        (recipe: RecipeEntity) => runProtectedAction(() => handleDeleteRecipe(recipe)),
        [runProtectedAction, handleDeleteRecipe],
    );

    const onPageChange = useCallback(
        (page: number) => loadTabData('recipes', page),
        [loadTabData],
    );

    const allergyAlertText = selectedRecipe
        ? buildAllergyAwarenessText(getRecipeSearchableValues(selectedRecipe))
        : undefined;

    return {
        searchQuery,
        recipes,
        foods,
        selectedId,
        setSelectedId,
        selectedRecipe,
        createSuccess,
        openCreateModal:       onOpenCreateModal,
        openRecipeUpdateModal: onOpenRecipeUpdateModal,
        pagination,
        onPageChange,
        loading: entityLoading || loading,
        onDeleteRecipe,
        allergyAlertText,
    };
}