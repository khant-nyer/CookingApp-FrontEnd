import type { DeleteModalState } from '../types';

interface DeleteConfirmModalProps {
  deleteModal: DeleteModalState;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ deleteModal, onCancel, onConfirm }: DeleteConfirmModalProps) {
  if (!deleteModal.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Confirm delete</h3>
        <p>{deleteModal.message}</p>
        <div className="detail-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
