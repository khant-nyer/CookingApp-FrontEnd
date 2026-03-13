interface SessionExpiryModalProps {
  isOpen: boolean;
  secondsToExpiry: number;
  onDismiss: () => void;
  onExtendSession: () => Promise<void>;
  onLogoutNow: () => Promise<void>;
}

function formatExpiryCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SessionExpiryModal({
  isOpen,
  secondsToExpiry,
  onDismiss,
  onExtendSession,
  onLogoutNow
}: SessionExpiryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="session-expiry-title">
        <h3 id="session-expiry-title">Session expiring soon</h3>
        <p>Your session is about to expire in {formatExpiryCountdown(secondsToExpiry)}.</p>

        <div className="detail-actions">
          <button type="button" className="secondary" onClick={() => void onDismiss()}>
            Dismiss
          </button>
          <button type="button" className="danger" onClick={() => void onLogoutNow()}>
            Log out now
          </button>
          <button type="button" onClick={() => void onExtendSession()}>
            Extend session
          </button>
        </div>
      </section>
    </div>
  );
}
