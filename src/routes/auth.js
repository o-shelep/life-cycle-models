const { Router } = require('express');
const { register, login, logout, me, updateMe } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = Router();


router.post('/register', register);

router.post('/login', login);

router.post('/logout', authenticate, logout);

router.get('/me', authenticate, me);

router.put('/me', authenticate, updateMe);

module.exports = router;
