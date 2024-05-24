// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const Health_controller = require('./Health_controller');

router.post('/check', Health_controller.checkFlightHealth);

module.exports = router;
