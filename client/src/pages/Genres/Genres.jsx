import { useState, useEffect } from 'react';
import { Pencil, Trash2, Tag } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import './Genres.scss';

export default function Genres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGenre, setEditGenre] = useState(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const res = await api.get('/genres');
      setGenres(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGenres(); }, []);

  const openCreate = () => {
    setEditGenre(null);
    setName('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (genre) => {
    setEditGenre(genre);
    setName(genre.name);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditGenre(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setFormError("Назва жанру обов'язкова."); return; }
    setFormError('');
    setSaving(true);
    try {
      if (editGenre) {
        await api.put(`/genres/${editGenre.id}`, { name: name.trim() });
      } else {
        await api.post('/genres', { name: name.trim() });
      }
      closeModal();
      fetchGenres();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Не вдалося зберегти жанр.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (genre) => {
    if (!window.confirm(`Delete "${genre.name}"?`)) return;
    setDeletingId(genre.id);
    try {
      await api.delete(`/genres/${genre.id}`);
      fetchGenres();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="genres-page">
      <div className="genres-page__header">
        <h1>Жанри</h1>
        <button className="genres-page__add-btn" onClick={openCreate}>
          + Додати жанр
        </button>
      </div>

      <div className="genres-page__content">
        {loading ? (
          <div className="genres-page__loading">Завантажуємо жанри…</div>
        ) : genres.length === 0 ? (
          <div className="genres-page__empty">
            <Tag size={48} className="empty-icon" />
            <h3>Упс! Поки не має жанрів</h3>
            <p>Додайте жанри, щоб краще структурузувати свою бібліотеку.</p>
          </div>
        ) : (
          <div className="genres-page__grid">
            {genres.map(genre => (
              <div key={genre.id} className="genre-card">
                <span className="genre-card__name">{genre.name}</span>
                <div className="genre-card__actions">
                  <button className="genre-card__edit-btn" onClick={() => openEdit(genre)} title="Редагувати">
                    <Pencil size={15} />
                  </button>
                  <button
                    className="genre-card__delete-btn"
                    onClick={() => handleDelete(genre)}
                    disabled={deletingId === genre.id}
                    title="Видалити"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal}
        title={editGenre ? 'Редагувати жанр' : 'Додати новий жанр'}>
        <form className="genre-form" onSubmit={handleSubmit}>
          {formError && <div className="auth-page__error">{formError}</div>}
          <div className="form-group">
            <label>Назва жанру</label>
            <input
              type="text"
              placeholder="напр., Нон-Фікшн"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="genre-form__actions">
            <button type="button" className="btn-cancel" onClick={closeModal}>Відмінити</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Зберігаємо…' : editGenre ? 'Зберегти зміни' : 'Додати жанр'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
