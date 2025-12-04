/**
 * PUBLIC_INTERFACE
 * Minimal Express server entrypoint for Expense Tracker backend.
 * - Listens on process.env.PORT or 3001 by default (for preview system).
 * - Provides a basic health endpoint and root welcome message.
 * - Loads environment variables from .env if present.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.LOG_FORMAT || 'dev'));

// Health check
// PUBLIC_INTERFACE
app.get('/health', (req, res) => {
  /**
   * This route returns a simple JSON payload indicating the server is healthy.
   * Returns:
   *  - 200 OK with { status: 'ok', uptime: <seconds> }
   */
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root route
// PUBLIC_INTERFACE
app.get('/', (req, res) => {
  /**
   * Welcome route for the Expense Tracker API.
   * Returns:
   *  - 200 OK with a simple message and list of available public routes.
   */
  res.status(200).json({
    app: 'expense-tracker-pro-13571',
    message: 'Welcome to Expense Tracker API backend.',
    routes: [
      { method: 'GET', path: '/' },
      { method: 'GET', path: '/health' }
    ]
  });
});

// Port configuration: default to 3001 for preview
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Expense Tracker backend listening on port ${PORT}`);
});
