-- Expense Tracker Schema (SQLite)

PRAGMA foreign_keys = ON;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL CHECK (amount >= 0),
  category_id INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes to support filtering
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses (created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses (category_id);

-- View: expenses_enriched (joins expenses with category name)
CREATE VIEW IF NOT EXISTS expenses_enriched AS
SELECT
  e.id,
  e.amount,
  e.category_id,
  c.name AS category_name,
  e.notes,
  e.created_at
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id;

-- View: category_summary (total by category)
CREATE VIEW IF NOT EXISTS category_summary AS
SELECT
  c.id AS category_id,
  c.name AS category_name,
  COUNT(e.id) AS expense_count,
  COALESCE(SUM(e.amount), 0) AS total_amount
FROM categories c
LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id, c.name;

-- View: total_summary (overall totals)
CREATE VIEW IF NOT EXISTS total_summary AS
SELECT
  COUNT(e.id) AS expense_count,
  COALESCE(SUM(e.amount), 0) AS total_amount
FROM expenses e;
