import { useState, useEffect, useCallback } from 'react';
import { Search, Library, X } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import { STATUS_FILTERS, EMPTY_FORM } from './constants';
import BookCard from './BookCard';
import BookDetailSidebar from './BookDetailSidebar';
import BookForm from './BookForm';
import './Books.scss';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailBook, setDetailBook] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => {
    api.get('/genres').then(res => setGenres(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditBook(null);
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({
      title: book.title || '',
      author_name: book.author_name || '',
      genre: book.genre_name || book.genre || '',
      status: book.status || 'onPlan',
      rating: book.rating || null,
      note: book.note || '',
    });
    setCoverFile(null);
    setCoverPreview(book.cover_image ? `/uploads/books/${book.cover_image}` : null);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditBook(null);
    setForm(EMPTY_FORM);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleFormChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleStatusChange = (s) => {
    setForm(prev => ({ ...prev, status: s, rating: s !== 'read' ? null : prev.rating }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    setFormError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('status', form.status);
      if (form.rating != null) fd.append('rating', form.rating);
      if (form.author_name.trim()) fd.append('author_name', form.author_name.trim());
      if (form.genre) fd.append('genre', form.genre);
      if (form.note.trim()) fd.append('note', form.note.trim());
      if (coverFile) fd.append('cover_image', coverFile);

      if (editBook) {
        await api.put(`/books/${editBook.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      closeModal();
      fetchBooks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Не вдалося додати книжку.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    setDeletingId(book.id);
    setDetailBook(null);
    try {
      await api.delete(`/books/${book.id}`);
      fetchBooks();
    } catch { /* ignore */ } finally { setDeletingId(null); }
  };

  return (
    <div className="books-page">
      <div className="books-page__header">
        <h1 className="books-page__title">Моя бібліотека</h1>
        <div className="books-page__controls">
          <div className="books-page__search">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Шукати…" value={search}
              onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} title="Очистити">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="books-page__filters">
            {STATUS_FILTERS.map(f => (
              <button key={f.value}
                className={`books-page__filter-btn${statusFilter === f.value ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
          <button className="books-page__add-btn" onClick={openCreate}>+ Додати книжку</button>
        </div>
      </div>

      <div className="books-page__content">
        {loading ? (
          <div className="books-page__loading">Завантажуємо вашу бібліотеку…</div>
        ) : books.length === 0 ? (
          <div className="books-page__empty">
            <Library size={48} className="empty-icon" />
            <h3>Упс! Ми не знайшли жодної книги</h3>
            <p>{search || statusFilter ? 'Спробуйте переналадити фільтри.' : 'Додайте свою першу книжку, щоб розпочати!'}</p>
          </div>
        ) : (
          <div className="books-page__grid">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                deletingId={deletingId}
                onSelect={setDetailBook}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {detailBook && (
        <BookDetailSidebar
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal isOpen={modalOpen} onClose={closeModal}
        title={editBook ? 'Редагувати книжку' : 'Додати книжку'}>
        <BookForm
          form={form}
          genres={genres}
          coverPreview={coverPreview}
          formError={formError}
          saving={saving}
          isEdit={!!editBook}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          onChange={handleFormChange}
          onStatusChange={handleStatusChange}
          onFileChange={handleFileChange}
        />
      </Modal>
    </div>
  );
}
