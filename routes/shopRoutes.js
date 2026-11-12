const express = require('express');

const shopRoutes = require('../controllers/shopController');

const isAuth = require('../middleware/isAuth')

const router = express.Router();

router.get('/index',isAuth, shopRoutes.getIndex);

router.get('/profile', isAuth, shopRoutes.getProfile)




module.exports = router;