const express = require('express');

const { check,body } = require('express-validator')

const authController = require('../controllers/auth');

const limiter = require('../middleware/isAuth');

const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login', check('email', 'Please enter a valid email').isEmail(),
body('password', 'password must be at least 8 character' ).isLength({min: 8}),
body('confirm'),
authController.postLogin);

router.post('/signup',check('email').isEmail().withMessage('Please enter a valid email')
.custom((value, { req }) => {
    return User.findOne({email: value })
            .select('_id')
            .lean()
            .then(existingUser => {
                if (existingUser) {
                    return Promise.reject('Email already registered, please use another email')
                }
            });
}),
body()
.custom((value, {req}) => {
    return User.findOne({phoneNumber: value})
    .select('_id')
            .lean()
            .then(existingUser => {
                if (existingUser) {
                    return Promise.reject('Phonenumber already registered, please use another phonenumber')
                }
            })
}),
body()
.custom((value, {req}) => {
    return User.findOne({userName: value})
    .select('_id')
            .lean()
            .then(existingUser => {
                if (existingUser) {
                    return Promise.reject('Username already used, please use another username')
                }
            })
}),
body('password', 'password must be at least 8 character' ).isLength({min: 8}),
body('confirmPassword')
.custom((value, { req }) => {
    if (value !== req.body.password){
        throw new Error('Password do not match')
    }
    return true;
}),
authController.postSignup);

router.post('/logout', authController.postLogout);

router.post('/forgot-password', authController.postForgotPassword);

router.get('/forgot-password', authController.getReset);

router.get('/forgot-password/:token', authController.getPassword);

router.post('/password', authController.postResetPassword);

module.exports = router;