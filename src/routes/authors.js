const { Router } = require('express');
const { getAll, getOne, create, update, remove } = require('../controllers/authorsController');
const authenticate = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', getAll);

router.get('/:id', getOne);

router.post('/', create);

router.put('/:id', update);

router.delete('/:id', remove);

module.exports = router;
