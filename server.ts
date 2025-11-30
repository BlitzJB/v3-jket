import { cronScheduler } from './lib/cron/scheduler'

// Initialize cron scheduler when server starts
console.log('🚀 Starting server...')

// Start cron jobs
cronScheduler.init()

console.log('✅ Server initialization complete')

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, stopping cron jobs...')
  cronScheduler.stopAll()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, stopping cron jobs...')
  cronScheduler.stopAll()
  process.exit(0)
})
