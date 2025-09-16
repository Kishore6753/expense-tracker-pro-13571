const app = require('./app');
const path = require('path');
const dotenv = require('dotenv');

// Load env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('../../expense_tracker_database/db');

// Prefer BACKEND_PORT (used by some orchestrators), then PORT, then default to 3001
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database before starting server
(async () => {
  try {
    // Initialize DB and log path for diagnostics
    const dbPath = process.env.EXPENSE_DB_PATH || path.join(__dirname, '..', '..', 'data', 'expense_tracker.db');
    console.log(`[startup] Using database at: ${dbPath}`);
    await db.init();

    const server = app.listen(PORT, HOST, () => {
      console.log(`[startup] Server running at http://${HOST}:${PORT}`);
    });

    // Surface server binding errors early (e.g., EADDRINUSE)
    server.on('error', (err) => {
      console.error('[fatal] HTTP server failed to start:', err && err.code ? `${err.code}: ${err.message}` : err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[shutdown] SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('[shutdown] HTTP server closed');
        process.exit(0);
      });
    });

    module.exports = server;
  } catch (err) {
    console.error('[fatal] Failed to initialize database:', err);
    process.exit(1);
  }
})();
