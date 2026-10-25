const pool = require('../config/db');
const { validateClub } = require('../validators/clubValidator');

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function getAll(req, res, next) {
  try {
    const { search, mine } = req.query;
    let sql = `
      SELECT c.id, c.name, c.description, c.type, c.owner_id, c.created_at,
             u.username AS owner_name,
             (SELECT COUNT(*) FROM club_members cm
               WHERE cm.club_id = c.id AND cm.status = 'active') AS members_count,
             me.role AS my_role, me.status AS my_status
      FROM clubs c
      JOIN users u ON u.id = c.owner_id
      LEFT JOIN club_members me ON me.club_id = c.id AND me.user_id = ?
      WHERE 1 = 1`;
    const params = [req.user.id];

    if (search) {
      sql += ' AND c.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (mine === 'true') {
      sql += " AND me.status = 'active'";
    }
    sql += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const club = req.club;
    const isMember = req.membership?.status === 'active';
    const [owner] = await pool.query('SELECT username FROM users WHERE id = ?', [club.owner_id]);

    let members = [];
    if (isMember || club.type === 'open') {
      [members] = await pool.query(
        `SELECT cm.user_id, u.username, cm.role, cm.joined_at
         FROM club_members cm JOIN users u ON u.id = cm.user_id
         WHERE cm.club_id = ? AND cm.status = 'active'
         ORDER BY FIELD(cm.role, 'owner', 'moderator', 'member'), u.username`,
        [club.id]
      );
    }

    res.json({
      ...club,
      owner_name: owner[0]?.username,
      members,
      my_role: req.membership?.role || null,
      my_status: req.membership?.status || null,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const errors = validateClub(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const conn = await pool.getConnection();
  try {
    const name = req.body.name.trim();
    const type = req.body.type || 'open';
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO clubs (owner_id, name, description, rules, type) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, clean(req.body.description), clean(req.body.rules), type]
    );
    await conn.query(
      `INSERT INTO club_members (club_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'owner', 'active', NOW())`,
      [result.insertId, req.user.id]
    );
    await conn.commit();

    const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], my_role: 'owner', my_status: 'active' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A club with this name already exists' });
    }
    next(err);
  } finally {
    conn.release();
  }
}

async function update(req, res, next) {
  const body = { ...req.club, ...req.body };
  const errors = validateClub(body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  try {
    await pool.query(
      'UPDATE clubs SET name = ?, description = ?, rules = ?, type = ? WHERE id = ?',
      [body.name.trim(), clean(body.description), clean(body.rules), body.type, req.club.id]
    );
    const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [req.club.id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A club with this name already exists' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await pool.query('DELETE FROM clubs WHERE id = ?', [req.club.id]);
    res.json({ message: 'Club deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Open clubs accept the user straight away, closed clubs get a join request.
async function join(req, res, next) {
  try {
    const m = req.membership;
    if (m?.status === 'active') {
      return res.status(409).json({ message: 'You are already a member of this club' });
    }
    if (m?.status === 'requested') {
      return res.status(409).json({ message: 'Your request is already waiting for approval' });
    }

    const status = req.club.type === 'open' || m?.status === 'invited' ? 'active' : 'requested';
    await pool.query(
      `INSERT INTO club_members (club_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'member', ?, IF(? = 'active', NOW(), NULL))
       ON DUPLICATE KEY UPDATE status = VALUES(status), joined_at = VALUES(joined_at)`,
      [req.club.id, req.user.id, status, status]
    );

    res.status(status === 'active' ? 201 : 202).json({
      status,
      message: status === 'active' ? 'You joined the club' : 'Join request sent to the club owner',
    });
  } catch (err) {
    next(err);
  }
}

async function leave(req, res, next) {
  try {
    if (!req.membership) {
      return res.status(404).json({ message: 'You are not a member of this club' });
    }
    if (req.membership.role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot leave the club. Delete the club instead' });
    }
    await pool.query('DELETE FROM club_members WHERE club_id = ? AND user_id = ?', [
      req.club.id,
      req.user.id,
    ]);
    res.json({ message: 'You left the club' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, create, update, remove, join, leave };
