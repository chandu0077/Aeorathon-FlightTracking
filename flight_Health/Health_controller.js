// controllers/HealthController.js
const checkFlightHealth = (req, res) => {
  const params = req.body;

  // Define the threshold values for each parameter
  const thresholds = {
    altitude: { min: 1000, max: 40000 }, // in feet
    speed: { min: 150, max: 600 }, // in knots
    engineTemperature: { max: 1000 }, // in degrees Celsius
    turbinePressure: { min: 20, max: 60 }, // in psi
    fuelLevel: { min: 500 }, // in liters
    cabinPressure: { min: 11, max: 15 }, // in psi
    hydraulicFluidLevel: { min: 2, max: 5 }, // in liters
    oilPressure: { min: 20, max: 50 }, // in psi
  };

  let alerts = [];

  // Check each parameter against its threshold
  for (let param in params) {
    if (thresholds[param]) {
      if (
        params[param] < thresholds[param].min ||
        params[param] > thresholds[param].max
      ) {
        alerts.push(`${param} is out of safe range: ${params[param]}`);
      }
    }
  }

  // Send alerts if any
  if (alerts.length > 0) {
    return res.status(200).json({ status: "warning", alerts });
  } else {
    return res.status(200).json({
      status: "ok",
      // message: "All parameters are within safe ranges.",
    });
  }
};

module.exports = {
  checkFlightHealth,
};
