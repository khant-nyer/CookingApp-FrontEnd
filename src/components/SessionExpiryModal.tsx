interface SessionExpiryModalProps {
  isOpen: boolean;
  secondsToExpiry: number;
  errorMessage: string;
  isExtending: boolean;
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
  errorMessage,
  isExtending,
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
        {errorMessage && <p className="error">{errorMessage}</p>}

        <div className="detail-actions">
          <button type="button" className="secondary" onClick={() => void onDismiss()} disabled={isExtending}>
            Dismiss
          </button>
          <button type="button" className="danger" onClick={() => void onLogoutNow()} disabled={isExtending}>
            Log out now
          </button>
          <button type="button" onClick={() => void onExtendSession()} disabled={isExtending}>
            {isExtending ? 'Extending…' : 'Extend session'}
          </button>
        </div>
      </section>
    </div>
  );
}
