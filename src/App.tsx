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

  return (
    <main className="container">
      <header className="header-row auth-header">
        <div>
          <h1>Cooking App Frontend</h1>
          <p className="muted">Connected to Cognito auth and backend controllers.</p>
        </div>
        {isAuthenticated && (
          <div className="auth-actions">
            <span className="muted">{user?.email || 'Authenticated user'}</span>
            <button onClick={() => void logout()}>Logout</button>
          </div>
        )}
      </header>

      {!isAuthenticated ? <AuthForm /> : <BackendExplorer />}

      <SessionExpiryModal
        isOpen={isAuthenticated && isExpiryWarningOpen}
        secondsToExpiry={secondsToExpiry}
        onDismiss={dismissExpiryWarning}
        onExtendSession={extendSession}
        onLogoutNow={logout}
      />
    </main>
  );
}
