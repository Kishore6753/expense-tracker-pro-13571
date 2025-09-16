const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

/**
 * Build and return the Swagger/OpenAPI spec.
 * Uses absolute paths to ensure JSDoc annotations are found regardless of CWD.
 */
function getSwaggerSpec() {
  const routesGlob = path.join(__dirname, 'src', 'routes', '*.js');
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Expense Tracker API',
        version: '1.0.0',
        description:
          'REST API for managing expenses, categories, summaries, CSV export, and chart data.',
      },
      tags: [
        { name: 'Expenses', description: 'Manage expenses' },
        { name: 'Summaries', description: 'Summary and analytics for expenses' },
        { name: 'Categories', description: 'Manage categories' },
      ],
    },
    apis: [routesGlob], // Use absolute path for robustness
  };

  return swaggerJSDoc(options);
}

module.exports = getSwaggerSpec;
