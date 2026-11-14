const express = require('express');

const { check } = require('express-validator')

const authController = require('../controllers/auth');

const limiter = require('../middleware/isAuth')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', check('email').isEmail(), authController.postLogin);

router.post('/signup', authController.postSignup);

router.post('/logout', authController.postLogout);

module.exports = router;