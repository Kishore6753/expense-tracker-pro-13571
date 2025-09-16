const app = require('./app');
const path = require('path');
const dotenv = require('dotenv');

// Load env if present
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = require('../../expense_tracker_database/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database before starting server
(async () => {
  try {
    await db.init();
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running at http://${HOST}:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    module.exports = server;
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
