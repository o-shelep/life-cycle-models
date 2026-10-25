const pool = require('../config/db');

// Loads the club from :id and the current user's membership into req.club / req.membership.
async function loadClub(req, res, next) {
  try {
    const [clubs] = await pool.query('SELECT * FROM clubs WHERE id = ?', [req.params.id]);
    if (clubs.length === 0) {
      return res.status(404).json({ message: 'Club not found' });
    }
    const [members] = await pool.query(
      'SELECT role, status FROM club_members WHERE club_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    req.club = clubs[0];
    req.membership = members[0] || null;
    next();
  } catch (err) {
    next(err);
  }
}

// Allows only active members whose role is in the list (any role when the list is empty).
function requireRole(...roles) {
  return (req, res, next) => {
    const m = req.membership;
    if (!m || m.status !== 'active' || (roles.length > 0 && !roles.includes(m.role))) {
      return res.status(403).json({ message: 'You do not have access to this club action' });
    }
    next();
  };
}

module.exports = { loadClub, requireRole };
