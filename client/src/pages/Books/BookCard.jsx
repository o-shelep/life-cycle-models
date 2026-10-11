import { Pencil, Trash2 } from 'lucide-react';
import StarRating from '../../components/StarRating/StarRating';
import BookCardCover from './BookCardCover';
import StatusBadge from './StatusBadge';

export default function BookCard({ book, deletingId, onSelect, onEdit, onDelete }) {
  return (
    <div className="book-card" onClick={() => onSelect(book)}>
      <div className="book-card__cover">
        <BookCardCover book={book} />
      </div>

      <div className="book-card__info">
        <div className="book-card__title">{book.title}</div>
        {book.author_name && <div className="book-card__author">{book.author_name}</div>}
        {(book.genre_name || book.genre) && (
          <div className="book-card__genre">{book.genre_name || book.genre}</div>
        )}
      </div>

      <div className="book-card__footer">
        <StatusBadge status={book.status} />
        {book.rating && <StarRating value={book.rating} size="sm" />}
      </div>

      <div className="book-card__actions" onClick={e => e.stopPropagation()}>
        <button className="book-card__edit-btn" onClick={() => onEdit(book)} title="Edit">
          <Pencil size={13} /> Редагувати
        </button>
        <button
          className="book-card__delete-btn"
          onClick={() => onDelete(book)}
          disabled={deletingId === book.id}
          title="Видалити"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
