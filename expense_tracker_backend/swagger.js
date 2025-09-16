const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'REST API for managing expenses, categories, summaries, CSV export, and chart data.',
    },
    tags: [
      { name: 'Expenses', description: 'Manage expenses' },
      { name: 'Summaries', description: 'Summary and analytics for expenses' },
      { name: 'Categories', description: 'Manage categories' },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
