const pool = require('../config/db');

async function findBook(req, res) {
  const [rows] = await pool.query(
    "SELECT * FROM club_books WHERE id = ? AND club_id = ? AND status <> 'proposed'",
    [req.params.bookId, req.club.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ message: 'Book not found in this club' });
    return null;
  }
  return rows[0];
}

// Reviews of one club book with the average rating (FR-5).
async function getAll(req, res, next) {
  try {
    const book = await findBook(req, res);
    if (!book) return;

    const [reviews] = await pool.query(
      `SELECT r.id, r.user_id, u.username, r.rating, r.review, r.created_at, r.updated_at
       FROM club_reviews r JOIN users u ON u.id = r.user_id
       WHERE r.club_book_id = ?
       ORDER BY r.updated_at DESC`,
      [book.id]
    );
    const rated = reviews.filter(r => r.rating);
    const average = rated.length
      ? Math.round((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length) * 10) / 10
      : null;

    res.json({ book_id: book.id, average_rating: average, reviews });
  } catch (err) {
    next(err);
  }
}

// One review per member per book: posting again updates it.
async function upsert(req, res, next) {
  try {
    const book = await findBook(req, res);
    if (!book) return;

    const rating = req.body.rating === undefined || req.body.rating === null || req.body.rating === ''
      ? null
      : Number(req.body.rating);
    const review = typeof req.body.review === 'string' && req.body.review.trim() ? req.body.review.trim() : null;

    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }
    if (rating === null && review === null) {
      return res.status(400).json({ message: 'Add a rating or a review' });
    }

    await pool.query(
      `INSERT INTO club_reviews (club_id, club_book_id, user_id, rating, review)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review)`,
      [req.club.id, book.id, req.user.id, rating, review]
    );
    const [rows] = await pool.query(
      `SELECT r.id, r.user_id, u.username, r.rating, r.review, r.created_at, r.updated_at
       FROM club_reviews r JOIN users u ON u.id = r.user_id
       WHERE r.club_book_id = ? AND r.user_id = ?`,
      [book.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Authors delete their own review, owners and moderators can remove any.
async function remove(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM club_reviews WHERE id = ? AND club_id = ? AND club_book_id = ?',
      [req.params.reviewId, req.club.id, req.params.bookId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    const isManager = ['owner', 'moderator'].includes(req.membership.role);
    if (!isManager && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can delete only your own review' });
    }
    await pool.query('DELETE FROM club_reviews WHERE id = ?', [rows[0].id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, upsert, remove };
