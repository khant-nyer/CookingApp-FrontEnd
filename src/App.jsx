import RecipeDashboard from './components/RecipeDashboard';

export default function App() {
  return (
    <main className="container">
      <h1>Cooking App</h1>
      <p className="muted">Open recipe board (security/auth temporarily removed).</p>
      <RecipeDashboard />
    </main>
  );
}
