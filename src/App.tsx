import { useState } from 'react';
import AuthForm from './components/AuthForm';
import BackendExplorer from './components/BackendExplorer';
import SessionExpiryModal from './components/SessionExpiryModal';
import { useAuth } from './context/useAuth';

export default function App() {
  const {
    isAuthenticated,
    user,
    logout,
    isExpiryWarningOpen,
    secondsToExpiry,
    dismissExpiryWarning,
    extendSession
  } = useAuth();
  const [sessionExtendError, setSessionExtendError] = useState('');
  const [isExtendingSession, setIsExtendingSession] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  async function onExtendSession() {
    setIsExtendingSession(true);
    setSessionExtendError('');

    try {
      await extendSession();
      setSessionExtendError('');
    } catch (error) {
      setSessionExtendError(error instanceof Error ? error.message : 'Unable to extend your session.');
    } finally {
      setIsExtendingSession(false);
    }
  }

  function onDismissSessionWarning() {
    setSessionExtendError('');
    dismissExpiryWarning();
  }

  return (
    <main className="container">
      <header className="auth-header">
        <h1>Cooking App</h1>
        <div className="auth-actions">
          {isAuthenticated ? (
            <>
              <span className="muted">{user?.email || 'Authenticated user'}</span>
              <button onClick={() => void logout()}>Logout</button>
            </>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)}>Sign in</button>
          )}
        </div>
      </header>

      <BackendExplorer isAuthenticated={isAuthenticated} />

      {!isAuthenticated && isAuthModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAuthModalOpen(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="auth-actions">
              <h2 id="auth-modal-title">Sign in or register</h2>
              <button type="button" className="secondary" onClick={() => setIsAuthModalOpen(false)}>
                Close
              </button>
            </div>
            <AuthForm />
          </section>
        </div>
      ) : null}

      <SessionExpiryModal
        isOpen={isAuthenticated && isExpiryWarningOpen}
        secondsToExpiry={secondsToExpiry}
        errorMessage={sessionExtendError}
        isExtending={isExtendingSession}
        onDismiss={onDismissSessionWarning}
        onExtendSession={onExtendSession}
        onLogoutNow={logout}
      />
    </main>
  );
}
