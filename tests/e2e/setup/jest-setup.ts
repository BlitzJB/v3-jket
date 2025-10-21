// Jest setup for E2E tests
// This file runs before each test file

// Set up test environment
process.env.NODE_ENV = 'test'
process.env.CRON_SECRET = 'test-secret-e2e'
process.env.SERVICE_INTERVAL_MONTHS = '3'
process.env.REMINDER_DAYS_BEFORE = '15'
process.env.AVG_PREVENTIVE_COST = '15000'
process.env.AVG_BREAKDOWN_COST = '200000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
