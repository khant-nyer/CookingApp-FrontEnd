export default function DeleteConfirmModal({ deleteModal, onCancel, onConfirm }) {
  if (!deleteModal.open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Confirm Delete</h3>
        <p>{deleteModal.message}</p>
        <div className="detail-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
