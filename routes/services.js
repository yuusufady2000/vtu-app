const express = require('express');
const router = express.Router();

const vtugateController = require('../controllers/vtugate');

router.get('/buy-data', vtugateController.getDataPage);

router.post('/fetch-data-plans', vtugateController.getDataPlans);

module.exports = router;