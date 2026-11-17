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
body('phoneNumber')
  .trim()
  .customSanitizer(value => {
    let p = String(value).replace(/[\s-]/g, ''); 
    if (p.startsWith('+234')) {
      p = '0' + p.slice(4);
    }
    if (p.startsWith('234') && p.length === 13) {
      p = '0' + p.slice(3);
    }
    return p;
  })
  .isLength({ min: 11, max: 11 })
  .withMessage('Phone number must be 11 digits')
  .bail() 
  .matches(/^0[789][01]\d{8}$/)
  .withMessage('Enter a valid Nigerian phone number')
  .bail() 
  .custom((value, { req }) => {
    return User.findOne({ phoneNumber: value })
      .select('_id')
      .lean()
      .then(existingUser => {
        if (existingUser) {
          return Promise.reject('Phonenumber already registered, please use another');
        }
      });
  }),
body('userName')
  .trim()
  .customSanitizer(value => {
    let p = String(value).replace(/[\s-]/g, '');
    if (p.startsWith('+234')) {
      p = '0' + p.slice(4);
    }
    if (p.startsWith('234') && p.length === 13) {
      p = '0' + p.slice(3);
    }
    return p;
  })
  .isLength({ min: 11, max: 11 })
  .withMessage('Phone number must be 11 digits')
  .bail()
  .matches(/^0[789][01]\d{8}$/)
  .withMessage('Enter a valid Nigerian phone number')
  .bail() 
  .custom((value, { req }) => {
    return User.findOne({ userName: value })
      .select('_id')
      .lean()
      .then(existingUser => {
        if (existingUser) {
          return Promise.reject('Username already registered, please use another');
        }
      });
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