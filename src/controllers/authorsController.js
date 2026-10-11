const pool = require('../config/db');

async function getAll(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM authors WHERE user_id = ? ORDER BY full_name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM authors WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Author not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { full_name } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'full_name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO authors (full_name, user_id) VALUES (?, ?)',
      [full_name.trim(), req.user.id]
    );

    res.status(201).json({ id: result.insertId, full_name: full_name.trim() });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { full_name } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'full_name is required' });
    }

    const [result] = await pool.query(
      'UPDATE authors SET full_name = ? WHERE id = ? AND user_id = ?',
      [full_name.trim(), req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Author not found' });
    res.json({ id: Number(req.params.id), full_name: full_name.trim() });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'DELETE FROM authors WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Author not found' });
    res.json({ message: 'Author deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove };
