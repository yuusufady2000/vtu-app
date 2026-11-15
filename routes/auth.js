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

router.post('/forgot-password', authController.postForgotPassword);

router.get('/forgot-password', authController.getReset);

router.get('/forgot-password/:token', authController.getPassword);

router.post('/password', authController.postResetPassword);

module.exports = router;