import { ReminderService } from '../lib/services/reminder.service'

async function testReminderService() {
  console.log('🔄 Testing ReminderService directly...\n')
  
  try {
    const sentCount = await ReminderService.processReminders()
    console.log(`✅ ReminderService.processReminders() completed successfully`)
    console.log(`📧 Sent ${sentCount} reminders`)
    
    return true
  } catch (error) {
    console.error('❌ ReminderService.processReminders() failed:', error)
    return false
  }
}

testReminderService()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })