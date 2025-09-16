 /**
  * SQLite database helper for Expense Tracker
  *
  * Provides initialization, schema management, and query helpers supporting:
  * - CRUD for expenses and categories
  * - Summary queries (total and per-category)
  * - Date range filtering
  * - CSV export for expenses
  */

 const fs = require('fs');
 const path = require('path');
 const sqlite3 = require('sqlite3').verbose();

 const DEFAULT_DB_PATH = process.env.EXPENSE_DB_PATH || path.join(__dirname, '..', 'data', 'expense_tracker.db');

 // Utility to promisify sqlite3
 function openDb(filePath) {
   return new Promise((resolve, reject) => {
     const db = new sqlite3.Database(filePath, (err) => {
       if (err) return reject(err);
       // Enable foreign keys
       db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
         if (pragmaErr) return reject(pragmaErr);
         resolve(db);
       });
     });
   });
 }

 function run(db, sql, params = []) {
   return new Promise((resolve, reject) => {
     db.run(sql, params, function (err) {
       if (err) return reject(err);
       resolve({ lastID: this.lastID, changes: this.changes });
     });
   });
 }

 function get(db, sql, params = []) {
   return new Promise((resolve, reject) => {
     db.get(sql, params, (err, row) => {
       if (err) return reject(err);
       resolve(row);
     });
   });
 }

 function all(db, sql, params = []) {
   return new Promise((resolve, reject) => {
     db.all(sql, params, (err, rows) => {
       if (err) return reject(err);
       resolve(rows);
     });
   });
 }

 async function ensureDirExists(filePath) {
   const dir = path.dirname(filePath);
   await fs.promises.mkdir(dir, { recursive: true });
 }

 async function readFile(filePath) {
   return fs.promises.readFile(filePath, 'utf8');
 }

 // PUBLIC_INTERFACE
 async function init() {
   /**
    * Initialize the SQLite database:
    * - Creates directories if needed
    * - Opens DB connection
    * - Applies schema
    * - Seeds default categories from ENV if categories table is empty
    */
   const dbPath = DEFAULT_DB_PATH;
   await ensureDirExists(dbPath);

   const db = await openDb(dbPath);

   // Apply schema
   const schemaPath = path.join(__dirname, 'schema.sql');
   const schema = await readFile(schemaPath);
   await run(db, 'BEGIN;');
   try {
     await run(db, schema);
     await run(db, 'COMMIT;');
   } catch (e) {
     await run(db, 'ROLLBACK;').catch(() => {});
     throw e;
   }

   // Seed default categories if not present
   await seedDefaultCategories(db);

   // Keep a singleton db connection
   module.exports._db = db;
   return db;
 }

 // Seed default categories from env or standardized fallback list
 async function seedDefaultCategories(db) {
   const row = await get(db, 'SELECT COUNT(*) AS cnt FROM categories;');
   if (row && row.cnt > 0) return;

   // Standardized default categories per task requirements
   const defaultList = [
     'Food & Groceries',
     'Transport/Travel',
     'Bills & Utilities',
     'Shopping',
     'Health & Fitness',
     'Entertainment',
     'Education',
     'Personal Care',
     'Other/Miscellaneous',
   ];

   const envList = (process.env.EXPENSE_DEFAULT_CATEGORIES || defaultList.join(','))
     .split(',')
     .map(s => s.trim())
     .filter(Boolean);

   await run(db, 'BEGIN;');
   try {
     for (const name of envList) {
       await run(db, 'INSERT OR IGNORE INTO categories (name) VALUES (?);', [name]);
     }
     await run(db, 'COMMIT;');
   } catch (e) {
     await run(db, 'ROLLBACK;').catch(() => {});
     throw e;
   }
 }

 // Resolve db instance
 async function dbInstance() {
   if (module.exports._db) return module.exports._db;
   return init();
 }

 // Helpers

 // PUBLIC_INTERFACE
 async function querySummary({ startDate = null, endDate = null } = {}) {
   /** Returns overall summary with optional date filtering. */
   const db = await dbInstance();
   const row = await get(
     db,
     `SELECT COUNT(e.id) AS expense_count, COALESCE(SUM(e.amount), 0) AS total_amount
      FROM expenses e
      WHERE (? IS NULL OR e.created_at >= ?)
        AND (? IS NULL OR e.created_at <= ?);`,
     [startDate, startDate, endDate, endDate]
   );
   return row || { expense_count: 0, total_amount: 0 };
 }

 // PUBLIC_INTERFACE
 async function queryCategorySummary({ startDate = null, endDate = null } = {}) {
   /** Returns category-wise totals with optional date filtering. */
   const db = await dbInstance();
   const rows = await all(
     db,
     `SELECT c.id AS category_id, c.name AS category_name,
             COUNT(e.id) AS expense_count, COALESCE(SUM(e.amount), 0) AS total_amount
      FROM categories c
      LEFT JOIN expenses e
        ON e.category_id = c.id
       AND (? IS NULL OR e.created_at >= ?)
       AND (? IS NULL OR e.created_at <= ?)
      GROUP BY c.id, c.name
      ORDER BY total_amount DESC;`,
     [startDate, startDate, endDate, endDate]
   );
   return rows;
 }

 // PUBLIC_INTERFACE
 async function listExpenses({
   startDate = null,
   endDate = null,
   categoryId = null,
   search = null,
   limit = 50,
   offset = 0,
   sortBy = 'created_at', // created_at|amount
   sortDir = 'DESC',      // ASC|DESC
 } = {}) {
   /** Lists expenses with filtering, pagination, and sorting. */
   const db = await dbInstance();
   const allowedSortBy = ['created_at', 'amount'];
   const allowedSortDir = ['ASC', 'DESC'];
   const orderBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
   const orderDir = allowedSortDir.includes(String(sortDir).toUpperCase()) ? String(sortDir).toUpperCase() : 'DESC';

   const params = [categoryId, categoryId, startDate, startDate, endDate, endDate];
   let sql = `
     SELECT e.id, e.amount, e.category_id, c.name AS category_name, e.notes, e.created_at
     FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id
     WHERE (? IS NULL OR e.category_id = ?)
       AND (? IS NULL OR e.created_at >= ?)
       AND (? IS NULL OR e.created_at <= ?)
   `;

   if (search) {
     sql += ` AND (e.notes LIKE '%' || ? || '%')`;
     params.push(search);
   }

   sql += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?;`;
   params.push(Number(limit) || 50, Number(offset) || 0);

   const rows = await all(db, sql, params);
   return rows;
 }

 // PUBLIC_INTERFACE
 async function insertExpense({ amount, categoryId, notes = '', createdAt = null }) {
   /** Inserts a new expense and returns the created row. */
   if (amount == null || isNaN(Number(amount))) {
     throw new Error('amount is required and must be a number');
   }
   if (!categoryId) {
     throw new Error('categoryId is required');
   }
   const db = await dbInstance();
   const createdAtValue = createdAt || new Date().toISOString();
   const res = await run(
     db,
     `INSERT INTO expenses (amount, category_id, notes, created_at) VALUES (?, ?, ?, ?);`,
     [Number(amount), categoryId, notes, createdAtValue]
   );
   return get(db, `SELECT * FROM expenses WHERE id = ?;`, [res.lastID]);
 }

 // PUBLIC_INTERFACE
 async function updateExpense(id, { amount, categoryId, notes, createdAt } = {}) {
   /** Partially updates an expense by id and returns the updated row. */
   if (!id) throw new Error('id is required');

   const db = await dbInstance();
   const fields = [];
   const params = [];

   if (amount != null) { fields.push('amount = ?'); params.push(Number(amount)); }
   if (categoryId != null) { fields.push('category_id = ?'); params.push(categoryId); }
   if (notes != null) { fields.push('notes = ?'); params.push(notes); }
   if (createdAt != null) { fields.push('created_at = ?'); params.push(createdAt); }

   if (fields.length === 0) {
     return get(db, 'SELECT * FROM expenses WHERE id = ?;', [id]);
   }

   params.push(id);
   const sql = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?;`;
   await run(db, sql, params);
   return get(db, 'SELECT * FROM expenses WHERE id = ?;', [id]);
 }

 // PUBLIC_INTERFACE
 async function deleteExpense(id) {
   /** Deletes an expense by id and returns true if a row was deleted. */
   if (!id) throw new Error('id is required');
   const db = await dbInstance();
   const res = await run(db, 'DELETE FROM expenses WHERE id = ?;', [id]);
   return res.changes > 0;
 }

 // PUBLIC_INTERFACE
 async function listCategories() {
   /** Returns all categories ordered by name. */
   const db = await dbInstance();
   return all(db, 'SELECT id, name FROM categories ORDER BY name ASC;');
 }

 // PUBLIC_INTERFACE
 async function insertCategory(name) {
   /** Creates a new category and returns it. */
   if (!name) throw new Error('name is required');
   const db = await dbInstance();
   const res = await run(db, 'INSERT INTO categories (name) VALUES (?);', [name]);
   return get(db, 'SELECT id, name FROM categories WHERE id = ?;', [res.lastID]);
 }

 // PUBLIC_INTERFACE
 async function exportExpensesCsv({ startDate = null, endDate = null, categoryId = null } = {}) {
   /**
    * Returns CSV string for expenses filtered by optional date range and category.
    * Columns: ID,Amount,Category,Notes,Created At
    */
   const rows = await listExpenses({
     startDate, endDate, categoryId,
     // Use full export defaults
     limit: 1000000,
     offset: 0,
     sortBy: 'created_at',
     sortDir: 'DESC',
   });

   const escapeCsv = (v) => {
     if (v == null) return '';
     const s = String(v);
     if (/[",\n]/.test(s)) {
       return `"${s.replace(/"/g, '""')}"`;
     }
     return s;
   };

   const headers = ['ID', 'Amount', 'Category', 'Notes', 'Created At'];
   const lines = [headers.join(',')];
   for (const r of rows) {
     lines.push([
       escapeCsv(r.id),
       escapeCsv(r.amount),
       escapeCsv(r.category_name || ''),
       escapeCsv(r.notes || ''),
       escapeCsv(r.created_at),
     ].join(','));
   }
   return lines.join('\n');
 }

 module.exports = {
   init,
   ensureSchema: init, // alias kept for clarity
   querySummary,
   queryCategorySummary,
   listExpenses,
   insertExpense,
   updateExpense,
   deleteExpense,
   listCategories,
   insertCategory,
   exportExpensesCsv,
   _db: null, // internal, do not use directly
 };
