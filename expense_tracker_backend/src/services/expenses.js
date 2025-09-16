const db = require('../../../expense_tracker_database/db');

/**
 * Service for business logic around expenses and summaries.
 * Wraps the lower-level db.js helper and performs input validation/conversion.
 */

// PUBLIC_INTERFACE
async function createExpense(payload) {
  /** Creates a new expense. Payload: { amount, categoryId, notes?, createdAt? } */
  const { amount, categoryId, notes = '', createdAt = null } = payload || {};
  return db.insertExpense({ amount, categoryId, notes, createdAt });
}

// PUBLIC_INTERFACE
async function getExpenses(query = {}) {
  /** Lists expenses with optional filters and pagination. */
  const {
    startDate = null,
    endDate = null,
    categoryId = null,
    search = null,
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortDir = 'DESC',
  } = query;

  return db.listExpenses({
    startDate,
    endDate,
    categoryId: categoryId ? Number(categoryId) : null,
    search,
    limit: Number(limit),
    offset: Number(offset),
    sortBy,
    sortDir,
  });
}

// PUBLIC_INTERFACE
async function updateExpense(id, payload = {}) {
  /** Partially updates an expense by ID and returns the updated entity. */
  const normalized = {};
  if (payload.amount != null) normalized.amount = Number(payload.amount);
  if (payload.categoryId != null) normalized.categoryId = Number(payload.categoryId);
  if (payload.notes != null) normalized.notes = String(payload.notes);
  if (payload.createdAt != null) normalized.createdAt = String(payload.createdAt);
  return db.updateExpense(Number(id), normalized);
}

// PUBLIC_INTERFACE
async function deleteExpense(id) {
  /** Deletes an expense by ID. Returns true if deleted. */
  return db.deleteExpense(Number(id));
}

// PUBLIC_INTERFACE
async function getSummary(query = {}) {
  /** Returns overall totals with optional date filtering. */
  const { startDate = null, endDate = null } = query;
  return db.querySummary({ startDate, endDate });
}

// PUBLIC_INTERFACE
async function getCategorySummary(query = {}) {
  /** Returns category totals with optional date filtering. */
  const { startDate = null, endDate = null } = query;
  return db.queryCategorySummary({ startDate, endDate });
}

// PUBLIC_INTERFACE
async function exportCsv(query = {}) {
  /** Returns CSV string of expenses filtered by optional date and category. */
  const { startDate = null, endDate = null, categoryId = null } = query;
  return db.exportExpensesCsv({
    startDate,
    endDate,
    categoryId: categoryId ? Number(categoryId) : null,
  });
}

// PUBLIC_INTERFACE
async function getChartData(query = {}) {
  /**
   * Returns chart-ready data:
   * {
   *   byDate: [{ date: 'YYYY-MM-DD', total: number }],
   *   byCategory: [{ category_id, category_name, total_amount }]
   * }
   * Use existing list and category summary to compute grouped totals by day.
   */
  const { startDate = null, endDate = null, categoryId = null } = query;

  const list = await db.listExpenses({
    startDate,
    endDate,
    categoryId: categoryId ? Number(categoryId) : null,
    limit: 1000000,
    offset: 0,
    sortBy: 'created_at',
    sortDir: 'ASC',
  });

  // Group by date (YYYY-MM-DD)
  const dayTotals = new Map();
  for (const item of list) {
    const day = (item.created_at || '').slice(0, 10);
    const prev = dayTotals.get(day) || 0;
    dayTotals.set(day, prev + Number(item.amount || 0));
  }
  const byDate = Array.from(dayTotals.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byCategoryRaw = await db.queryCategorySummary({ startDate, endDate });
  const byCategory = byCategoryRaw.map(r => ({
    category_id: r.category_id,
    category_name: r.category_name,
    total_amount: Number(r.total_amount || 0),
    expense_count: Number(r.expense_count || 0),
  }));

  return { byDate, byCategory };
}

// PUBLIC_INTERFACE
async function listCategories() {
  /** Returns list of categories. */
  return db.listCategories();
}

// PUBLIC_INTERFACE
async function createCategory(name) {
  /** Creates a new category by name and returns it. */
  return db.insertCategory(String(name));
}

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getSummary,
  getCategorySummary,
  exportCsv,
  getChartData,
  listCategories,
  createCategory,
};
