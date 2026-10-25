const pool = require('../config/db');

const CLUB_BOOK_STATUSES = ['proposed', 'planned', 'inProgress', 'done'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function checkDate(value, label, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return required ? `${label} is required` : null;
  }
  if (!DATE_RE.test(value) || Number.isNaN(Date.parse(value))) {
    return `${label} must be a valid date (YYYY-MM-DD)`;
  }
  if (value < today()) {
    return `${label} cannot be in the past`;
  }
  return null;
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const SELECT_BOOKS = `
  SELECT cb.*, DATE_FORMAT(cb.deadline, '%Y-%m-%d') AS deadline,
         DATE_FORMAT(cb.discussion_date, '%Y-%m-%d') AS discussion_date,
         u.username AS added_by_name,
         (SELECT COUNT(*) FROM club_reviews r WHERE r.club_book_id = cb.id) AS reviews_count,
         (SELECT ROUND(AVG(r.rating), 1) FROM club_reviews r WHERE r.club_book_id = cb.id) AS average_rating
  FROM club_books cb
  LEFT JOIN users u ON u.id = cb.added_by`;

// Shared reading list with filters by status, genre and deadline range (FR-3, NFR-1).
async function getAll(req, res, next) {
  try {
    const { status, genre, from, to } = req.query;
    let sql = `${SELECT_BOOKS} WHERE cb.club_id = ?`;
    const params = [req.club.id];

    if (status) {
      sql += ' AND cb.status = ?';
      params.push(status);
    } else {
      sql += " AND cb.status <> 'proposed'";
    }
    if (genre) { sql += ' AND cb.genre = ?';     params.push(genre); }
    if (from)  { sql += ' AND cb.deadline >= ?'; params.push(from); }
    if (to)    { sql += ' AND cb.deadline <= ?'; params.push(to); }

    sql += " ORDER BY FIELD(cb.status, 'inProgress', 'planned', 'proposed', 'done'), cb.deadline IS NULL, cb.deadline, cb.created_at";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// Adds a book from the member's own library (source_book_id) or a new one,
// which is also saved to the member's library as "onPlan" (US2).
async function create(req, res, next) {
  const { source_book_id, deadline, discussion_date } = req.body;

  const dateError =
    checkDate(deadline, 'Deadline', { required: true }) ||
    checkDate(discussion_date, 'Discussion date');
  if (dateError) {
    return res.status(400).json({ message: dateError });
  }

  const conn = await pool.getConnection();
  try {
    let book;
    await conn.beginTransaction();

    if (source_book_id) {
      const [rows] = await conn.query(
        'SELECT id, title, author_name, genre FROM books WHERE id = ? AND user_id = ?',
        [source_book_id, req.user.id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Book not found in your library' });
      }
      book = rows[0];
    } else {
      const title = clean(req.body.title);
      if (!title) {
        await conn.rollback();
        return res.status(400).json({ message: 'Title is required' });
      }
      book = { title, author_name: clean(req.body.author_name), genre: clean(req.body.genre) };
      const [result] = await conn.query(
        "INSERT INTO books (user_id, title, author_name, genre, status) VALUES (?, ?, ?, ?, 'onPlan')",
        [req.user.id, book.title, book.author_name, book.genre]
      );
      book.id = result.insertId;
    }

    const [result] = await conn.query(
      `INSERT INTO club_books
         (club_id, source_book_id, added_by, title, author_name, genre, status, deadline, discussion_date)
       VALUES (?, ?, ?, ?, ?, ?, 'inProgress', ?, ?)`,
      [req.club.id, book.id, req.user.id, book.title, book.author_name, book.genre,
        deadline, discussion_date || null]
    );
    await conn.commit();

    const [rows] = await pool.query(`${SELECT_BOOKS} WHERE cb.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// Loads the club book and checks that the caller is its author or an owner/moderator.
async function findEditable(req, res) {
  const [rows] = await pool.query('SELECT * FROM club_books WHERE id = ? AND club_id = ?', [
    req.params.bookId,
    req.club.id,
  ]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'Book not found in this club' });
    return null;
  }
  const isManager = ['owner', 'moderator'].includes(req.membership.role);
  if (!isManager && rows[0].added_by !== req.user.id) {
    res.status(403).json({ message: 'Only the member who added the book or a moderator can change it' });
    return null;
  }
  return rows[0];
}

async function update(req, res, next) {
  try {
    const book = await findEditable(req, res);
    if (!book) return;

    const { status, deadline, discussion_date } = req.body;
    if (status !== undefined && !CLUB_BOOK_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const dateError =
      (deadline !== undefined && checkDate(deadline, 'Deadline', { required: true })) ||
      (discussion_date !== undefined && checkDate(discussion_date, 'Discussion date'));
    if (dateError) {
      return res.status(400).json({ message: dateError });
    }

    await pool.query(
      'UPDATE club_books SET status = ?, deadline = ?, discussion_date = ? WHERE id = ?',
      [
        status ?? book.status,
        deadline ?? book.deadline,
        discussion_date === undefined ? book.discussion_date : discussion_date || null,
        book.id,
      ]
    );
    const [rows] = await pool.query(`${SELECT_BOOKS} WHERE cb.id = ?`, [book.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const book = await findEditable(req, res);
    if (!book) return;
    await pool.query('DELETE FROM club_books WHERE id = ?', [book.id]);
    res.json({ message: 'Book removed from the club list' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove, checkDate, SELECT_BOOKS, CLUB_BOOK_STATUSES };
