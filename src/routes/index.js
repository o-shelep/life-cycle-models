const { Router } = require('express');

const authRoutes    = require('./auth');
const booksRoutes   = require('./books');
const genresRoutes  = require('./genres');
const authorsRoutes = require('./authors');
const clubsRoutes   = require('./clubs');

const router = Router();

router.use('/auth',    authRoutes);
router.use('/books',   booksRoutes);
router.use('/genres',  genresRoutes);
router.use('/authors', authorsRoutes);
router.use('/clubs',   clubsRoutes);

module.exports = router;
