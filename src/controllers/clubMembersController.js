const pool = require('../config/db');

const ASSIGNABLE_ROLES = ['moderator', 'member'];

// Owners and moderators see pending invitations and join requests; members only see active members.
async function getAll(req, res, next) {
  try {
    const canManage = ['owner', 'moderator'].includes(req.membership.role);
    const [rows] = await pool.query(
      `SELECT cm.user_id, u.username, cm.role, cm.status, cm.created_at, cm.joined_at,
              inv.username AS invited_by_name
       FROM club_members cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN users inv ON inv.id = cm.invited_by
       WHERE cm.club_id = ? ${canManage ? '' : "AND cm.status = 'active'"}
       ORDER BY FIELD(cm.status, 'requested', 'invited', 'active'),
                FIELD(cm.role, 'owner', 'moderator', 'member'), u.username`,
      [req.club.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function invite(req, res, next) {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const invitee = users[0];

    const [existing] = await pool.query(
      'SELECT status FROM club_members WHERE club_id = ? AND user_id = ?',
      [req.club.id, invitee.id]
    );
    if (existing[0]?.status === 'active') {
      return res.status(409).json({ message: 'User is already a member of this club' });
    }
    if (existing[0]?.status === 'invited') {
      return res.status(409).json({ message: 'User has already been invited' });
    }

    // A pending join request plus an invitation means both sides agree, so the user joins.
    if (existing[0]?.status === 'requested') {
      await setActive(req.club.id, invitee.id);
      return res.json({ status: 'active', message: `${invitee.username} joined the club` });
    }

    await pool.query(
      `INSERT INTO club_members (club_id, user_id, role, status, invited_by)
       VALUES (?, ?, 'member', 'invited', ?)`,
      [req.club.id, invitee.id, req.user.id]
    );
    res.status(201).json({ status: 'invited', message: `Invitation sent to ${invitee.username}` });
  } catch (err) {
    next(err);
  }
}

async function declineInvitation(req, res, next) {
  try {
    const [result] = await pool.query(
      "DELETE FROM club_members WHERE club_id = ? AND user_id = ? AND status = 'invited'",
      [req.club.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    res.json({ message: 'Invitation declined' });
  } catch (err) {
    next(err);
  }
}

async function approveRequest(req, res, next) {
  try {
    const updated = await setActive(req.club.id, req.params.userId, 'requested');
    if (!updated) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    res.json({ message: 'Join request approved' });
  } catch (err) {
    next(err);
  }
}

async function rejectRequest(req, res, next) {
  try {
    const [result] = await pool.query(
      "DELETE FROM club_members WHERE club_id = ? AND user_id = ? AND status = 'requested'",
      [req.club.id, req.params.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    res.json({ message: 'Join request rejected' });
  } catch (err) {
    next(err);
  }
}

async function changeRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role must be "moderator" or "member"' });
    }
    const [result] = await pool.query(
      `UPDATE club_members SET role = ?
       WHERE club_id = ? AND user_id = ? AND status = 'active' AND role <> 'owner'`,
      [role, req.club.id, req.params.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json({ message: 'Role updated', role });
  } catch (err) {
    next(err);
  }
}

// Owners remove anyone except themselves, moderators remove only regular members.
async function removeMember(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT role FROM club_members WHERE club_id = ? AND user_id = ?',
      [req.club.id, req.params.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }
    const target = rows[0];
    if (target.role === 'owner') {
      return res.status(400).json({ message: 'The owner cannot be removed from the club' });
    }
    if (req.membership.role === 'moderator' && target.role !== 'member') {
      return res.status(403).json({ message: 'Moderators can only remove regular members' });
    }
    await pool.query('DELETE FROM club_members WHERE club_id = ? AND user_id = ?', [
      req.club.id,
      req.params.userId,
    ]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
}

async function setActive(clubId, userId, fromStatus) {
  const [result] = await pool.query(
    `UPDATE club_members SET status = 'active', joined_at = NOW()
     WHERE club_id = ? AND user_id = ? ${fromStatus ? 'AND status = ?' : ''}`,
    fromStatus ? [clubId, userId, fromStatus] : [clubId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getAll,
  invite,
  declineInvitation,
  approveRequest,
  rejectRequest,
  changeRole,
  removeMember,
};
