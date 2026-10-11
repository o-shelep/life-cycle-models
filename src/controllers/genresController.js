const pool = require('../config/db');

async function getAll(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM genres WHERE user_id = ? ORDER BY name',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO genres (name, user_id) VALUES (?, ?)',
      [name.trim(), req.user.id]
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Genre already exists' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required' });
    }
    const [result] = await pool.query(
      'UPDATE genres SET name = ? WHERE id = ? AND user_id = ?',
      [name.trim(), req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Genre not found' });
    }
    res.json({ id: Number(req.params.id), name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Genre already exists' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const [result] = await pool.query(
      'DELETE FROM genres WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Genre not found' });
    }
    res.json({ message: 'Genre deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
