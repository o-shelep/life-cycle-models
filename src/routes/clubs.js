const { Router } = require('express');
const { getAll, getOne, create, update, remove, join, leave } = require('../controllers/clubsController');
const authenticate = require('../middleware/auth');
const { loadClub, requireRole } = require('../middleware/clubAccess');

const router = Router();

router.use(authenticate);

router.get('/', getAll);

router.post('/', create);

router.get('/:id', loadClub, getOne);

router.put('/:id', loadClub, requireRole('owner'), update);

router.delete('/:id', loadClub, requireRole('owner'), remove);

router.post('/:id/join', loadClub, join);

router.post('/:id/leave', loadClub, leave);

module.exports = router;
