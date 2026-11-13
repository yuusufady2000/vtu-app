const express = require('express');
const router = express.Router();

const vtugateController = require('../controllers/services');

const isAuth = require('../middleware/isAuth')

router.get('/buy-data',isAuth, vtugateController.getDataPage);

router.post('/fetch-data-plans',isAuth, vtugateController.getDataPlans);

module.exports = router;