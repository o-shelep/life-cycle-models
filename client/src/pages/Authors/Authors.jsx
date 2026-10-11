import { useState, useEffect } from 'react';
import { Pencil, Trash2, PenLine } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import './Authors.scss';

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAuthor, setEditAuthor] = useState(null);
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/authors');
      setAuthors(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuthors(); }, []);

  const openCreate = () => {
    setEditAuthor(null);
    setFullName('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (author) => {
    setEditAuthor(author);
    setFullName(author.full_name);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditAuthor(null);
    setFullName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError("Повне ім'я обов'язкове");
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      if (editAuthor) {
        await api.put(`/authors/${editAuthor.id}`, { full_name: fullName.trim() });
      } else {
        await api.post('/authors', { full_name: fullName.trim() });
      }
      closeModal();
      fetchAuthors();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Не вдалось зберегти автора.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author) => {
    if (!window.confirm(`Delete "${author.full_name}"?`)) return;
    setDeletingId(author.id);
    try {
      await api.delete(`/authors/${author.id}`);
      fetchAuthors();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="authors-page">
      <div className="authors-page__header">
        <h1>Автори</h1>
        <button className="authors-page__add-btn" onClick={openCreate}>
          + Додати Автора
        </button>
      </div>

      <div className="authors-page__content">
        {loading ? (
          <div className="authors-page__loading">Завантажуємо авторів…</div>
        ) : authors.length === 0 ? (
          <div className="authors-page__empty">
            <PenLine size={48} className="empty-icon" />
            <h3>Поки немає авторів</h3>
            <p>Додайте авторів, щоб краще організувати свою бібліотеку.</p>
          </div>
        ) : (
          <div className="authors-page__list">
            {authors.map(author => (
              <div key={author.id} className="author-card">
                <div className="author-card__avatar">
                  {getInitials(author.full_name)}
                </div>
                <span className="author-card__name">{author.full_name}</span>
                <div className="author-card__actions">
                  <button
                    className="edit-btn"
                    onClick={() => openEdit(author)}
                    title="Редагувати автора"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(author)}
                    disabled={deletingId === author.id}
                    title="Видалити автора"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editAuthor ? 'Редагувати автора' : 'Додати нового автора'}
      >
        <form className="author-form" onSubmit={handleSubmit}>
          {formError && (
            <div className="auth-page__error">{formError}</div>
          )}

          <div className="form-group">
            <label>Повне ім'я</label>
            <input
              type="text"
              placeholder="Повне ім'я автора"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="author-form__actions">
            <button type="button" className="btn-cancel" onClick={closeModal}>
              Відмінити
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Зберігаємо…' : editAuthor ? 'Зберегти зміни' : 'Додати автора'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
