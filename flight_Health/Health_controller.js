// controllers/HealthController.js
const thresholds = {
  altitude: { min: 1000, max: 40000 }, // in feet
  speed: { min: 0, max: 600 }, // in knots
  engineTemperature: { max: 1000 }, // in degrees Celsius
  turbinePressure: { min: 20, max: 60 }, // in psi
  fuelLevel: { min: 500 }, // in liters
  cabinPressure: { min: 11, max: 15 }, // in psi
  hydraulicFluidLevel: { min: 2, max: 5 }, // in liters
  oilPressure: { min: 20, max: 50 } // in psi
};

let flightData = {};

const checkFlightHealth = (params) => {
  let alerts = [];

  // Check each parameter against its threshold
  for (let param in params) {
      if (thresholds[param]) {
          if (params[param] < thresholds[param].min || params[param] > thresholds[param].max) {
              alerts.push(`${param} is out of safe range: ${params[param]}`);
          }
      }
  }

  return alerts;
};

const updateFlightData = (data) => {
  flightData = { ...flightData, ...data };
};

const getFlightData = () => {
  return flightData;
};

module.exports = {
  checkFlightHealth,
  updateFlightData,
  getFlightData
};
