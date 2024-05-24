// routes/healthRoutes.js
const express = require("express");
const router = express.Router();
const Path_controller = require("./Path_controller");

router.get("/", Path_controller.getFlightPath);

module.exports = router;
