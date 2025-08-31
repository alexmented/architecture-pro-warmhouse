const fastify = require('fastify')({ logger: true });

function getLocationBySensorId(sensorId) {
  switch (sensorId) {
    case "1":
      return "Living Room";
    case "2":
      return "Bedroom";
    case "3":
      return "Kitchen";
    default:
      return "Unknown";
  }
}

function getSensorIdByLocation(location) {
  switch (location) {
    case "Living Room":
      return "1";
    case "Bedroom":
      return "2";
    case "Kitchen":
      return "3";
    default:
      return "0";
  }
}

function generateRandomTemperature() {
  const min = -10;
  const max = 40;
  return +(Math.random() * (max - min) + min).toFixed(1);
}

function buildTemperatureResponse({ location, sensorId }) {
  const value = generateRandomTemperature();
  return {
    value: value,
    unit: "°C",
    timestamp: new Date().toISOString(),
    location: location,
    status: "ok",
    sensor_id: sensorId,
    sensor_type: "thermometer",
    description: "temperature",
  };
}

fastify.get('/temperature', async (request, reply) => {
  const { location } = request.query;

  let resolvedLocation = location;
  if (!resolvedLocation) {
    resolvedLocation = "Living Room";
  }
  const resolvedSensorId = getSensorIdByLocation(resolvedLocation);

  return buildTemperatureResponse({ location: resolvedLocation, sensorId: resolvedSensorId });
});

fastify.get('/temperature/:sensorId', async (request, reply) => {
  const { sensorId } = request.params;
  const location = getLocationBySensorId(sensorId);
  return buildTemperatureResponse({ location, sensorId });
});

fastify.get('/temperature/v2', async (request, reply) => {
  const { deviceId } = request.params;
  const value = generateRandomTemperature();
  return { value, unit: "°C", timestamp: new Date().toISOString(), status: "ok", sensor_id: deviceId, sensor_type: "thermometer", description: "temperature" };
});


const start = async () => {
  try {
    await fastify.listen({ port: 8081, host: '0.0.0.0' });
    console.log('Temperature API server listening on http://localhost:8081');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();