import { useEffect } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import StarRating from '../../components/StarRating/StarRating';
import BookCardCover from './BookCardCover';
import StatusBadge from './StatusBadge';

export default function BookDetailSidebar({ book, onClose, onEdit, onDelete }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!book) return null;

  return (
    <>
      <div className="book-drawer__backdrop" onClick={onClose} />
      <aside className="book-drawer">
        <button className="book-drawer__close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="book-drawer__cover">
          <BookCardCover book={book} size="lg" />
        </div>

        <div className="book-drawer__body">
          <h2 className="book-drawer__title">{book.title}</h2>

          {book.author_name && (
            <p className="book-drawer__author">{book.author_name}</p>
          )}

          <div className="book-drawer__meta">
            <StatusBadge status={book.status} />
            {(book.genre_name || book.genre) && (
              <span className="book-drawer__genre">{book.genre_name || book.genre}</span>
            )}
          </div>

          {book.rating && (
            <div className="book-drawer__rating">
              <StarRating value={book.rating} size="md" />
            </div>
          )}

          {book.note && (
            <div className="book-drawer__note">
              <p className="book-drawer__note-label">Мій відгук</p>
              <p className="book-drawer__note-text">{book.note}</p>
            </div>
          )}
        </div>

        <div className="book-drawer__actions">
          <button className="book-drawer__edit-btn" onClick={() => { onClose(); onEdit(book); }}>
            <Pencil size={15} /> Редагувати
          </button>
          <button className="book-drawer__delete-btn" onClick={() => onDelete(book)}>
            <Trash2 size={15} /> Видалити
          </button>
        </div>
      </aside>
    </>
  );
}
