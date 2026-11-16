
const express = require('express');
const router = express.Router();

const servicesController = require('../controllers/services');
const isAuth = require('../middleware/isAuth');

router.get('/buy-data', isAuth, servicesController.getDataPage);

router.post('/fetch-data-plans', isAuth, servicesController.getDataPlans);

router.post('/purchase-data', isAuth, servicesController.postBuyData);

module.exports = router;
