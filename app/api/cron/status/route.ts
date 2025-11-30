import { NextRequest, NextResponse } from 'next/server'
import { cronScheduler } from '@/lib/cron/scheduler'

export async function GET(request: NextRequest) {
  try {
    // Ensure scheduler is initialized (handles Next.js multi-context issue)
    cronScheduler.ensureInitialized()

    // Get all cron job statuses
    const statuses = cronScheduler.getStatus()

    // Calculate some aggregate stats
    const totalRuns = statuses.reduce((sum, s) => sum + s.totalRuns, 0)
    const totalSuccess = statuses.reduce((sum, s) => sum + s.totalSuccess, 0)
    const totalFailures = statuses.reduce((sum, s) => sum + s.totalFailures, 0)
    const successRate = totalRuns > 0 ? (totalSuccess / totalRuns) * 100 : 0

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalJobs: statuses.length,
        totalRuns,
        totalSuccess,
        totalFailures,
        successRate: successRate.toFixed(2) + '%'
      },
      jobs: statuses.map(status => ({
        ...status,
        lastRun: status.lastRun?.toISOString() || null,
        lastSuccess: status.lastSuccess?.toISOString() || null,
        lastFailure: status.lastFailure?.toISOString() || null,
        nextRun: status.nextRun?.toISOString() || null,
        status: status.isRunning ? 'RUNNING' : 'IDLE',
        health: status.lastFailure && status.lastSuccess
          ? (status.lastSuccess > status.lastFailure ? 'HEALTHY' : 'UNHEALTHY')
          : (status.totalSuccess > 0 ? 'HEALTHY' : 'UNKNOWN')
      }))
    })
  } catch (error) {
    console.error('Error getting cron status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cron status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Manual trigger endpoint (for testing)
export async function POST(request: NextRequest) {
  try {
    const { jobName, secret } = await request.json()

    // Verify secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!jobName) {
      return NextResponse.json(
        { success: false, error: 'jobName is required' },
        { status: 400 }
      )
    }

    // Ensure scheduler is initialized (handles Next.js multi-context issue)
    cronScheduler.ensureInitialized()

    console.log(`⚡ Manual trigger requested for job: ${jobName}`)

    // Trigger the job
    const result = await cronScheduler.triggerJob(jobName)

    return NextResponse.json({
      success: true,
      message: `Job '${jobName}' executed successfully`,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering cron job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger job',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
