const CLUB_TYPES = ['open', 'closed'];

function validateClub(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (name.length < 3 || name.length > 100) {
    errors.push('Club name must be between 3 and 100 characters');
  }
  if (body.type !== undefined && !CLUB_TYPES.includes(body.type)) {
    errors.push('Club type must be "open" or "closed"');
  }

  return errors;
}

module.exports = { validateClub, CLUB_TYPES };
