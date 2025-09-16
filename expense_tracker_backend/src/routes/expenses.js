const express = require('express');
const controller = require('../controllers/expenses');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Expenses
 *     description: Manage expenses
 *   - name: Summaries
 *     description: Summary and analytics for expenses
 *   - name: Categories
 *     description: Manage categories
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: List expenses
 *     description: Retrieve expenses with optional filters (date range, category, search) and pagination/sorting.
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *         description: ISO date-time inclusive lower bound
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *         description: ISO date-time inclusive upper bound
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Text search on notes
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [created_at, amount], default: created_at }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *     responses:
 *       200:
 *         description: A list of expenses
 */
router.get('/api/expenses', controller.list.bind(controller));

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create expense
 *     description: Add a new expense record.
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, categoryId]
 *             properties:
 *               amount: { type: number }
 *               categoryId: { type: integer }
 *               notes: { type: string }
 *               createdAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/api/expenses', controller.create.bind(controller));

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update expense
 *     description: Update an existing expense by ID (partial accepted).
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               categoryId: { type: integer }
 *               notes: { type: string }
 *               createdAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/api/expenses/:id', controller.update.bind(controller));

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete expense
 *     description: Delete an expense by ID.
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/api/expenses/:id', controller.remove.bind(controller));

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Overall summary
 *     description: Returns total amount and expense count with optional date filtering.
 *     tags: [Summaries]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Summary
 */
router.get('/api/summary', controller.summary.bind(controller));

/**
 * @swagger
 * /api/summary/categories:
 *   get:
 *     summary: Category summary
 *     description: Returns totals grouped by category with optional date filtering.
 *     tags: [Summaries]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Category summary
 */
router.get('/api/summary/categories', controller.categorySummary.bind(controller));

/**
 * @swagger
 * /api/export/csv:
 *   get:
 *     summary: Export expenses to CSV
 *     description: Export filtered expenses as a CSV file.
 *     tags: [Expenses]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/api/export/csv', controller.exportCsv.bind(controller));

/**
 * @swagger
 * /api/chart-data:
 *   get:
 *     summary: Chart data
 *     description: Returns chart-ready series by date and by category.
 *     tags: [Summaries]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Chart data
 */
router.get('/api/chart-data', controller.chartData.bind(controller));

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/api/categories', controller.listCategories.bind(controller));

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/api/categories', controller.createCategory.bind(controller));

module.exports = router;
