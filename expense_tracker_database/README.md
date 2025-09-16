# Expense Tracker Database

This is a lightweight SQLite-based database used by the Expense Tracker backend.

## Overview

- DB Engine: SQLite
- File location: Uses an env variable to determine path; default is `./data/expense_tracker.db` relative to the backend container root.
- Schema:
  - categories: Stores category metadata
  - expenses: Stores expenses with foreign key to categories
- Features:
  - Summary queries (total + by category)
  - Date filtering (>= startDate, <= endDate)
  - CRUD support for expenses and categories
  - CSV export-friendly views

## Environment Variables

Create/update your backend `.env` file with:

```
# Path to SQLite database file
EXPENSE_DB_PATH=./data/expense_tracker.db

# Optional: default categories seeded on init (comma-separated)
EXPENSE_DEFAULT_CATEGORIES=Food,Travel,Utilities,Entertainment,Health,Education,Other
```

Note: Do not commit secrets into version control. For local development, the backend will create the DB file and seed default categories if not present.

## Files

- `schema.sql` — full schema for the database, including tables, indexes, and views.
- `seed.sql` — optional seed data (default categories inserted by backend code dynamically; this seed file is a reference).
- `queries.sql` — commonly used query snippets for summaries, filtering, pagination, and export.
- `db.js` — Node.js helper for initializing and accessing the SQLite database (to be used by the backend code).
- `README.md` — this file.

## Integration with Backend (Express)

1. Ensure `sqlite3` dependency is installed in the backend package.json (or `better-sqlite3` if preferred). This implementation uses `sqlite3` classic callback API wrapped with promises for simplicity.

2. Import and initialize the DB in the backend:
   ```js
   // Example usage in expense_tracker_backend
   const db = require('../expense_tracker_database/db');

   // Initialize at server start
   (async () => {
     await db.init(); // creates file, runs schema, seeds categories if empty
   })();
   ```

3. Use provided helper functions for queries (see `db.js` JSDoc for details):
   - db.run, db.get, db.all for raw SQL
   - db.ensureSchema() and db.seedDefaultCategories()
   - db.querySummary({ startDate, endDate })
   - db.queryCategorySummary({ startDate, endDate })
   - db.listExpenses({ startDate, endDate, categoryId, search, limit, offset, sortBy, sortDir })
   - db.insertExpense({ amount, categoryId, notes, createdAt })
   - db.updateExpense(id, { amount?, categoryId?, notes?, createdAt? })
   - db.deleteExpense(id)
   - db.exportExpensesCsv({ startDate, endDate, categoryId }) // returns CSV string

## Migrations

For initial version, the schema is idempotent and handled by `db.ensureSchema()` at application start. Future migrations can be added with simple SQL migration files run in order.

## Notes

- SQLite enforces foreign keys only if PRAGMA foreign_keys=ON (enabled in `db.js`).
- Indexes are added on created_at and category_id to speed up filtering and summaries.
