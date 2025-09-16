#!/bin/bash
cd /home/kavia/workspace/code-generation/expense-tracker-pro-13571/expense_tracker_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

