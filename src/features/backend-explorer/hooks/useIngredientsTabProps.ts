import { useCallback } from 'react';
import { getItemId } from '../utils/ids';
import { formatNutrientLabel } from '../utils/nutrients';
import type useBackendExplorerController from './useBackendExplorerController';

type ControllerReturn    = ReturnType<typeof useBackendExplorerController>;
type ViewState           = ControllerReturn['viewState'];
type CreateFlow          = ControllerReturn['createFlow'];
type UpdateFlow          = ControllerReturn['updateFlow'];
type DeleteFlow          = ControllerReturn['deleteFlow'];
type IngredientEntity    = ControllerReturn['entities']['ingredients'][number];

interface UseIngredientsTabPropsArgs {
    // Data
    ingredients:         ControllerReturn['entities']['ingredients'];
    selectedIngredient:  ControllerReturn['entities']['selectedIngredient'];
    selectedId:          ViewState['selectedId'];
    setSelectedId:       ViewState['setSelectedId'];
    pagination:          ViewState['pagination']['ingredients'];
    loading:             ViewState['loading'];
    createSuccess:       CreateFlow['createSuccess'];

    // Actions (raw, un-guarded)
    openCreateModal:            CreateFlow['openCreateModal'];
    openIngredientUpdateModal:  UpdateFlow['openIngredientUpdateModal'];
    handleDeleteIngredient:     DeleteFlow['handleDeleteIngredient'];
    loadTabData:                ViewState['loadTabData'];

    // Cross-cutting concerns
    runProtectedAction:        (action: () => void) => void;
    buildAllergyAwarenessText: (values: Array<string | undefined>) => string | undefined;
    searchQuery?:              string;
}

export function useIngredientsTabProps({
                                           ingredients,
                                           selectedIngredient,
                                           selectedId,
                                           setSelectedId,
                                           pagination,
                                           loading,
                                           createSuccess,
                                           openCreateModal,
                                           openIngredientUpdateModal,
                                           handleDeleteIngredient,
                                           loadTabData,
                                           runProtectedAction,
                                           buildAllergyAwarenessText,
                                           searchQuery,
                                       }: UseIngredientsTabPropsArgs) {
    const onOpenCreateModal = useCallback(
        (type: Parameters<CreateFlow['openCreateModal']>[0]) =>
            runProtectedAction(() => openCreateModal(type)),
        [runProtectedAction, openCreateModal],
    );

    const onOpenIngredientUpdateModal = useCallback(
        (ingredient: IngredientEntity) =>
            runProtectedAction(() => openIngredientUpdateModal(ingredient)),
        [runProtectedAction, openIngredientUpdateModal],
    );

    const onDeleteIngredient = useCallback(
        (ingredient: IngredientEntity) =>
            runProtectedAction(() => handleDeleteIngredient(ingredient)),
        [runProtectedAction, handleDeleteIngredient],
    );

    const onPageChange = useCallback(
        (page: number) => loadTabData('ingredients', page),
        [loadTabData],
    );

    const allergyAlertText = buildAllergyAwarenessText([
        selectedIngredient?.name,
        selectedIngredient?.category,
        selectedIngredient?.description,
        ...(selectedIngredient?.nutritionList ?? []).flatMap((nutrition) => [
            nutrition.nutrient,
            formatNutrientLabel(nutrition.nutrient),
        ]),
    ]);

    return {
        searchQuery,
        ingredients,
        selectedId,
        setSelectedId,
        selectedIngredient,
        createSuccess,
        openCreateModal:           onOpenCreateModal,
        openIngredientUpdateModal: onOpenIngredientUpdateModal,
        getItemId,
        pagination,
        onPageChange,
        loading,
        onDeleteIngredient,
        allergyAlertText,
    };
}