
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        req.flash('error', 'Too many login attempts. Please try again in 15 minutes.');
        res.redirect('/login');
    }
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
        req.flash('error', 'Too many signup attempts. Please try again later.');
        res.redirect('/signup');
    }
});

router.get('/login', authController.getLogin);
router.post('/login', loginLimiter, authController.postLogin);

router.get('/signup', authController.getSignup);
router.post('/signup', signupLimiter, authController.postSignup);

router.post('/logout', authController.postLogout);

router.post('/forgot-password', authController.postForgotPassword);
router.get('/reset/:token', authController.getPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;
