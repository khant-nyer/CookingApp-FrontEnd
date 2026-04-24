import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';

interface SettingsPageProps {
  id?: number;
  userName: string;
  email: string;
  cognitoSub?: string;
  role?: string;
  profileImageUrl?: string;
  allergies?: string[];
  accountStatus?: string;
}

export default function SettingsPage({
  userName,
  email,
  cognitoSub,
  accountStatus,
  role,
  id,
  profileImageUrl,
  allergies: initialAllergies = []
}: SettingsPageProps) {
  const { refreshCurrentUser } = useAuth();
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>(initialAllergies);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setAllergies(initialAllergies);
  }, [initialAllergies]);

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

  async function saveChanges() {
    if (!id || !cognitoSub || !email || !userName || !role) {
      setSaveSuccess('');
      setSaveError('Missing required user profile fields. Please sign in again.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      await api.updateCurrentUser({
        allergies,
        cognitoSub,
        email,
        id,
        profileImageUrl: profileImageUrl || null,
        role,
        userName
      });
      await refreshCurrentUser();
      setSaveSuccess('Settings saved successfully.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
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
          {profileImageUrl ? (
            <label>
              Profile image
              <div className="settings-readonly">
                <img src={profileImageUrl} alt={`${userName} profile`} width={56} height={56} />
              </div>
            </label>
          ) : null}
          <label>
            Email Address
            <div className="settings-readonly">✉️ {email}</div>
          </label>
          <label>
            Account Status
            <div className="settings-readonly">{accountStatus || 'N/A'}</div>
          </label>
          <label>
            Role
            <div className="settings-readonly">{role || 'N/A'}</div>
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
              <button key={allergy} type="button" className="settings-allergy-pill" onClick={() => removeAllergy(allergy)}>
                {allergy} ×
              </button>
            ))}
          </div>
        ) : (
          <p className="muted"><em>No allergies listed.</em></p>
        )}
      </article>

      {saveError ? <p className="error">{saveError}</p> : null}
      {saveSuccess ? <p className="success">{saveSuccess}</p> : null}

      <div className="settings-save-row">
        <button type="button" onClick={() => void saveChanges()} disabled={isSaving}>
          {isSaving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </section>
  );
}
