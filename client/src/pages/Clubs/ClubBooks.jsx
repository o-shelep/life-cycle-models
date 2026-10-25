import { useState, useEffect, useCallback } from 'react';
import { BookOpen, CalendarDays, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import ClubBookForm from './ClubBookForm';
import { CLUB_BOOK_STATUSES, CLUB_BOOK_FILTERS, formatDate, todayISO } from './constants';

export default function ClubBooks({ club }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [until, setUntil] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { user } = useAuth();
  const canManage = ['owner', 'moderator'].includes(club.my_role);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await api.get(`/clubs/${club.id}/books`, {
        params: { status: status || undefined, to: until || undefined },
      });
      setBooks(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [club.id, status, until]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const changeStatus = async (book, value) => {
    await api.put(`/clubs/${club.id}/books/${book.id}`, { status: value });
    fetchBooks();
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Прибрати "${book.title}" зі списку клубу?`)) return;
    await api.delete(`/clubs/${club.id}/books/${book.id}`);
    fetchBooks();
  };

  return (
    <section className="club-section club-books">
      <div className="club-section__head">
        <h2>Спільне читання</h2>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>+ Додати книгу</button>
      </div>

      <div className="club-books__filters">
        <div className="segmented">
          {CLUB_BOOK_FILTERS.map(f => (
            <button key={f.value} type="button" className={status === f.value ? 'active' : ''} onClick={() => setStatus(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="club-books__until">
          Дедлайн до
          <input type="date" value={until} onChange={e => setUntil(e.target.value)} />
        </label>
      </div>

      {loading ? (
        <p className="club-detail__muted">Завантажуємо список…</p>
      ) : books.length === 0 ? (
        <div className="club-books__empty">
          <BookOpen size={32} />
          <p>У списку поки немає книг. Додайте першу, щоб усі знали графік читання.</p>
        </div>
      ) : (
        <ul className="club-books__list">
          {books.map(book => {
            const editable = canManage || book.added_by === user?.id;
            const overdue = book.status === 'inProgress' && book.deadline && book.deadline < todayISO();
            return (
              <li key={book.id} className="club-book">
                <div className="club-book__main">
                  <span className="club-book__title">{book.title}</span>
                  <span className="club-book__meta">
                    {[book.author_name, book.genre].filter(Boolean).join(' · ')}
                    {book.added_by_name && ` · додав(ла) ${book.added_by_name}`}
                  </span>
                </div>
                <div className="club-book__dates">
                  {book.deadline && (
                    <span className={overdue ? 'club-book__overdue' : ''}>
                      <CalendarDays size={13} /> до {formatDate(book.deadline)}
                    </span>
                  )}
                  {book.discussion_date && <span>обговорення {formatDate(book.discussion_date)}</span>}
                </div>
                <div className="club-book__actions">
                  {editable ? (
                    <select value={book.status} onChange={e => changeStatus(book, e.target.value)}>
                      {Object.entries(CLUB_BOOK_STATUSES).filter(([v]) => v !== 'proposed').map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`club-status club-status--${book.status}`}>{CLUB_BOOK_STATUSES[book.status]}</span>
                  )}
                  {editable && (
                    <button className="icon-btn icon-btn--danger" title="Прибрати зі списку" onClick={() => handleDelete(book)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Додати книгу до спільного читання">
        <ClubBookForm
          clubId={club.id}
          onSaved={() => { setModalOpen(false); fetchBooks(); }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </section>
  );
}
