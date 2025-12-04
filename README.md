# Expense Tracker - Backend (expense-tracker-pro-13571)

This repository contains a minimal Node.js/Express backend scaffold so the preview system can start the server.

## Quick start

- Ensure you have Node.js v18+ installed.
- Install dependencies:
  - npm install
- Start in development (with auto-reload):
  - npm run dev
- Start in production mode:
  - npm start

The server listens on port 3001 by default (configurable via PORT). Health endpoint: GET /health

## Scripts

- start: node src/server.js
- dev: nodemon with auto-reload
- build: no-op for this simple server

## Configuration

Copy .env.example to .env and adjust as needed. Do not commit .env.

Environment variables:
- PORT: default 3001
- LOG_FORMAT: dev, combined, common, tiny
- NODE_ENV: development | production | test