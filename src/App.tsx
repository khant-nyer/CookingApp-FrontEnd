import { useState } from 'react';
import type { ReactNode } from 'react';
import AuthForm from './components/AuthForm';
import BackendExplorer from './components/BackendExplorer';
import SessionExpiryModal from './components/SessionExpiryModal';
import { useAuth } from './context/useAuth';
import type { TabKey } from './features/backend-explorer/types';

interface IconProps {
  className?: string;
}

function MenuIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
}

function ChefHatIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6.8 10.2A4.5 4.5 0 0 1 8 2a5.8 5.8 0 0 1 4 1.7A5.8 5.8 0 0 1 16 2a4.5 4.5 0 0 1 1.2 8.2" /><path d="M4 10h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" /><line x1="7" y1="20" x2="17" y2="20" /></svg>;
}

function GridIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function BowlIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 13h16a8 8 0 0 1-16 0z" /><path d="M9 9c.4-1.3 1.4-2.2 3-2.5" /><path d="M14.5 7c1 .1 1.8.6 2.3 1.6" /><line x1="12" y1="3" x2="12" y2="6" /></svg>;
}

function UtensilsIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 3v7a3 3 0 0 0 3 3v8" /><path d="M7 3v7" /><path d="M10 3v7" /><path d="M15 3l5 5-3 3-5-5" /><path d="M13 11l-3 3" /><path d="M17 14l4 4" /></svg>;
}

function FlaskIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 2v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8V2" /><path d="M8 13h8" /></svg>;
}

function LogoutIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}

function LoginIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
}

function SettingsIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" /></svg>;
}

const sidebarTabs: Array<{ key: TabKey; label: string; icon: (props: IconProps) => ReactNode }> = [
  { key: 'dashboard', label: 'Dashboard', icon: GridIcon },
  { key: 'foods', label: 'Foods', icon: BowlIcon },
  { key: 'ingredients', label: 'Ingredients', icon: UtensilsIcon },
  { key: 'recipes', label: 'Recipes', icon: ChefHatIcon },
  { key: 'nutrition', label: 'Nutrition', icon: FlaskIcon }
];

export default function App() {
  const {
    isAuthenticated,
    logout,
    isExpiryWarningOpen,
    secondsToExpiry,
    dismissExpiryWarning,
    extendSession
  } = useAuth();

  const [sessionExtendError, setSessionExtendError] = useState('');
  const [isExtendingSession, setIsExtendingSession] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

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
    <main className="app-shell">
      <aside className={isSidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
        <div className="sidebar-head">
          <button
            type="button"
            className="brand-icon"
            aria-label="Toggle sidebar"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          >
            <MenuIcon className="icon" />
          </button>
          <span className="brand-title">Culina</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {sidebarTabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={`${tab.label}-${index}`}
                type="button"
                className={isActive ? 'sidebar-link active' : 'sidebar-link'}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon className="icon" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {isAuthenticated ? (
            <button type="button" className="sidebar-link" onClick={() => void logout()}>
              <LogoutIcon className="icon" />
              <span>Log out</span>
            </button>
          ) : (
            <button type="button" className="sidebar-link" onClick={() => setIsAuthModalOpen(true)}>
              <LoginIcon className="icon" />
              <span>Log in</span>
            </button>
          )}

          <button type="button" className="sidebar-link muted-link">
            <SettingsIcon className="icon" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <section className="content-shell">
        <header className="page-header">
          <h1>Cooking Application</h1>
          <p><strong>This application is still under development, update is coming soon</strong></p>
        </header>

        <BackendExplorer
          isAuthenticated={isAuthenticated}
          onRequireAuth={() => setIsAuthModalOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </section>

      {!isAuthenticated && isAuthModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAuthModalOpen(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close-icon" aria-label="Close sign in modal" onClick={() => setIsAuthModalOpen(false)}>×</button>
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
