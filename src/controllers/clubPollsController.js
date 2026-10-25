const pool = require('../config/db');

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

// Polls with their candidate books, live vote counts and the caller's own vote (US3).
async function getAll(req, res, next) {
  try {
    const [polls] = await pool.query(
      `SELECT p.*, u.username AS created_by_name,
              (SELECT club_book_id FROM book_votes v WHERE v.poll_id = p.id AND v.user_id = ?) AS my_vote,
              (SELECT COUNT(*) FROM book_votes v WHERE v.poll_id = p.id) AS total_votes
       FROM club_polls p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.club_id = ?
       ORDER BY p.status = 'open' DESC, p.created_at DESC`,
      [req.user.id, req.club.id]
    );
    if (polls.length === 0) return res.json([]);

    const [options] = await pool.query(
      `SELECT cb.id, cb.poll_id, cb.title, cb.author_name, cb.genre, cb.status,
              u.username AS added_by_name, COUNT(v.user_id) AS votes
       FROM club_books cb
       LEFT JOIN users u ON u.id = cb.added_by
       LEFT JOIN book_votes v ON v.club_book_id = cb.id
       WHERE cb.poll_id IN (?)
       GROUP BY cb.id
       ORDER BY votes DESC, cb.created_at`,
      [polls.map(p => p.id)]
    );

    res.json(polls.map(p => ({ ...p, options: options.filter(o => o.poll_id === p.id) })));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const title = clean(req.body.title) || 'Книга місяця';
    const [open] = await pool.query(
      "SELECT id FROM club_polls WHERE club_id = ? AND status = 'open'",
      [req.club.id]
    );
    if (open.length > 0) {
      return res.status(409).json({ message: 'The club already has an open poll. Close it first' });
    }
    const [result] = await pool.query(
      'INSERT INTO club_polls (club_id, title, created_by) VALUES (?, ?, ?)',
      [req.club.id, title, req.user.id]
    );
    res.status(201).json({ id: result.insertId, club_id: req.club.id, title, status: 'open', options: [] });
  } catch (err) {
    next(err);
  }
}

async function findOpenPoll(req, res) {
  const [rows] = await pool.query('SELECT * FROM club_polls WHERE id = ? AND club_id = ?', [
    req.params.pollId,
    req.club.id,
  ]);
  if (rows.length === 0) {
    res.status(404).json({ message: 'Poll not found' });
    return null;
  }
  if (rows[0].status !== 'open') {
    res.status(400).json({ message: 'This poll is already closed' });
    return null;
  }
  return rows[0];
}

// Any member can propose a candidate: a book from their library or just a title.
async function propose(req, res, next) {
  try {
    const poll = await findOpenPoll(req, res);
    if (!poll) return;

    let book;
    if (req.body.source_book_id) {
      const [rows] = await pool.query(
        'SELECT id, title, author_name, genre FROM books WHERE id = ? AND user_id = ?',
        [req.body.source_book_id, req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Book not found in your library' });
      }
      book = rows[0];
    } else {
      const title = clean(req.body.title);
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      book = { id: null, title, author_name: clean(req.body.author_name), genre: clean(req.body.genre) };
    }

    const [dupes] = await pool.query(
      'SELECT id FROM club_books WHERE poll_id = ? AND LOWER(title) = LOWER(?)',
      [poll.id, book.title]
    );
    if (dupes.length > 0) {
      return res.status(409).json({ message: 'This book is already among the candidates' });
    }

    const [result] = await pool.query(
      `INSERT INTO club_books (club_id, source_book_id, poll_id, added_by, title, author_name, genre, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed')`,
      [req.club.id, book.id, poll.id, req.user.id, book.title, book.author_name, book.genre]
    );
    res.status(201).json({
      ...book,
      id: result.insertId,
      source_book_id: book.id,
      poll_id: poll.id,
      status: 'proposed',
      votes: 0,
    });
  } catch (err) {
    next(err);
  }
}

// One vote per member per poll, enforced by the (poll_id, user_id) primary key.
async function vote(req, res, next) {
  try {
    const poll = await findOpenPoll(req, res);
    if (!poll) return;

    const [options] = await pool.query(
      'SELECT id FROM club_books WHERE id = ? AND poll_id = ?',
      [req.body.club_book_id, poll.id]
    );
    if (options.length === 0) {
      return res.status(404).json({ message: 'This book is not a candidate in the poll' });
    }

    await pool.query('INSERT INTO book_votes (poll_id, user_id, club_book_id) VALUES (?, ?, ?)', [
      poll.id,
      req.user.id,
      options[0].id,
    ]);
    res.status(201).json({ message: 'Vote accepted', my_vote: options[0].id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already voted in this poll' });
    }
    next(err);
  }
}

// Closing picks the book with most votes (earliest proposal wins a tie) and plans it for reading.
async function close(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [polls] = await conn.query(
      'SELECT * FROM club_polls WHERE id = ? AND club_id = ? FOR UPDATE',
      [req.params.pollId, req.club.id]
    );
    if (polls.length === 0 || polls[0].status !== 'open') {
      await conn.rollback();
      return res.status(polls.length === 0 ? 404 : 400).json({
        message: polls.length === 0 ? 'Poll not found' : 'This poll is already closed',
      });
    }

    const [ranked] = await conn.query(
      `SELECT cb.id, cb.title, COUNT(v.user_id) AS votes
       FROM club_books cb
       LEFT JOIN book_votes v ON v.club_book_id = cb.id
       WHERE cb.poll_id = ?
       GROUP BY cb.id
       ORDER BY votes DESC, cb.created_at, cb.id
       LIMIT 1`,
      [polls[0].id]
    );
    const winner = ranked[0] && ranked[0].votes > 0 ? ranked[0] : null;

    await conn.query("UPDATE club_polls SET status = 'closed', closed_at = NOW() WHERE id = ?", [polls[0].id]);
    if (winner) {
      await conn.query("UPDATE club_books SET status = 'planned' WHERE id = ?", [winner.id]);
    }
    await conn.commit();

    res.json({
      message: winner ? `"${winner.title}" is planned for reading` : 'Poll closed without votes',
      winner,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { getAll, create, propose, vote, close };
