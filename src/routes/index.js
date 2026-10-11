const { Router } = require('express');

const authRoutes    = require('./auth');
const booksRoutes   = require('./books');
const genresRoutes  = require('./genres');
const authorsRoutes = require('./authors');

const router = Router();

router.use('/auth',    authRoutes);
router.use('/books',   booksRoutes);
router.use('/genres',  genresRoutes);
router.use('/authors', authorsRoutes);

module.exports = router;
