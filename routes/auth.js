const express = require('express');

const { check,body } = require('express-validator')

const authController = require('../controllers/auth');

const limiter = require('../middleware/isAuth');

const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login', check('email', 'Please enter a valid email').isEmail(),
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
body('phoneNumber')
    // .trim()
    // .customSanitizer(value => {
    //     let phone = String(value).replace(/[\s-]/g, '');

    //     if (phone.startsWith('+234')) {
    //         phone = '0' + phone.slice(4);
    //     } else if (phone.startsWith('234')) {
    //         phone = '0' + phone.slice(3);
    //     }

    //     return phone;
    // })
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone number must be 11 digits')
    .bail()
    .matches(/^0[789][01]\d{8}$/)
    .withMessage('Enter a valid Nigerian phone number')
    .bail()
    .custom(async (value) => {
        const existingUser = await User.findOne({
            phoneNumber: value
        })
            .select('_id')
            .lean();

        if (existingUser) {
            throw new Error('Phone number already registered, please use another');
        }

        return true;
    }),
body('userName')
    .trim()
    .customSanitizer(value => String(value).toLowerCase().replace(/\s+/g, ''))
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .bail()
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores')
    .bail()
    .custom(async value => {
        const existingUser = await User.findOne({
            userName: value
        })
            .select('_id')
            .lean();

        if (existingUser) {
            throw new Error('Username already registered, please use another');
        }

        return true;
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