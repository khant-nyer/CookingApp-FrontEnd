import { useState } from 'react';

interface SettingsPageProps {
  userName: string;
  email: string;
}

export default function SettingsPage({ userName, email }: SettingsPageProps) {
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);

  function addAllergy() {
    const value = allergyInput.trim();
    if (!value) return;
    if (allergies.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setAllergyInput('');
      return;
    }
    setAllergies((prev) => [...prev, value]);
    setAllergyInput('');
  }

  function removeAllergy(allergy: string) {
    setAllergies((prev) => prev.filter((item) => item !== allergy));
  }

  return (
    <section className="settings-layout">
      <article className="settings-card">
        <h2>👤 Profile Information</h2>
        <div className="settings-fields">
          <label>
            Username
            <div className="settings-readonly">👤 {userName}</div>
          </label>
          <label>
            Email Address
            <div className="settings-readonly">✉️ {email}</div>
          </label>
          <label className="settings-password-row">
            Password
            <button type="button" className="settings-secondary-btn">🔒 Update Password</button>
          </label>
        </div>
      </article>

      <article className="settings-card">
        <h2>🛡️ Allergies & Restrictions</h2>
        <p className="settings-helper">⚠️ Food Allergies & Restrictions</p>
        <p className="muted">Add ingredients or categories you are allergic to (e.g. &quot;Seafood&quot;, &quot;Salmon&quot;, &quot;Dairy&quot;).</p>
        <div className="settings-allergy-row">
          <input
            value={allergyInput}
            onChange={(event) => setAllergyInput(event.target.value)}
            placeholder="Type an allergy and click Add..."
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addAllergy();
              }
            }}
          />
          <button type="button" onClick={addAllergy}>＋ Add</button>
        </div>
        {allergies.length ? (
          <div className="settings-allergy-list">
            {allergies.map((allergy) => (
              <button key={allergy} type="button" className="chip" onClick={() => removeAllergy(allergy)}>
                {allergy} ×
              </button>
            ))}
          </div>
        ) : (
          <p className="muted"><em>No allergies listed.</em></p>
        )}
      </article>

      <div className="settings-save-row">
        <button type="button">💾 Save Changes</button>
      </div>
    </section>
  );
}
