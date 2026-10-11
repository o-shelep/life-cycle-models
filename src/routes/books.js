const { Router } = require('express');
const { getAll, getOne, create, update, remove } = require('../controllers/booksController');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

router.use(authenticate);

router.get('/', getAll);

router.get('/:id', getOne);

router.post('/', upload.single('cover_image'), create);

router.put('/:id', upload.single('cover_image'), update);

router.delete('/:id', remove);

module.exports = router;
