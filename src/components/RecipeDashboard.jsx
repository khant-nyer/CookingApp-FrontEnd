import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const initialRecipe = { title: '', description: '', ingredients: '' };

export default function RecipeDashboard() {
  const { token, user, logout } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(initialRecipe);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadRecipes() {
    try {
      const data = await api.getRecipes(token);
      setRecipes(Array.isArray(data) ? data : data.recipes || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createRecipe(token, {
        title: form.title,
        description: form.description,
        ingredients: form.ingredients
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      });
      setForm(initialRecipe);
      await loadRecipes();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid">
      <div className="card">
        <header className="header-row">
          <h2>{user?.name ? `${user.name}'s recipes` : 'My recipes'}</h2>
          <button onClick={logout}>Logout</button>
        </header>
        {error && <p className="error">{error}</p>}
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id || recipe._id || recipe.title}>
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              {recipe.ingredients?.length ? (
                <small>{Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : recipe.ingredients}</small>
              ) : null}
            </li>
          ))}
          {!recipes.length && <p>No recipes yet.</p>}
        </ul>
      </div>

      <div className="card">
        <h2>Add a recipe</h2>
        <form onSubmit={onSubmit} className="form">
          <label>
            Title
            <input name="title" value={form.title} onChange={onChange} required />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={onChange} rows={4} required />
          </label>
          <label>
            Ingredients (comma separated)
            <input name="ingredients" value={form.ingredients} onChange={onChange} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Create recipe'}
          </button>
        </form>
      </div>
    </section>
  );
}
