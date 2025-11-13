import * as cron from 'node-cron'
import { ReminderService } from '../services/reminder.service'

// Cron job state tracking for monitoring
export interface CronJobStatus {
  jobName: string
  schedule: string
  lastRun: Date | null
  lastSuccess: Date | null
  lastFailure: Date | null
  lastError: string | null
  totalRuns: number
  totalSuccess: number
  totalFailures: number
  isRunning: boolean
  nextRun: Date | null
}

class CronScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map()
  private status: Map<string, CronJobStatus> = new Map()
  private initialized: boolean = false

  /**
   * Ensure scheduler is initialized (idempotent)
   * Handles Next.js multi-context issue where instrumentation and API routes
   * may run in different Node.js contexts
   */
  ensureInitialized() {
    if (!this.initialized) {
      this.init()
    }
  }

  /**
   * Initialize all cron jobs
   */
  init() {
    if (this.initialized) {
      console.log('⚠️  Cron scheduler already initialized, skipping...')
      return
    }

    console.log('🔄 Initializing cron scheduler...')
    this.initialized = true

    // Daily warranty reminders at 9 AM
    this.scheduleJob(
      'daily-reminders',
      '0 9 * * *',  // Cron expression: 9 AM daily
      async () => {
        console.log('📧 Starting daily reminder processing...')
        try {
          const sentCount = await ReminderService.processReminders()
          console.log(`✅ Sent ${sentCount} warranty reminders`)
          return { success: true, remindersSent: sentCount }
        } catch (error) {
          console.error('❌ Error processing reminders:', error)
          throw error
        }
      }
    )

    // Optional: Weekly health check (every Sunday at 2 AM)
    this.scheduleJob(
      'weekly-health-check',
      '0 2 * * 0',  // Cron expression: 2 AM every Sunday
      async () => {
        console.log('🏥 Running weekly health check...')
        try {
          // Could add health check logic here
          console.log('✅ Health check completed')
          return { success: true }
        } catch (error) {
          console.error('❌ Health check failed:', error)
          throw error
        }
      }
    )

    console.log('✅ Cron scheduler initialized')
    this.logScheduledJobs()
  }

  private tasks: Map<string, () => Promise<any>> = new Map()

  /**
   * Schedule a cron job with monitoring
   */
  private scheduleJob(
    name: string,
    schedule: string,
    task: () => Promise<any>
  ) {
    // Store task for manual triggering
    this.tasks.set(name, task)

    // Initialize status tracking
    this.status.set(name, {
      jobName: name,
      schedule,
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      totalRuns: 0,
      totalSuccess: 0,
      totalFailures: 0,
      isRunning: false,
      nextRun: this.getNextRun(schedule)
    })

    // Create cron job
    const job = cron.schedule(
      schedule,
      async (context) => {
        const status = this.status.get(name)!

        // Mark as running
        status.isRunning = true
        status.lastRun = new Date()
        status.totalRuns++

        console.log(`\n${'='.repeat(60)}`)
        console.log(`🔄 Running cron job: ${name}`)
        console.log(`   Time: ${new Date().toISOString()}`)
        console.log(`   Run #${status.totalRuns}`)
        console.log('='.repeat(60))

        try {
          // Execute the task
          const result = await task()

          // Mark as success
          status.lastSuccess = new Date()
          status.totalSuccess++
          status.lastError = null
          status.isRunning = false
          status.nextRun = this.getNextRun(schedule)

          console.log(`✅ Cron job '${name}' completed successfully`)
          console.log(`   Result:`, result)
          console.log(`   Next run: ${status.nextRun?.toLocaleString()}`)
          console.log('='.repeat(60) + '\n')

          return result
        } catch (error) {
          // Mark as failure
          status.lastFailure = new Date()
          status.totalFailures++
          status.lastError = error instanceof Error ? error.message : String(error)
          status.isRunning = false
          status.nextRun = this.getNextRun(schedule)

          console.error(`❌ Cron job '${name}' failed`)
          console.error(`   Error:`, error)
          console.error(`   Next run: ${status.nextRun?.toLocaleString()}`)
          console.error('='.repeat(60) + '\n')

          throw error
        }
      },
      {
        timezone: 'Asia/Kolkata'
      }
    )

    this.jobs.set(name, job)
    console.log(`✅ Scheduled job: ${name} (${schedule})`)
  }

  /**
   * Get next run time for a cron schedule
   */
  private getNextRun(schedule: string): Date | null {
    try {
      const interval = cron.schedule(schedule, () => {})
      const nextRun = interval.getNextRun()
      interval.stop()
      return nextRun
    } catch {
      return null
    }
  }

  /**
   * Get status of all cron jobs
   */
  getStatus(): CronJobStatus[] {
    return Array.from(this.status.values())
  }

  /**
   * Get status of a specific job
   */
  getJobStatus(name: string): CronJobStatus | undefined {
    return this.status.get(name)
  }

  /**
   * Manually trigger a job (for testing)
   */
  async triggerJob(name: string): Promise<any> {
    const task = this.tasks.get(name)
    if (!task) {
      throw new Error(`Job '${name}' not found`)
    }

    console.log(`⚡ Manually triggering job: ${name}`)

    // Execute the task directly and update status
    const status = this.status.get(name)!
    status.isRunning = true
    status.lastRun = new Date()
    status.totalRuns++

    try {
      const result = await task()

      status.lastSuccess = new Date()
      status.totalSuccess++
      status.lastError = null
      status.isRunning = false

      return result
    } catch (error) {
      status.lastFailure = new Date()
      status.totalFailures++
      status.lastError = error instanceof Error ? error.message : String(error)
      status.isRunning = false

      throw error
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): boolean {
    const job = this.jobs.get(name)
    if (!job) {
      return false
    }

    job.stop()
    console.log(`⏸️  Stopped job: ${name}`)
    return true
  }

  /**
   * Start a specific job
   */
  startJob(name: string): boolean {
    const job = this.jobs.get(name)
    if (!job) {
      return false
    }

    job.start()
    console.log(`▶️  Started job: ${name}`)
    return true
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop()
      console.log(`⏸️  Stopped job: ${name}`)
    })
  }

  /**
   * Start all jobs
   */
  startAll() {
    this.jobs.forEach((job, name) => {
      job.start()
      console.log(`▶️  Started job: ${name}`)
    })
  }

  /**
   * Log all scheduled jobs
   */
  private logScheduledJobs() {
    console.log('\n📅 Scheduled Jobs:')
    console.log('━'.repeat(60))
    this.status.forEach((status) => {
      console.log(`  • ${status.jobName}`)
      console.log(`    Schedule: ${status.schedule}`)
      console.log(`    Next run: ${status.nextRun?.toLocaleString() || 'N/A'}`)
    })
    console.log('━'.repeat(60) + '\n')
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler()
