import { useState } from 'react';

const EMPTY = { name: '', description: '', rules: '', type: 'open' };

export default function ClubForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 3 || name.length > 100) {
      setError('Назва клубу має містити від 3 до 100 символів.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ ...form, name });
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Клуб з такою назвою вже існує. Оберіть іншу назву.');
      } else {
        setError(err.response?.data?.message || 'Не вдалося зберегти клуб.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="club-form" onSubmit={handleSubmit}>
      {error && <div className="club-form__error">{error}</div>}
      <div className="form-group">
        <label>Назва клубу</label>
        <input
          type="text"
          placeholder="напр., Любителі фантастики"
          value={form.name}
          onChange={set('name')}
          maxLength={100}
          autoFocus
        />
      </div>
      <div className="form-group">
        <label>Опис <span className="form-optional">необов'язково</span></label>
        <textarea rows={3} value={form.description || ''} onChange={set('description')} />
      </div>
      <div className="form-group">
        <label>Правила участі <span className="form-optional">необов'язково</span></label>
        <textarea rows={3} value={form.rules || ''} onChange={set('rules')} />
      </div>
      <div className="form-group">
        <label>Тип клубу</label>
        <select value={form.type} onChange={set('type')}>
          <option value="open">Відкритий: будь-хто може приєднатися</option>
          <option value="closed">Закритий: вступ за запитом або запрошенням</option>
        </select>
      </div>
      <div className="club-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Відмінити</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Зберігаємо…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
