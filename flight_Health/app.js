// app.js
const express = require("express");
const bodyParser = require("body-parser");
const healthRoutes = require("./Health_Routes");
const pathRoutes = require("./Path_routes");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.use("/health", healthRoutes);
app.use("/path", pathRoutes);

// Create server
const server = http.createServer(app);
const io = socketIo(server);

let flightParams = {
  altitude: 35000, // in feet
  speed: 0, // in knots
  engineTemperature: 900, // in degrees Celsius
  turbinePressure: 55, // in psi
  fuelLevel: 600, // in liters
  cabinPressure: 12, // in psi
  hydraulicFluidLevel: 3, // in liters
  oilPressure: 45, // in psi
};

// Simulate flight data change
setInterval(() => {
  // Simulate data changes
  flightParams.fuelLevel -= 0.5;
  flightParams.altitude += 50;
  flightParams.speed += 100;
  flightParams.engineTemperature += 0.5;
  // Update flight data
  io.emit("flightData", flightParams);
}, 6000); // Every 1 minutes

setInterval(() => {
  flightParams.altitude -= 100;
  flightParams.speed -= 20;
  io.emit("flightData", flightParams);
}, 600000);

io.on("connection", (socket) => {
  console.log("New client connected");

  // Send initial flight data
  socket.emit("flightData", flightParams);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
