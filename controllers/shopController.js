exports.getIndex = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    return res.render('shop/index', {
        path: '/index',
        pageTitle: 'Dashboard',
        user: req.user
    });
};

exports.getProfile = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    return res.render('shop/profile', {
        path: '/profile',
        pageTitle: 'Profile',
        user: req.user
    });
};