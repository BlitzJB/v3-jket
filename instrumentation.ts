/**
 * Next.js Instrumentation
 * This runs when the Next.js server starts
 * Perfect for initializing cron jobs
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { cronScheduler } = await import('./lib/cron/scheduler')

    console.log('🚀 Initializing cron scheduler via instrumentation...')
    cronScheduler.init()

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM received, stopping cron jobs...')
      cronScheduler.stopAll()
    })

    process.on('SIGINT', () => {
      console.log('⚠️  SIGINT received, stopping cron jobs...')
      cronScheduler.stopAll()
    })
  }
}
