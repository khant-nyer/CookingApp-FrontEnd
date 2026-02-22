import { describe, expect, it } from 'vitest';
import { createFlowReducer, initialCreateFlowState } from './createFlowReducer';

describe('createFlowReducer', () => {
  it('opens modal and clears error/success for selected entity', () => {
    const starting = {
      ...initialCreateFlowState,
      createError: 'some error',
      createSuccess: { ...initialCreateFlowState.createSuccess, ingredient: 'old message' }
    };

    const next = createFlowReducer(starting, { type: 'open_create_modal', entityType: 'ingredient' });

    expect(next.createModal).toEqual({ open: true, type: 'ingredient' });
    expect(next.createError).toBe('');
    expect(next.createSuccess.ingredient).toBe('');
  });

  it('sets create success per entity without mutating others', () => {
    const next = createFlowReducer(initialCreateFlowState, {
      type: 'set_create_success',
      entityType: 'recipe',
      message: 'Recipe created'
    });

    expect(next.createSuccess.recipe).toBe('Recipe created');
    expect(next.createSuccess.food).toBe('');
    expect(next.createSuccess.ingredient).toBe('');
  });

  it('closes modal and clears error', () => {
    const openState = createFlowReducer(initialCreateFlowState, {
      type: 'open_create_modal',
      entityType: 'food'
    });
    const errored = createFlowReducer(openState, {
      type: 'set_create_error',
      message: 'Boom'
    });

    const closed = createFlowReducer(errored, { type: 'close_create_modal' });

    expect(closed.createModal).toEqual({ open: false, type: '' });
    expect(closed.createError).toBe('');
  });
});
