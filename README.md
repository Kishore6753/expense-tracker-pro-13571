# Project Repository

Expense Tracker project with:
- Backend: Express API (expense_tracker_backend)
- SQLite database helper (expense_tracker_database)
- Optional Supabase integration for authentication and multi-tenant storage

Quick start (backend):
1. cd expense-tracker-pro-13571/expense_tracker_backend
2. cp .env.example .env  # adjust as needed
3. npm install
4. npm run dev
5. Visit /docs for Swagger UI (e.g., http://localhost:3000/docs)

Key Endpoints:
- GET /api/expenses
- POST /api/expenses
- PUT /api/expenses/:id
- DELETE /api/expenses/:id
- GET /api/summary
- GET /api/summary/categories
- GET /api/export/csv
- GET /api/chart-data
- GET /api/categories
- POST /api/categories

Supabase (optional):
- See assets/supabase.md for configuration, RLS policies, and auth callback details.
- Frontend expects REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_KEY if you enable auth.