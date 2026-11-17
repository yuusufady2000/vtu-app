
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const crypto = require('crypto');
const sendMail = require('../util/sendgrid');

exports.getLogin = (req, res, next) => {
    const errorMessages = req.flash('error');
    const successMessages = req.flash('success');

    res.render('shop/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errorMessages.length ? errorMessages[0] : null,
        successMessage: successMessages.length ? successMessages[0] : null,
          oldInput: {
            name:'',
            userName:'',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: ''
        }
    });
};

exports.getSignup = (req, res, next) => {
    const errorMessages = req.flash('error');
    const successMessages = req.flash('success');

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errorMessages.length ? errorMessages[0] : null,
        successMessage: successMessages.length ? successMessages[0] : null,
        oldInput: {
            name:'',
            userName:'',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: ''
        }
    });
};

  exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(422).
      render('shop/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldInput: {email: email, password: password}
    });
    }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Account not found')
         res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/index');
            });
          }
            req.flash('error', 'Invalid email address or password');
         return res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};
  

exports.postSignup = (req, res, next) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const userName = typeof req.body.userName === 'string'
        ? req.body.userName.trim().toLowerCase()
        : '';
    const phoneNumber = typeof req.body.phoneNumber === 'string'
        ? req.body.phoneNumber.trim()
        : '';
    const email = typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(422).
      render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errors.array()[0].msg,
        oldInput: {name:name,userName:userName, phoneNumber:phoneNumber,email: email, password: password, confirmPassword: req.body.confirmPassword}
    });
    }
    bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        name,
                        userName,
                        phoneNumber,
                     email,
                        password: hashedPassword
                    });

                    return user.save();
                })
        .then(user => {
            if (!user) return;

            Promise.resolve()
                .then(() => sendMail({
                    to: email,
                    from: process.env.SENDGRID_EMAIL,
                    subject: 'Welcome to Zeal Data',
                    text: `Hello ${name}, your Zeal Data account has been created successfully.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                            <h2>Welcome to Zeal Data</h2>
                            <p>Hello ${name},</p>
                            <p>Your account has been created successfully.</p>
                            <p>Thank you for joining Zeal Data.</p>
                        </div>
                    `
                }))
                .then(() => console.log('Signup email sent.'))
                .catch(error => console.error('Signup email failed:', error.message));

            req.flash('success', 'Account created successfully.');
            res.redirect('/login');
        })
        .catch(err => {
            console.error('SIGNUP ERROR:', err.code || err.message);

            if (res.headersSent) return;

            if (err.code === 11000) {
                const field = Object.keys(err.keyPattern || err.keyValue || {})[0];

                const messages = {
                    email: 'This email address is already registered.',
                    phoneNumber: 'This phone number is already registered.',
                    userName: 'This username is already taken.'
                };

                req.flash('error', messages[field] || 'This account information is already in use.');
            } else {
                req.flash('error', 'Something went wrong. Please try again.');
            }

            res.redirect('/signup');
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) return next(err);

        res.clearCookie('zeal.sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        res.redirect('/login');
    });
};

exports.getReset = (req,res,next) => {
     const errorMessages = req.flash('error');
    const successMessages = req.flash('success');

      res.render('shop/password', {
    path:'/password',
    pageTitle:'Reset Password',
     errorMessage: errorMessages.length ? errorMessages[0] : null,
        successMessage: successMessages.length ? successMessages[0] : null,
  })
}

exports.postForgotPassword = (req, res, next) => {
    const email = typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    if (!email) {
        req.flash('error', 'Please enter your email address.');
        return res.redirect('/password');
    }

    crypto.randomBytes(32, (err, buffer) => {
                if (err) return next(err);

                const token = buffer.toString('hex');
                const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
                const resetUrl = `${req.protocol}://${req.get('host')}/reset/${token}`;

                User.findOne({ email })
            .then(user => {
                if (!user) {
                                        req.flash('error', 'Email account not found.');
                                        res.redirect('/forgot-password');
                    return null;
                }

             user.resetToken = token;
               user.resetExpire = Date.now() + 3600000;
                  return user.save()
                    .then(() => sendMail({
                    to: email,
                    from: process.env.SENDGRID_EMAIL,
                    subject: 'Zeal Data Password Reset',
                    text: `Use this link to reset your password: ${resetUrl}. This link expires in one hour.`,
                    html: `
                        <h2>Password Reset</h2>
                        <p>Click the link below to reset your password:</p>
                        <a href="https://vtu-app-1-lw64.onrender.com/forgot-password/${token}">Reset Password</a>
                        <p>This link expires in one hour.</p>
                    `
                }).then(() => {
                    req.flash('success', 'A password reset link has been sent to your email.');
                    res.redirect('/login');
                }));
            })
            .catch(err => {console.log(err)});
    });
};

exports.getPassword = (req, res, next) => {
 const errorMessages = req.flash('error');
    const successMessages = req.flash('success');
const token = req.params.token;
  User.findOne({resetToken: token, resetExpire: {$gt: Date.now()}})
  .then(user => {
      res.render('shop/forgot-password', {
    path:'/forgot-password',
    pageTitle:'Password reset',
    userId: user._id.toString(),
    passwordToken:token,
     errorMessage: errorMessages.length ? errorMessages[0] : null,
    successMessage: successMessages.length ? successMessages[0] : null,
  })
  })
  .catch(err => {
    console.log(err)
  })

    // const token = req.params.token;
    // const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // User.findOne({
    //     resetToken: tokenHash,
    //     resetExpire: { $gt: Date.now() }
    // })
    //     .then(user => {
    //         if (!user) {
    //             req.flash('error', 'This password reset link is invalid or has expired.');
    //             return res.redirect('/login');
    //         }

    //         res.render('auth/reset-password', {
    //             path: '/reset',
    //             pageTitle: 'Reset Password',
    //             userId: user._id.toString(),
    //             passwordToken: token
    //         });
    //     })
    //     .catch(next);
};

exports.postResetPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;

    let resetUser;

    if (
        typeof newPassword !== 'string' ||
        typeof confirmPassword !== 'string' ||
        newPassword !== confirmPassword
    ) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect(`/forgot-password/${token}`);
    }

    if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        req.flash('error', 'Password must be at least 8 characters .');
        return res.redirect(`/forgot-password/${token}`);
    }
    User.findOne({
        _id: userId,
        resetToken: passwordToken,
        resetExpire: { $gt: Date.now() }
    })
     .then(user => {
            if (!user) {
                req.flash('error', 'This password reset link is invalid or has expired.');
                return null;
            }
                 resetUser = user;
              return bcrypt.hash(newPassword, 12)
            })
             .then(hashedPassword => {
                if(!resetUser){
                    return null;
                }
                    resetUser.password = hashedPassword;
                    resetUser.resetToken = undefined;
                    resetUser.resetExpire = undefined;

                    return resetUser.save();
                })     
        .then(result => {
            if (result) {
                  req.flash('success', 'Your password has been changed successfully.');
                return res.redirect('/login');
        }
        })
        .catch(err => {console.log(err)});
};
