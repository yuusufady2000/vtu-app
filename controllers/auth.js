
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
    const email = typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    const password = req.body.password;

    if (!email || typeof password !== 'string' || !password) {
        req.flash('error', 'Please enter your email and password.');
        return res.redirect('/login');
    }

    User.findOne({ email })
        .select('+password')
        .lean()
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return null;
            }

            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        req.flash('error', 'Invalid email or password.');
                        return null;
                    }

                    return new Promise((resolve, reject) => {
                        req.session.regenerate(err => {
                            if (err) return reject(err);

                            req.session.isLoggedIn = true;

                            req.session.user = {
                                _id: user._id.toString(),
                                name: user.name,
                                userName: user.userName,
                                email: user.email
                            };

                            req.session.save(err => {
                                if (err) return reject(err);
                                resolve(user);
                            });
                        });
                    });
                });
        })
        .then(user => {
            if (!user) return;

            Promise.resolve()
                .then(() => sendMail({
                    to: user.email,
                    from: process.env.SENDGRID_EMAIL,
                    subject: 'New Login detected',
                    text: `Hello ${user.name}, your Zeal Data account was successfully logged into.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                            <h2>New Login to Zeal Data</h2>
                            <p>Hello ${user.name},</p>
                            <p>Your Zeal Data account was successfully logged into.</p>
                            <p>If this wasn't you, please reset your password and contact support.</p>
                            <p>Thank you for using Zeal Data.</p>
                        </div>
                    `
                }))
                .then(() => console.log('Login notification email sent.'))
                .catch(error => console.error('Login notification email failed:', error.message));

            res.redirect('/index');
        })
        .catch(next);
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
    const confirmPassword = req.body.confirmPassword;

    if (!name || !userName || !phoneNumber || !email ||
        typeof password !== 'string' ||
        typeof confirmPassword !== 'string' ||
        !password || !confirmPassword) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/signup');
    }

    if (name.length > 80) {
        req.flash('error', 'Name is too long.');
        return res.redirect('/signup');
    }

    if (!/^[a-z0-9_.]{3,20}$/.test(userName)) {
        req.flash('error', 'Username must be 3–20 characters and contain only letters, numbers, dots or underscores.');
        return res.redirect('/signup');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.flash('error', 'Please enter a valid email address.');
        return res.redirect('/signup');
    }

    if (!/^\+?[0-9]{7,15}$/.test(phoneNumber)) {
        req.flash('error', 'Please enter a valid phone number.');
        return res.redirect('/signup');
    }

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/signup');
    }

    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        req.flash('error', 'Password must be at least 8 characters and no more than 72 bytes.');
        return res.redirect('/signup');
    }

    User.findOne({
        $or: [
            { email },
            { phoneNumber },
            { userName }
        ]
    })
        .select('email phoneNumber userName')
        .lean()
        .then(existingUser => {
            if (existingUser) {
                if (existingUser.email === email) {
                    req.flash('error', 'This email address is already registered.');
                } else if (existingUser.phoneNumber === phoneNumber) {
                    req.flash('error', 'This phone number is already registered.');
                } else {
                    req.flash('error', 'This username is already taken.');
                }

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
                        password: hashedPassword
                    });

                    return user.save();
                });
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

exports.postForgotPassword = (req, res, next) => {
    const email = typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

    if (!email) {
        req.flash('error', 'Please enter your email address.');
        return res.redirect('/login');
    }

    crypto.randomBytes(32, (err, buffer) => {
        if (err) return next(err);

        const token = buffer.toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        User.findOne({ email })
            .then(user => {
                if (!user) {
                    req.flash('success', 'If an account exists with this email, a password reset link will be sent.');
                    return null;
                }

                user.resetToken = tokenHash;
                user.resetExpire = Date.now() + 3600000;

                return user.save()
                    .then(() => user);
            })
            .then(user => {
                if (!user) {
                    return res.redirect('/login');
                }

                const resetUrl = `${req.protocol}://${req.get('host')}/reset/${token}`;

                return sendMail({
                    to: email,
                    from: process.env.SENDGRID_EMAIL,
                    subject: 'Zeal Data Password Reset',
                    text: `Use this link to reset your password: ${resetUrl}. This link expires in one hour.`,
                    html: `
                        <h2>Password Reset</h2>
                        <p>Click the link below to reset your password:</p>
                        <a href="${resetUrl}">Reset Password</a>
                        <p>This link expires in one hour.</p>
                    `
                }).then(() => {
                    req.flash('success', 'A password reset link has been sent to your email.');
                    res.redirect('/login');
                });
            })
            .catch(next);
    });
};

exports.getPassword = (req, res, next) => {
    const token = req.params.token;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    User.findOne({
        resetToken: tokenHash,
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
        .catch(next);
};

exports.postResetPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const token = req.body.passwordToken;
    const userId = req.body.userId;

    if (
        typeof newPassword !== 'string' ||
        typeof confirmPassword !== 'string' ||
        newPassword !== confirmPassword
    ) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect(`/reset/${token}`);
    }

    if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        req.flash('error', 'Password must be at least 8 characters and no more than 72 bytes.');
        return res.redirect(`/reset/${token}`);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    User.findOne({
        _id: userId,
        resetToken: tokenHash,
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
        .catch(next);
};
