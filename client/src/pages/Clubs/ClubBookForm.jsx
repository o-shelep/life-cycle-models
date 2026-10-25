import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { todayISO } from './constants';

export default function ClubBookForm({ clubId, onSaved, onCancel }) {
  const [mode, setMode] = useState('library');
  const [library, setLibrary] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [form, setForm] = useState({
    source_book_id: '', title: '', author_name: '', genre: '', deadline: '', discussion_date: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/books').then(res => {
      setLibrary(res.data);
      if (res.data.length === 0) setMode('new');
    }).catch(() => {});
    api.get('/authors').then(res => setAuthors(res.data)).catch(() => {});
    api.get('/genres').then(res => setGenres(res.data)).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'library' && !form.source_book_id) { setError('Оберіть книгу зі своєї бібліотеки.'); return; }
    if (mode === 'new' && !form.title.trim()) { setError("Назва книги обов'язкова."); return; }
    if (!form.deadline) { setError('Вкажіть дату завершення читання.'); return; }
    if (form.deadline < todayISO()) { setError('Дата завершення не може бути раніше сьогоднішньої.'); return; }

    const payload = mode === 'library'
      ? { source_book_id: Number(form.source_book_id) }
      : { title: form.title, author_name: form.author_name, genre: form.genre };
    payload.deadline = form.deadline;
    if (form.discussion_date) payload.discussion_date = form.discussion_date;

    setError('');
    setSaving(true);
    try {
      await api.post(`/clubs/${clubId}/books`, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Не вдалося додати книгу.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="club-form" onSubmit={handleSubmit}>
      {error && <div className="club-form__error">{error}</div>}

      <div className="segmented">
        <button type="button" className={mode === 'library' ? 'active' : ''} onClick={() => setMode('library')}>
          З моєї бібліотеки
        </button>
        <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
          Нова книга
        </button>
      </div>

      {mode === 'library' ? (
        <div className="form-group">
          <label>Книга</label>
          <select value={form.source_book_id} onChange={set('source_book_id')}>
            <option value="">Оберіть книгу…</option>
            {library.map(b => (
              <option key={b.id} value={b.id}>{b.title}{b.author_name ? ` (${b.author_name})` : ''}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Назва</label>
            <input type="text" value={form.title} onChange={set('title')} placeholder="напр., Тіні забутих предків" />
          </div>
          <div className="form-group">
            <label>Автор <span className="form-optional">необов'язково</span></label>
            <input type="text" list="club-book-authors" value={form.author_name} onChange={set('author_name')} />
            <datalist id="club-book-authors">
              {authors.map(a => <option key={a.id} value={a.full_name} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label>Жанр <span className="form-optional">необов'язково</span></label>
            <input type="text" list="club-book-genres" value={form.genre} onChange={set('genre')} />
            <datalist id="club-book-genres">
              {genres.map(g => <option key={g.id} value={g.name} />)}
            </datalist>
          </div>
          <p className="club-detail__muted">Нова книга також з'явиться у вашій бібліотеці зі статусом «У планах».</p>
        </>
      )}

      <div className="club-form__row">
        <div className="form-group">
          <label>Дочитати до</label>
          <input type="date" min={todayISO()} value={form.deadline} onChange={set('deadline')} />
        </div>
        <div className="form-group">
          <label>Обговорення <span className="form-optional">необов'язково</span></label>
          <input type="date" min={todayISO()} value={form.discussion_date} onChange={set('discussion_date')} />
        </div>
      </div>

      <div className="club-form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>Відмінити</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Додаємо…' : 'Додати до плану'}
        </button>
      </div>
    </form>
  );
}
