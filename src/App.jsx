import BackendExplorer from './components/BackendExplorer';

export default function App() {
  return (
    <main className="container">
      <h1>Cooking App Frontend</h1>
      <p className="muted">
        Aligned to shared backend controllers: Foods, Ingredients, Recipes (no security/auth yet).
      </p>
      <BackendExplorer />
    </main>
  );
}
