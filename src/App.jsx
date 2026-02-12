import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import RecipeDashboard from './components/RecipeDashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="container">
      <h1>Cooking App</h1>
      <p className="muted">Frontend scaffold for the CookingApp backend.</p>
      {isAuthenticated ? <RecipeDashboard /> : <AuthForm />}
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
