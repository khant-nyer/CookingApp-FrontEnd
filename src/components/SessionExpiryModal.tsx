import { formatExpiryCountdown } from './sessionExpiryUtils';

interface SessionExpiryModalProps {
  isOpen: boolean;
  secondsToExpiry: number;
  errorMessage: string;
  isExtending: boolean;
  onDismiss: () => void;
  onExtendSession: () => Promise<void>;
  onLogoutNow: () => Promise<void>;
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
