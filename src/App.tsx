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
    <main className={isAuthenticated ? 'container app-shell-authenticated' : 'container'}>
      {!isAuthenticated ? (
        <>
          <header className="auth-header auth-header-public">
            <h1>Cooking App</h1>
          </header>
          <AuthForm />
        </>
      ) : (
        <BackendExplorer userEmail={user?.email} onLogout={() => void logout()} />
      )}

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
