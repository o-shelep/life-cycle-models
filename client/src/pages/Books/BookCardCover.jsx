import { getGenreColor } from './constants';

export default function BookCardCover({ book, size = 'sm' }) {
  const w = size === 'lg' ? 120 : 80;
  const h = size === 'lg' ? 170 : 110;

  if (book.cover_image) {
    return (
      <div
        className={`book-card__cover-img-wrap book-card__cover-img-wrap--${size}`}
        style={{ width: w, height: h }}
      >
        <img
          src={`/uploads/books/${book.cover_image}`}
          alt={book.title}
          className="book-card__cover-img"
        />
      </div>
    );
  }

  const color = getGenreColor(book.genre_name || book.genre || '');
  const letter = book.title ? book.title.trim()[0].toUpperCase() : '?';

  return (
    <div
      className="book-card__cover-placeholder"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, width: w, height: h }}
    >
      <span className="book-card__cover-letter" style={{ fontSize: size === 'lg' ? 52 : 36 }}>
        {letter}
      </span>
    </div>
  );
}
