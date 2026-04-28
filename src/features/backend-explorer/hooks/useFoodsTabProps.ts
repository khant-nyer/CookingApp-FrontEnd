import { useCallback } from 'react';
import { getItemId } from '../utils/ids';
import type useBackendExplorerController from './useBackendExplorerController';

// Derive types directly from the controller so this file never drifts out of sync.
type ControllerReturn = ReturnType<typeof useBackendExplorerController>;
type ViewState        = ControllerReturn['viewState'];
type CreateFlow       = ControllerReturn['createFlow'];
type UpdateFlow       = ControllerReturn['updateFlow'];
type DeleteFlow       = ControllerReturn['deleteFlow'];
type FoodEntity       = ControllerReturn['entities']['foods'][number];

interface UseFoodsTabPropsArgs {
    // Data
    foods:         ControllerReturn['entities']['foods'];
    selectedFood:  ControllerReturn['entities']['selectedFood'];
    selectedId:    ViewState['selectedId'];
    setSelectedId: ViewState['setSelectedId'];
    pagination:    ViewState['pagination']['foods'];
    loading:       ViewState['loading'];
    createSuccess: CreateFlow['createSuccess'];

    // Actions (raw, un-guarded — this hook wraps them with runProtectedAction)
    openCreateModal:     CreateFlow['openCreateModal'];
    openFoodUpdateModal: UpdateFlow['openFoodUpdateModal'];
    handleDeleteFood:    DeleteFlow['handleDeleteFood'];
    loadTabData:         ViewState['loadTabData'];

    // Cross-cutting concerns from the parent
    runProtectedAction:        (action: () => void) => void;
    buildAllergyAwarenessText: (values: Array<string | undefined>) => string | undefined;
    searchQuery?:              string;
    onSearchQueryChange?:      (value: string) => void;
}

export function useFoodsTabProps({
                                     foods,
                                     selectedFood,
                                     selectedId,
                                     setSelectedId,
                                     pagination,
                                     loading,
                                     createSuccess,
                                     openCreateModal,
                                     openFoodUpdateModal,
                                     handleDeleteFood,
                                     loadTabData,
                                     runProtectedAction,
                                     buildAllergyAwarenessText,
                                     searchQuery,
                                     onSearchQueryChange,
                                 }: UseFoodsTabPropsArgs) {
    const onCreateFood = useCallback(
        () => runProtectedAction(() => openCreateModal('food')),
        [runProtectedAction, openCreateModal],
    );

    const onOpenFoodUpdateModal = useCallback(
        (food: FoodEntity) => runProtectedAction(() => openFoodUpdateModal(food)),
        [runProtectedAction, openFoodUpdateModal],
    );

    const onDeleteFood = useCallback(
        (food: FoodEntity) => runProtectedAction(() => handleDeleteFood(food)),
        [runProtectedAction, handleDeleteFood],
    );

    const onPageChange = useCallback(
        (page: number) => loadTabData('foods', page),
        [loadTabData],
    );

    const allergyAlertText = buildAllergyAwarenessText([
        selectedFood?.name,
        selectedFood?.category,
        ...(selectedFood?.recipes ?? []).map((recipe) => recipe.name),
    ]);

    return {
        foods,
        selectedId,
        setSelectedId,
        selectedFood,
        createSuccess,
        openFoodUpdateModal: onOpenFoodUpdateModal,
        getItemId,
        pagination,
        onPageChange,
        loading,
        onDeleteFood,
        onCreateFood,
        searchQuery,
        onSearchQueryChange,
        allergyAlertText,
    };
}