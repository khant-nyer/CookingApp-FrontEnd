import type { CreateFlowAction, CreateFlowState } from '../types';

export const initialCreateFlowState: CreateFlowState = {
  createModal: { open: false, type: '' },
  createError: '',
  createSuccess: { food: '', ingredient: '', recipe: '' }
};

export function createFlowReducer(state: CreateFlowState, action: CreateFlowAction): CreateFlowState {
  switch (action.type) {
    case 'open_create_modal':
      return {
        ...state,
        createError: '',
        createSuccess: { ...state.createSuccess, [action.entityType]: '' },
        createModal: { open: true, type: action.entityType }
      };
    case 'close_create_modal':
      return {
        ...state,
        createError: '',
        createModal: { open: false, type: '' }
      };
    case 'set_create_error':
      return { ...state, createError: action.message || '' };
    case 'set_create_success':
      return {
        ...state,
        createSuccess: { ...state.createSuccess, [action.entityType]: action.message || '' }
      };
    default:
      return state;
  }
}
