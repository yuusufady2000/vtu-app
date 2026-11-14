
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const crypto = require('crypto');
const sendMail = require('../util/sendgrid');
const { sendPushNotification } = require("../util/onesignal");


exports.getLogin = (req, res, next) => {
  const errorMessages = req.flash('error');
  const successMessages = req.flash('success');

  res.render('shop/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: errorMessages.length ? errorMessages[0] : null,
    successMessage: successMessages.length ? successMessages[0] : null,
    isAuthenticated: false
  });
};

exports.getSignup = (req, res, next) => {
  const errorMessages = req.flash('error');
  const successMessages = req.flash('success');

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: errorMessages.length ? errorMessages[0] : null,
    successMessage: successMessages.length ? successMessages[0] : null
  });
};


exports.postLogin = (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    req.flash('error', 'Please enter your email and password.');
    return res.redirect('/login');
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      return bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (!doMatch) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
          }

          req.session.regenerate(err => {
            if (err) return next(err);

            req.session.isLoggedIn = true;
            req.session.user = user;

            req.session.save(async err => {
              if (err) return next(err);

              try {
                const result = await sendEmailNotification({
                  email: user.email,
                  title: "New Login to Zeal Data",
                  message: `
                    <h2>New Login detected</h2>
                    <p>Your Zeal Data account was successfully accessed.</p>
                    <p>Email: ${user.email}</p>
                  `
                });

                console.log("OneSignal login email result:", result);
              } catch (error) {
                console.error("OneSignal login email error:", error);
              }

              res.redirect('/index');
            });
          });
        });
    })
    .catch(err => next(err));
};


exports.postSignup = (req, res, next) => {
  const name = req.body.name?.trim();
  const userName = req.body.userName?.trim().toLowerCase();
  const phoneNumber = req.body.phoneNumber?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (!name || !userName || !phoneNumber || !email || !password || !confirmPassword) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/signup');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  if (password.length < 8) {
    req.flash('error', 'Password must contain at least 8 characters.');
    return res.redirect('/signup');
  }

  Promise.all([
    User.findOne({ email }),
    User.findOne({ phoneNumber }),
    User.findOne({ userName })
  ])
    .then(([emailUser, phoneUser, usernameUser]) => {
      if (emailUser) {
        req.flash('error', 'This email address is already registered.');
        res.redirect('/signup');
        return null;
      }

      if (phoneUser) {
        req.flash('error', 'This phone number is already registered.');
        res.redirect('/signup');
        return null;
      }

      if (usernameUser) {
        req.flash('error', 'This username is already taken.');
        res.redirect('/signup');
        return null;
      }

      return bcrypt.hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            name,
            userName,
            phoneNumber,
            email,
            password: hashedPassword,
            cart: { items: [] }
          });

          return user.save();
        });
    })
    .then(() => {
    return sendMail({
        to: email,
        from: process.env.SENDGRID_EMAIL,
        subject: 'Signup succeeded',
        html: '<h1>You successfully signed up!</h1>'
    });
})
    .then(result => {
      if (!result) return;
     
      req.flash('success', 'Account created successfully.');
      res.redirect('/login');
    })
    .catch(err => {
      console.error(err);

      if (res.headersSent) return;

      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];

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

exports.postForgotPassword = (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    req.flash('error', 'Please enter your email address.');
    return res.redirect('/login');
  }

  crypto.randomBytes(32, (err, buffer) => {
    if (err) return next(err);

    const token = buffer.toString('hex');

    User.findOne({ email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account is registered with this email address.');
          return null;
        }

        user.resetToken = token;
        user.resetExpire = Date.now() + 3600000;

        return user.save().then(() => user);
      })
      .then(user => {
        if (!user) return;

        const resetUrl = `${req.protocol}://${req.get('host')}/reset/${token}`;

        return sendMail({
          to: email,
          subject: 'Zeal Data Password Reset',
          text: `Use this link to reset your password: ${resetUrl}`,
          html: `<h2>Password Reset</h2><p>Click the link below to reset your password:</p><a href="${resetUrl}">Reset Password</a><p>This link expires in one hour.</p>`
        }).then(() => {
          req.flash('success', 'A password reset link has been sent to your email.');
          res.redirect('/login');
        });
      })
      .catch(err => next(err));
  });
};

exports.getPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    resetExpire: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'This password reset link is invalid or has expired.');
        return res.redirect('/login');
      }

      res.render('auth/reset-password', {
        path: '/reset',
        pageTitle: 'Reset Password',
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => next(err));
};

exports.postResetPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const token = req.body.passwordToken;
  const userId = req.body.userId;

  // if (!newPassword || newPassword !== confirmPassword) {
  //   req.flash('error', 'Passwords do not match.');
  //   return res.redirect(`/reset/${token}`);
  // }

  // if (newPassword.length < 8) {
  //   req.flash('error', 'Password must contain at least 8 characters.');
  //   return res.redirect(`/reset/${token}`);
  // }

  User.findOne({
    _id: userId,
    resetToken: token,
    resetExpire: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash('error', 'This password reset link is invalid or has expired.');
        return null;
      }

      return bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetExpire = undefined;

          return user.save();
        });
    })
    .then(result => {
      if (!result) return;

      req.flash('success', 'Your password has been changed successfully.');
      res.redirect('/login');
    })
    .catch(err => next(err));
};
