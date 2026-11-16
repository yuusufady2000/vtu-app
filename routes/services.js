const express = require('express');
const router = express.Router();

const servicesController = require('../controllers/services');

router.get('/data', servicesController.getBuyData);

module.exports = router;