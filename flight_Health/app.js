// app.js
const express = require('express');
const bodyParser = require('body-parser');
const healthRoutes = require('./Health_Routes');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use('/health', healthRoutes);

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // Handle incoming health data
    socket.on('healthData', (data) => {
        // Check health data and emit alerts if needed
        const alerts = checkHealthData(data);
        if (alerts.length > 0) {
            io.emit('alert', alerts);
        } else {
            io.emit('alert', ['All parameters are within safe ranges.']);
        }
    });
});

const checkHealthData = (params) => {
    const thresholds = {
        altitude: { min: 1000, max: 40000 }, // in feet
        speed: { min: 150, max: 600 }, // in knots
        engineTemperature: { max: 1000 }, // in degrees Celsius
        turbinePressure: { min: 20, max: 60 }, // in psi
        fuelLevel: { min: 500 }, // in liters
        cabinPressure: { min: 11, max: 15 }, // in psi
        hydraulicFluidLevel: { min: 2, max: 5 }, // in liters
        oilPressure: { min: 20, max: 50 } // in psi
    };

    let alerts = [];

    for (let param in params) {
        if (thresholds[param]) {
            if (params[param] < thresholds[param].min || params[param] > thresholds[param].max) {
                alerts.push(`${param} is out of safe range: ${params[param]}`);
            }
        }
    }

    return alerts;
};

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
