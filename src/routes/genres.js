const { Router } = require('express');
const { getAll, create, update, remove } = require('../controllers/genresController');
const authenticate = require('../middleware/auth');

const router = Router();

router.get('/',     authenticate, getAll);
router.post('/',    authenticate, create);
router.put('/:id',  authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
