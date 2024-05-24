// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const HealthController = require('./Health_controller');

router.post('/initialize', (req, res) => {
    HealthController.updateFlightData(req.body);
    res.status(200).json({ message: 'Initial flight data set', data: req.body });
});

router.get('/status', (req, res) => {
    const data = HealthController.getFlightData();
    const alerts = HealthController.checkFlightHealth(data);
    res.status(200).json({ data, alerts });
});

module.exports = router;
