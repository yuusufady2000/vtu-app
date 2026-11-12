

exports.getIndex = (req,res,next) => {
     res.render('shop/index', {
    path: '/index',
    pageTitle: 'Dashboard',
    user: req.user
  });
  console.log(req.user)
};

exports.getProfile = (req,res,next) => {
     res.render('shop/profile', {
    path: '/profile',
    pageTitle: 'Profile',
    user: req.user
  });
  console.log(req.user)
}
