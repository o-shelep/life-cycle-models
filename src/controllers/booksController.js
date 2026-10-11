const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const VALID_STATUSES = ['onPlan', 'inProgress', 'read'];

function deleteFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '../../uploads/books', filename);
  fs.unlink(filePath, () => {});
}

async function getAll(req, res, next) {
  try {
    const { status, search, genre } = req.query;
    const userId = req.user.id;

    let sql = 'SELECT * FROM books WHERE user_id = ?';
    const params = [userId];

    if (status) { sql += ' AND status = ?';   params.push(status); }
    if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
    if (genre)  { sql += ' AND genre = ?';    params.push(genre); }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM books WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, author_name, genre, status, rating, note } = req.body;
    const cover_image = req.file ? req.file.filename : null;
    const userId = req.user.id;

    if (!title || !title.trim()) {
      if (cover_image) deleteFile(cover_image);
      return res.status(400).json({ message: 'Title is required' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      if (cover_image) deleteFile(cover_image);
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (rating !== undefined && rating !== null && rating !== '') {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        if (cover_image) deleteFile(cover_image);
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      }
    }

    const cleanAuthor = author_name?.trim() || null;
    if (cleanAuthor) {
      await pool.query(
        'INSERT IGNORE INTO authors (full_name, user_id) VALUES (?, ?)',
        [cleanAuthor, userId]
      );
    }

    const [result] = await pool.query(
      'INSERT INTO books (title, author_name, genre, status, rating, cover_image, note, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title.trim(),
        cleanAuthor,
        genre || null,
        status || 'onPlan',
        rating ? Number(rating) : null,
        cover_image,
        note?.trim() || null,
        userId,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const [existing] = await pool.query(
      'SELECT * FROM books WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author_name, genre, status, rating, note } = req.body;
    const newCover = req.file ? req.file.filename : undefined;

    if (status && !VALID_STATUSES.includes(status)) {
      if (newCover) deleteFile(newCover);
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (rating !== undefined && rating !== null && rating !== '') {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        if (newCover) deleteFile(newCover);
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      }
    }

    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title.trim()); }
    if (author_name !== undefined) {
      const cleanAuthor = author_name?.trim() || null;
      if (cleanAuthor) {
        await pool.query(
          'INSERT IGNORE INTO authors (full_name, user_id) VALUES (?, ?)',
          [cleanAuthor, req.user.id]
        );
      }
      fields.push('author_name = ?');
      params.push(cleanAuthor);
    }
    if (genre !== undefined)    { fields.push('genre = ?');   params.push(genre || null); }
    if (status !== undefined)   { fields.push('status = ?');  params.push(status); }
    if (rating !== undefined)   { fields.push('rating = ?');  params.push(rating ? Number(rating) : null); }
    if (note !== undefined)     { fields.push('note = ?');    params.push(note?.trim() || null); }
    if (newCover !== undefined) { fields.push('cover_image = ?'); params.push(newCover); }

    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

    params.push(req.params.id, req.user.id);
    await pool.query(`UPDATE books SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params);

    if (newCover && existing[0].cover_image) deleteFile(existing[0].cover_image);

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const [existing] = await pool.query(
      'SELECT cover_image FROM books WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ message: 'Book not found' });

    await pool.query('DELETE FROM books WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing[0].cover_image) deleteFile(existing[0].cover_image);

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
