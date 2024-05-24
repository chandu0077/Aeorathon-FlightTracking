// controllers/HealthController.js
const getFlightPath = (req, res) => {
  console.log("###", req.query);

  const arrival = {
    latitude: req.query.arrivalLat,
    longitude: req.query.arrivalLon,
  };

  const destination = {
    latitude: req.query.destLat,
    longitude: req.query.destLon,
  };

  // const { arrival, destination } = req.body;

  console.log("ARR", arrival, destination);
  const axios = require("axios");
  const PriorityQueue = require("js-priority-queue");
  const fs = require("fs");
  const csv = require("csv-parser");

  const WEATHER_API_KEY = "4b5f8df2735724dbff6d04a16f44e48a";

  // Node class definition
  class Node {
    constructor(lat, lon, alt) {
      this.latitude = lat;
      this.longitude = lon;
      this.altitude = alt;
      this.weather = null;
      this.distance = Infinity;
      this.previous = null;
      this.edges = [];
    }

    updateWeather(weatherData) {
      this.weather = weatherData;
      console.log("FN - 4");
    }

    addEdge(neighbor, weight) {
      this.edges.push({ node: neighbor, weight: weight });
    }

    displayInfo() {
      console.log(
        `Node (Lat: ${this.latitude}, Lon: ${this.longitude}, Alt: ${this.altitude})`,
      );
      console.log(`  Weather: ${JSON.stringify(this.weather)}`);
      this.edges.forEach((edge) => {
        console.log(
          `  Edge to (Lat: ${edge.node.latitude}, Lon: ${edge.node.longitude}, Alt: ${edge.node.altitude}) with weight: ${edge.weight}`,
        );
      });
    }
  }

  // Fetch weather data for given coordinates
  async function fetchSurfaceWeatherData(lat, lon) {
    console.log("FN - 2");

    const url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch weather data for coordinates (${lat}, ${lon}): ${error}`,
      );
      return null;
    }
  }

  // Calculate weather conditions at a given altitude
  function calculateWeatherAtAltitude(surfaceWeather, altitude) {
    console.log("FN - 3");

    const lapseRate = 6.5 / 1000; // Temperature lapse rate in K/m
    const R = 287.05; // Specific gas constant for dry air in J/(kg·K)
    const g = 9.80665; // Gravitational acceleration in m/s²
    const M = 0.0289644; // Molar mass of Earth's air in kg/mol

    const surfaceTemp = surfaceWeather.main.temp - 273.15; // Convert Kelvin to Celsius
    const surfacePressure = surfaceWeather.main.pressure * 100; // Convert hPa to Pa
    const surfaceHumidity = surfaceWeather.main.humidity; // In percentage

    const tempAtAltitude = surfaceTemp - lapseRate * altitude;
    const tempAtAltitudeK = tempAtAltitude + 273.15; // Convert Celsius to Kelvin

    const pressureAtAltitude =
      surfacePressure *
      Math.exp(
        (-g * M * altitude) / ((R * (surfaceTemp + tempAtAltitudeK)) / 2),
      );

    const humidityAtAltitude = surfaceHumidity - (altitude / 1000) * 5;
    const humidityAtAltitudeClamped = Math.max(
      0,
      Math.min(100, humidityAtAltitude),
    ); // Clamp humidity between 0 and 100

    const windSpeedAtAltitude =
      surfaceWeather.wind.speed + (altitude / 1000) * 2; // Adjust wind speed based on altitude
    const windDirectionAtAltitude = surfaceWeather.wind.deg; // Assume wind direction remains constant

    const cloudCoverAtAltitude =
      surfaceWeather.clouds.all - (altitude / 1000) * 10;
    const cloudCoverAtAltitudeClamped = Math.max(
      0,
      Math.min(100, cloudCoverAtAltitude),
    ); // Clamp cloud cover between 0 and 100

    const visibilityAtAltitude =
      surfaceWeather.visibility + (altitude / 1000) * 1000; // Adjust visibility based on altitude
    const rain = surfaceWeather.rain ? surfaceWeather.rain["1h"] || 0 : 0;
    return {
      temp: tempAtAltitudeK,
      pressure: pressureAtAltitude / 100, // Convert Pa to hPa
      humidity: humidityAtAltitudeClamped,
      windSpeed: windSpeedAtAltitude,
      windDirection: windDirectionAtAltitude,
      cloudCover: cloudCoverAtAltitudeClamped,
      visibility: visibilityAtAltitude,
      rain: rain,
    };
  }

  // Read coordinates from CSV file
  function readCoordinatesFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const coordinates = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          coordinates.push({
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
          });
        })
        .on("end", () => {
          resolve(coordinates);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  async function initializeGrid(coordinates, altRange, cellSize) {
    console.log("FN - 1");
    const grid = [];
    for (let coord of coordinates) {
      const lat = coord.latitude;
      const lon = coord.longitude;
      const latLayer = [];
      for (let alt = altRange.min; alt <= altRange.max; alt += cellSize) {
        const node = new Node(lat, lon, alt);
        const surfaceWeather = await fetchSurfaceWeatherData(lat, lon);
        if (surfaceWeather) {
          const weatherAtAltitude = calculateWeatherAtAltitude(
            surfaceWeather,
            alt * 1000,
          ); // Convert km to meters
          node.updateWeather(weatherAtAltitude);
        }
        latLayer.push(node);
      }
      grid.push(latLayer);
    }

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const node = grid[i][j];
        if (i > 0) {
          const weight = calculateEdgeWeight(node, grid[i - 1][j]);
          node.addEdge(grid[i - 1][j], weight);
        }
        if (i < grid.length - 1) {
          const weight = calculateEdgeWeight(node, grid[i + 1][j]);
          node.addEdge(grid[i + 1][j], weight);
        }
        if (j > 0) {
          const weight = calculateEdgeWeight(node, grid[i][j - 1]);
          node.addEdge(grid[i][j - 1], weight);
        }
        if (j < grid[i].length - 1) {
          const weight = calculateEdgeWeight(node, grid[i][j + 1]);
          node.addEdge(grid[i][j + 1], weight);
        }
      }
    }
    console.log("FN - 7");
    console.log("GRID", grid);
    return grid;
  }

  function calculateEdgeWeight(node1, node2) {
    console.log("FN - 5");
    const rainDifference = Math.abs(node1.weather.rain - node2.weather.rain);
    const cloudCoverDifference = Math.abs(
      node1.weather.cloudCover - node2.weather.cloudCover,
    );

    const normalizedRainDifference = normalize(rainDifference);
    const normalizedCloudCoverDifference = normalize(cloudCoverDifference);

    const weight = normalizedRainDifference + normalizedCloudCoverDifference;

    return weight;
  }

  function normalize(value) {
    console.log("FN - 6");
    const minValue = 0;
    const maxValue = 100;
    return (value - minValue) / (maxValue - minValue);
  }

  // Implement Dijkstra's algorithm
  function dijkstra(grid, source, destination) {
    const queue = new PriorityQueue({
      comparator: (a, b) => a.distance - b.distance,
    });
    source.distance = 0;
    queue.queue(source);

    while (queue.length > 0) {
      const current = queue.dequeue();

      if (current === destination) {
        break;
      }

      current.edges.forEach((edge) => {
        const neighbor = edge.node;
        const weight = edge.weight;
        const altDistance = current.distance + weight;

        if (altDistance < neighbor.distance) {
          neighbor.distance = altDistance;
          neighbor.previous = current;
          queue.queue(neighbor);
        }
      });
    }

    const path = [];
    let currentNode = destination;
    while (currentNode) {
      path.unshift(currentNode);
      currentNode = currentNode.previous;
    }

    return path;
  }

  // Load coordinates and initialize grid
  const filePath = "indian_cities_coordinates.csv";
  readCoordinatesFromCSV(filePath)
    .then((coordinates) => {
      const altRange = { min: 0, max: 5 }; // Altitude range in km
      const cellSize = 1; // Cell size in degrees for latitude and longitude, and km for altitude

      initializeGrid(coordinates, altRange, cellSize).then((grid) => {
        const source = findNode(grid, arrival.latitude, arrival.longitude);
        const dest = findNode(
          grid,
          destination.latitude,
          destination.longitude,
        );
        if (!source || !dest) {
          // Handle case where nodes are not found
          console.error("Source or destination node not found.");
          res
            .status(404)
            .json({ error: "Source or destination node not found" });
          return;
        }
        const path = dijkstra(grid, source, dest);
        res.status(200).json({ path });

        // path.forEach((node) => node.displayInfo());
      });
    })
    .catch((error) => {
      console.error(`Error reading coordinates from CSV: ${error}`);
      res.status(500).json({ error: "Internal server error" });
    });
};
function findNode(grid, latitude, longitude) {
  // Loop through the grid to find the node with matching coordinates
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const node = grid[i][j];
      if (node.latitude === latitude && node.longitude === longitude) {
        return node;
      }
    }
  }
  return null; // Return null if node not found
}
module.exports = {
  getFlightPath,
};
