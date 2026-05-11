import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AuthForm from './components/AuthForm';
import BackendExplorer from './components/BackendExplorer';
import { iconAssets } from './components/iconAssets';
import SettingsPage from './components/SettingsPage';
import SessionExpiryModal from './components/SessionExpiryModal';
import { useAuth } from './context/useAuth';
import type { TabKey } from './features/backend-explorer/types';

interface IconProps {
  className?: string;
}

const STARTUP_ICON_SOURCE = 'https://cdn-icons-gif.flaticon.com/15578/15578744.gif';
const INTRO_PLAYED_STORAGE_KEY = 'cooking-app-intro-played';
const ACTIVE_TAB_STORAGE_KEY = 'cooking-app-active-tab';
const INTRO_DURATION_MS = 3500;
type IntroStage = 'splash' | 'zoom' | 'done';

function MenuIcon({ className }: IconProps) {
  return <img src={iconAssets.menuChefHat} alt="" className={className} aria-hidden />;
}

function GridIcon({ className }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function BowlIcon({ className }: IconProps) {
  return <img src={iconAssets.food} alt="" className={className} aria-hidden />;
}

function UtensilsIcon({ className }: IconProps) {
  return <img src={iconAssets.ingredient} alt="" className={className} aria-hidden />;
}

function ChefHatIcon({ className }: IconProps) {
  return <img src={iconAssets.recipe} alt="" className={className} aria-hidden />;
}

function FlaskIcon({ className }: IconProps) {
  return <img src={iconAssets.nutrition} alt="" className={className} aria-hidden />;
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

const pageHeaderByTab: Record<TabKey, string> = {
  dashboard: 'Cooking Application',
  foods: 'Food Menu',
  ingredients: 'Ingredient Inventory',
  recipes: 'Recipe Master',
  nutrition: 'Nutrition Lab'
};

type AppTabKey = TabKey | 'settings';
const appTabKeys: AppTabKey[] = ['dashboard', 'foods', 'ingredients', 'recipes', 'nutrition', 'settings'];

const pageSubheaderByTab: Record<AppTabKey, string> = {
  dashboard: "Welcome back. Here's what's cooking today.",
  foods: 'Browse and manage food categories and items.',
  ingredients: 'Track your ingredient stock and details.',
  recipes: 'Create and maintain your recipe collection.',
  nutrition: 'Analyze nutrients and ingredient nutrition data.',
  settings: 'Manage your profile and preference settings.'
};

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

  const brandIconRef = useRef<HTMLButtonElement>(null);
  const [introStage, setIntroStage] = useState<IntroStage>(() => {
    if (typeof window === 'undefined') return 'splash';
    return window.sessionStorage.getItem(INTRO_PLAYED_STORAGE_KEY) === 'true' ? 'done' : 'splash';
  });
  const [introTargetRect, setIntroTargetRect] = useState({ top: 24, left: 24, width: 48, height: 48 });
  const [sessionExtendError, setSessionExtendError] = useState('');
  const [isExtendingSession, setIsExtendingSession] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 980px)').matches : false));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 980px)').matches : false));
  const [activeTab, setActiveTab] = useState<AppTabKey>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const storedTab = window.sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return appTabKeys.includes(storedTab as AppTabKey) ? (storedTab as AppTabKey) : 'dashboard';
  });
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const sidebarTitle = user?.name || user?.email?.split('@')[0] || 'Username';
  const pageHeader = activeTab === 'settings' ? 'Settings' : pageHeaderByTab[activeTab];
  const isIntroComplete = introStage === 'done';

  const captureIntroTarget = useCallback(() => {
    if (typeof window === 'undefined') return;
    const rect = brandIconRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIntroTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, []);

  useLayoutEffect(() => {
    captureIntroTarget();
  }, [captureIntroTarget]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 980px)');

    const updateMobileLayout = (event?: MediaQueryListEvent) => {
      const matches = event ? event.matches : mediaQuery.matches;
      setIsMobileView(matches);
      if (matches) setIsSidebarCollapsed(true);
      captureIntroTarget();
    };

    updateMobileLayout();
    window.addEventListener('resize', captureIntroTarget);
    mediaQuery.addEventListener('change', updateMobileLayout);

    return () => {
      window.removeEventListener('resize', captureIntroTarget);
      mediaQuery.removeEventListener('change', updateMobileLayout);
    };
  }, [captureIntroTarget]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined' || introStage !== 'splash') return;
    const introTimer = window.setTimeout(() => {
      captureIntroTarget();
      setIntroStage('zoom');
    }, INTRO_DURATION_MS);
    return () => window.clearTimeout(introTimer);
  }, [captureIntroTarget, introStage]);

  function onSkipIntro() {
    captureIntroTarget();
    setIntroStage('zoom');
  }

  function finishIntro() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(INTRO_PLAYED_STORAGE_KEY, 'true');
    }
    setIntroStage('done');
  }

  async function onExtendSession() {
    setIsExtendingSession(true);
    setSessionExtendError('');

    try {
      await extendSession();
      dismissExpiryWarning();
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

  async function onLogout() {
    await logout();
    setIsLogoutConfirmOpen(false);
  }

  function openLogoutConfirm() {
    setIsLogoutConfirmOpen(true);
  }

  function collapseSidebarOnMainTouch() {
    if (isMobileView && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
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
          <span className="brand-title">{sidebarTitle}</span>
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
                onClick={() => {
                  setActiveTab(tab.key);
                  setFoodSearchQuery('');
                  if (isMobileView) setIsSidebarCollapsed(true);
                }}
              >
                <Icon className="icon" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className={activeTab === 'settings' ? 'sidebar-link active' : 'sidebar-link'}
            onClick={() => {
              setActiveTab('settings');
              if (isMobileView) setIsSidebarCollapsed(true);
            }}
          >
            <SettingsIcon className="icon" />
            <span>Settings</span>
          </button>

          {isAuthenticated ? (
            <button type="button" className="sidebar-link logout-link" onClick={openLogoutConfirm}>
              <LogoutIcon className="icon" />
              <span>Log out</span>
            </button>
          ) : (
            <button type="button" className="sidebar-link" onClick={() => setIsAuthModalOpen(true)}>
              <LoginIcon className="icon" />
              <span>Log in</span>
            </button>
          )}

        </div>
      </aside>

      <section className="content-shell" onPointerDown={collapseSidebarOnMainTouch}>
        <header className="page-header">
          <h1>{pageHeader}</h1>
          <p className="page-subheader">{pageSubheaderByTab[activeTab]}</p>
        </header>

        {activeTab === 'settings' ? (
          <SettingsPage
            id={user?.id}
            userName={user?.userName || user?.name || user?.email?.split('@')[0] || 'Chef User'}
            email={user?.email || 'chef@example.com'}
            cognitoSub={user?.cognitoSub}
            accountStatus={user?.accountStatus}
            role={user?.role}
            profileImageUrl={user?.profileImageUrl}
            allergies={user?.allergies}
          />
        ) : (
          isIntroComplete ? (
            <BackendExplorer
              isAuthenticated={isAuthenticated}
              onRequireAuth={() => setIsAuthModalOpen(true)}
              introComplete={isIntroComplete}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setFoodSearchQuery('');
                if (isMobileView) setIsSidebarCollapsed(true);
              }}
              foodSearchQuery={foodSearchQuery}
              onFoodSearchQueryChange={setFoodSearchQuery}
              userAllergies={user?.allergies}
            />
          ) : null
        )}
      </section>

      {!isIntroComplete ? (
        <motion.div
          className="startup-splash"
          initial={false}
          animate={introStage === 'splash' ? {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            boxShadow: '0 0 0 rgba(0,0,0,0)'
          } : {
            top: introTargetRect.top,
            left: introTargetRect.left,
            width: introTargetRect.width,
            height: introTargetRect.height,
            borderRadius: 14,
            boxShadow: '0 16px 30px rgba(0,0,0,0.26)'
          }}
          transition={introStage === 'zoom'
            ? { type: 'spring', stiffness: 170, damping: 18, mass: 0.85 }
            : { duration: 0.01 }}
          onAnimationComplete={() => {
            if (introStage === 'zoom') finishIntro();
          }}
          aria-hidden
        >
          <motion.img
            className="startup-animation"
            src={STARTUP_ICON_SOURCE}
            alt=""
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.85, 1, 0.96, 1], opacity: 1 }}
            transition={{ duration: 1.1, times: [0, 0.45, 0.8, 1], ease: 'easeInOut' }}
          />
          {introStage === 'splash' ? (
            <button type="button" className="startup-skip" onClick={onSkipIntro}>Skip intro</button>
          ) : null}
        </motion.div>
      ) : null}

      {!isAuthenticated && isAuthModalOpen ? (
        <div className="modal-backdrop" role="presentation">
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
        onLogoutNow={onLogout}
      />

      {isLogoutConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsLogoutConfirmOpen(false)}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="logout-success-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="logout-success-title">Confirm log out</h2>
            <p>Are you sure you want to log out?</p>
            <div className="detail-actions">
              <button type="button" className="cancel-btn" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</button>
              <button type="button" className="danger" onClick={() => void onLogout()}>Log out</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
