const app = require('./app');
const path = require('path');
const dotenv = require('dotenv');

// Load env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('../../expense_tracker_database/db');

// Prefer BACKEND_PORT (used by some orchestrators), then PORT, then default to 3001
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

// Utility to flush logs before exit to ensure diagnostics are visible in container logs
function flushAndExit(code) {
  try {
    // allow stdout/stderr to drain
    const onDrain = () => {
      // small delay to let streams flush
      setTimeout(() => process.exit(code), 10);
    };
    if (process.stdout.writableLength === 0 && process.stderr.writableLength === 0) {
      return onDrain();
    }
    const maybeExit = () => {
      if (process.stdout.writableLength === 0 && process.stderr.writableLength === 0) {
        onDrain();
      } else {
        setTimeout(maybeExit, 10);
      }
    };
    maybeExit();
  } catch (_) {
    process.exit(code);
  }
}

// Global diagnostics for uncaught/unhandled conditions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[fatal] Unhandled Promise Rejection at:', promise);
  console.error('[fatal] Reason:', reason && reason.stack ? reason.stack : reason);
  flushAndExit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught Exception:', err && err.stack ? err.stack : err);
  flushAndExit(1);
});

// Initialize database before starting server
(async () => {
  try {
    // Initialize DB and log path for diagnostics
    const dbPath = process.env.EXPENSE_DB_PATH || path.join(__dirname, '..', '..', 'data', 'expense_tracker.db');
    console.log(`[startup] Using database at: ${dbPath}`);

    // Log environment-derived settings for clarity (without leaking secrets)
    console.log('[startup] Env summary:', {
      NODE_ENV: process.env.NODE_ENV || 'development',
      HOST,
      PORT,
      EXPENSE_DB_PATH: process.env.EXPENSE_DB_PATH || '(default)',
    });

    await db.init();

    const server = app.listen(PORT, HOST, () => {
      console.log(`[startup] Server running at http://${HOST}:${PORT}`);
    });

    // Surface server binding errors early (e.g., EADDRINUSE, EACCES)
    server.on('error', (err) => {
      const details = {
        code: err && err.code,
        errno: err && err.errno,
        address: err && err.address,
        port: err && err.port,
        message: err && err.message,
        stack: err && err.stack,
      };
      console.error('[fatal] HTTP server failed to start. Details:', details);

      if (details.code === 'EADDRINUSE') {
        console.error('[hint] The specified port is already in use. Try changing BACKEND_PORT/PORT or stop the conflicting process.');
      } else if (details.code === 'EACCES') {
        console.error('[hint] Insufficient privileges to bind to the requested port or address. Use a higher port (>=1024) or adjust permissions.');
      }
      flushAndExit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[shutdown] SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('[shutdown] HTTP server closed');
        flushAndExit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[shutdown] SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('[shutdown] HTTP server closed');
        flushAndExit(0);
      });
    });

    module.exports = server;
  } catch (err) {
    const details = {
      name: err && err.name,
      message: err && err.message,
      code: err && err.code,
      errno: err && err.errno,
      path: err && err.path,
      stack: err && err.stack,
    };
    console.error('[fatal] Failed to initialize database. Detailed error:', details);

    // Provide hints for common DB initialization failures
    if (details.code === 'MODULE_NOT_FOUND' || /sqlite3/i.test(details.message || '')) {
      console.error('[hint] sqlite3 module may be missing or failed to build. Run npm install in expense_tracker_backend and ensure native build tools are available.');
    }
    if (details.code === 'ENOENT') {
      console.error('[hint] Database path not found. The app attempts to create directories, but verify EXPENSE_DB_PATH and file system permissions.');
    }
    if (details.code === 'EACCES' || /permission/i.test(details.message || '')) {
      console.error('[hint] File permission issue. Ensure the process has read/write permissions to the database directory.');
    }

    flushAndExit(1);
  }
})();
