// jest.setup.js
// Learn more: https://github.com/testing-library/jest-dom

// Set up environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.SERVICE_INTERVAL_MONTHS = '3'
process.env.REMINDER_DAYS_BEFORE = '15'
process.env.AVG_PREVENTIVE_COST = '15000'
process.env.AVG_BREAKDOWN_COST = '200000'
process.env.SMTP_HOST = 'smtp.test.com'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@test.com'
process.env.SMTP_PASS = 'testpass'
process.env.SMTP_FROM = 'test@jket.in'
