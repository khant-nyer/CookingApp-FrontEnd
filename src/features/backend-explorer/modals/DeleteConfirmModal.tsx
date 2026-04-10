import { memo } from 'react';
import type { DeleteModalState } from '../types';

interface DeleteConfirmModalProps {
  deleteModal: DeleteModalState;
  errorMessage: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ deleteModal, errorMessage, onCancel, onConfirm }: DeleteConfirmModalProps) {
  if (!deleteModal.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Confirm delete</h3>
        <p>{deleteModal.message}</p>
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
        <div className="detail-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default memo(DeleteConfirmModal);
