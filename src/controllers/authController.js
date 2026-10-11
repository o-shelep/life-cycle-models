const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

async function register(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ user: { id: result.insertId, username } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

function me(req, res) {
  res.json({ user: req.user });
}

async function updateMe(req, res, next) {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const fields = [];
    const params = [];

    if (username && username.trim() && username.trim() !== user.username) {
      const [taken] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), user.id]);
      if (taken.length > 0) return res.status(409).json({ message: 'Username already taken' });
      fields.push('username = ?');
      params.push(username.trim());
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      fields.push('password_hash = ?');
      params.push(await bcrypt.hash(newPassword, 10));
    }

    if (fields.length === 0) {
      return res.json({ user: { id: user.id, username: user.username } });
    }

    params.push(user.id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    const newUsername = (username && username.trim()) ? username.trim() : user.username;
    const token = jwt.sign(
      { id: user.id, username: newUsername },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user: { id: user.id, username: newUsername } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, updateMe };
