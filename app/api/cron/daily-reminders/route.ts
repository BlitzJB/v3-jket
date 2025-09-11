import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/lib/services/reminder.service'

export async function GET(request: NextRequest) {
  // Verify cron secret (for Vercel Cron or similar)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    console.log('🔄 Starting daily reminder processing...')
    const sentCount = await ReminderService.processReminders()
    
    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}