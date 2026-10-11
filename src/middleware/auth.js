const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

module.exports = authenticate;
