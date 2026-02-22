import { describe, expect, it } from 'vitest';
import { initialUpdateFlowState, updateFlowReducer } from './updateFlowReducer';

describe('updateFlowReducer', () => {
  it('supports updater function for nutrition draft', () => {
    const next = updateFlowReducer(initialUpdateFlowState, {
      type: 'set_update_nutrition_draft',
      value: (prev) => ({ ...prev, value: '42' })
    });

    expect(next.updateNutritionDraft.value).toBe('42');
    expect(next.updateNutritionDraft.nutrient).toBe('CALORIES');
  });

  it('sets delete modal directly', () => {
    const next = updateFlowReducer(initialUpdateFlowState, {
      type: 'set_delete_modal',
      value: { open: true, message: 'Delete?', action: null }
    });

    expect(next.deleteModal.open).toBe(true);
    expect(next.deleteModal.message).toBe('Delete?');
  });

  it('supports updater for update modal', () => {
    const next = updateFlowReducer(initialUpdateFlowState, {
      type: 'set_update_modal',
      value: (prev) => ({ ...prev, open: true, type: 'ingredient', title: 'Edit ingredient' })
    });

    expect(next.updateModal.open).toBe(true);
    expect(next.updateModal.type).toBe('ingredient');
    expect(next.updateModal.title).toBe('Edit ingredient');
  });
});
