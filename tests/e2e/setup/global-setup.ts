import { TestDatabase } from './database'

export default async function globalSetup() {
  console.log('\n🔧 Setting up E2E test environment...\n')

  // Set up test environment variables
  process.env.CRON_SECRET = 'test-secret-e2e'
  process.env.SERVICE_INTERVAL_MONTHS = '3'
  process.env.REMINDER_DAYS_BEFORE = '15'
  process.env.AVG_PREVENTIVE_COST = '15000'
  process.env.AVG_BREAKDOWN_COST = '200000'
  process.env.SMTP_HOST = 'localhost'
  process.env.SMTP_PORT = '1025'
  process.env.SMTP_USER = 'test@test.com'
  process.env.SMTP_PASS = 'testpass'
  process.env.SMTP_FROM = 'test@jket.in'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

  // Try to initialize test database
  const testDb = new TestDatabase()
  try {
    await testDb.start()
    await testDb.cleanup() // Clean any existing test data
    console.log('✓ Test database initialized and cleaned\n')
  } catch (error) {
    console.log('⚠️  Could not initialize test database. E2E tests may fail.')
    console.log('   Make sure DATABASE_URL is set or test.db is accessible.\n')
  } finally {
    await testDb.stop()
  }
}
