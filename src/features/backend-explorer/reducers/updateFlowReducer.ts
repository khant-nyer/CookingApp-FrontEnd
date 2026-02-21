import type { UpdateFlowAction, UpdateFlowState } from '../types';

export const initialUpdateFlowState: UpdateFlowState = {
  updateNutritionDraft: { nutrient: 'CALORIES', value: '', unit: 'G' },
  deleteModal: { open: false, message: '', action: null },
  updateModal: { open: false, type: '', title: '', itemId: null, form: null }
};

export function updateFlowReducer(state: UpdateFlowState, action: UpdateFlowAction): UpdateFlowState {
  switch (action.type) {
    case 'set_update_nutrition_draft': {
      const next = typeof action.value === 'function'
        ? action.value(state.updateNutritionDraft)
        : action.value;
      return { ...state, updateNutritionDraft: next };
    }
    case 'set_delete_modal': {
      const next = typeof action.value === 'function'
        ? action.value(state.deleteModal)
        : action.value;
      return { ...state, deleteModal: next };
    }
    case 'set_update_modal': {
      const next = typeof action.value === 'function'
        ? action.value(state.updateModal)
        : action.value;
      return { ...state, updateModal: next };
    }
    default:
      return state;
  }
}
