/**
 * Test script for node-cron scheduler
 * This tests the cron scheduler without starting the full Next.js app
 */

import { cronScheduler } from '../lib/cron/scheduler'

console.log('🧪 Testing Cron Scheduler...\n')

// Initialize the scheduler
console.log('1️⃣  Initializing scheduler...')
cronScheduler.init()

console.log('\n2️⃣  Checking job status...')
const statuses = cronScheduler.getStatus()

console.log(`\n📊 Found ${statuses.length} scheduled jobs:\n`)
statuses.forEach(status => {
  console.log(`  Job: ${status.jobName}`)
  console.log(`  Schedule: ${status.schedule}`)
  console.log(`  Next Run: ${status.nextRun?.toLocaleString() || 'N/A'}`)
  console.log(`  Total Runs: ${status.totalRuns}`)
  console.log(`  Success: ${status.totalSuccess}`)
  console.log(`  Failures: ${status.totalFailures}`)
  console.log('')
})

// Test manual trigger
console.log('3️⃣  Testing manual trigger of daily-reminders job...\n')

setTimeout(async () => {
  try {
    console.log('⚡ Triggering job manually...\n')

    const result = await cronScheduler.triggerJob('daily-reminders')

    console.log('\n✅ Job executed successfully!')
    console.log('Result:', result)

    // Check status again
    console.log('\n4️⃣  Checking status after execution...\n')
    const updatedStatus = cronScheduler.getJobStatus('daily-reminders')

    if (updatedStatus) {
      console.log(`  Total Runs: ${updatedStatus.totalRuns}`)
      console.log(`  Total Success: ${updatedStatus.totalSuccess}`)
      console.log(`  Total Failures: ${updatedStatus.totalFailures}`)
      console.log(`  Last Run: ${updatedStatus.lastRun?.toLocaleString()}`)
      console.log(`  Last Success: ${updatedStatus.lastSuccess?.toLocaleString()}`)
      console.log(`  Next Run: ${updatedStatus.nextRun?.toLocaleString()}`)

      if (updatedStatus.totalSuccess > 0) {
        console.log('\n🎉 Test PASSED! Cron scheduler is working correctly!')
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test FAILED!')
    console.error('Error:', error)
    process.exit(1)
  }
}, 2000)
