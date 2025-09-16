const expenseService = require('../services/expenses');

class ExpensesController {
  /**
   * PUBLIC_INTERFACE
   * Create a new expense.
   * Body: { amount: number, categoryId: number, notes?: string, createdAt?: ISO-String }
   */
  async create(req, res, next) {
    /** Create expense endpoint. Returns the created expense. */
    try {
      const data = await expenseService.createExpense(req.body || {});
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * List expenses with optional filters: startDate, endDate, categoryId, search, limit, offset, sortBy, sortDir
   */
  async list(req, res, next) {
    /** List expenses endpoint. */
    try {
      const data = await expenseService.getExpenses(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Update an expense by ID.
   * Body: partial expense fields { amount?, categoryId?, notes?, createdAt? }
   */
  async update(req, res, next) {
    /** Update expense endpoint. */
    try {
      const { id } = req.params;
      const data = await expenseService.updateExpense(id, req.body || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Delete an expense by ID.
   */
  async remove(req, res, next) {
    /** Delete expense endpoint. */
    try {
      const { id } = req.params;
      const ok = await expenseService.deleteExpense(id);
      return res.status(200).json({ success: true, deleted: ok });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get overall summary with optional date filters.
   */
  async summary(req, res, next) {
    /** Summary endpoint. */
    try {
      const data = await expenseService.getSummary(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Get category-wise summary with optional date filters.
   */
  async categorySummary(req, res, next) {
    /** Category summary endpoint. */
    try {
      const data = await expenseService.getCategorySummary(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Export filtered expenses to CSV.
   */
  async exportCsv(req, res, next) {
    /** CSV export endpoint. */
    try {
      const csv = await expenseService.exportCsv(req.query || {});
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
      return res.status(200).send(csv);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Chart data endpoint returning byDate and byCategory series.
   */
  async chartData(req, res, next) {
    /** Chart data endpoint. */
    try {
      const data = await expenseService.getChartData(req.query || {});
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * List categories.
   */
  async listCategories(req, res, next) {
    /** List categories endpoint. */
    try {
      const data = await expenseService.listCategories();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Create a new category by name.
   */
  async createCategory(req, res, next) {
    /** Create category endpoint. */
    try {
      const { name } = req.body || {};
      const data = await expenseService.createCategory(name);
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ExpensesController();
