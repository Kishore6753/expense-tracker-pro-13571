const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const getSwaggerSpec = require('../swagger');

// Initialize express app
const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set('trust proxy', true);

// Build base swagger spec once at startup
const baseSwaggerSpec = getSwaggerSpec();

// Serve Swagger UI with dynamic servers value based on request
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  try {
    const host = req.get('host') || 'localhost';
    const actualPort = req.socket && req.socket.localPort ? req.socket.localPort : undefined;
    const isSecure = req.secure || (req.headers['x-forwarded-proto'] === 'https');
    let protocol = isSecure ? 'https' : (req.protocol || 'http');

    // If host does not contain a port and the actual port is non-standard, append it
    const hasPort = host.includes(':');
    const needsPort =
      !hasPort &&
      ((protocol === 'http' && actualPort && actualPort !== 80) ||
       (protocol === 'https' && actualPort && actualPort !== 443));
    const fullHost = needsPort ? `${host}:${actualPort}` : host;

    const specWithServer = {
      ...baseSwaggerSpec,
      servers: [{ url: `${protocol}://${fullHost}` }],
    };

    return swaggerUi.setup(specWithServer)(req, res, next);
  } catch (e) {
    // Fallback to base spec if anything goes wrong
    return swaggerUi.setup(baseSwaggerSpec)(req, res, next);
  }
});

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

module.exports = app;
