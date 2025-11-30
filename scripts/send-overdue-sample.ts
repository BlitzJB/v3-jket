import { transporter } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

async function sendOverdueSample() {
  console.log('🚨 Sending OVERDUE warranty reminder sample...\n')
  
  try {
    // Create overdue sample data
    const emailData = {
      customerName: 'Joshua Bharathi',
      machineName: 'Heavy Duty Mixer Pro-5000',
      serialNumber: 'HDP-5000-JKT-002',
      daysUntilService: -12, // 12 days overdue
      healthScore: 45, // Lower health score for overdue
      totalSavings: 450000,
      warrantyActive: false, // Warranty expired
      warrantyExpiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      scheduleUrl: 'https://example.com/machines/HDP-5000-JKT-002/service-request?source=warranty-reminder'
    }
    
    // Generate the HTML email
    const html = generateServiceReminderHTML(emailData)
    
    // Send the email
    const info = await transporter.sendMail({
      from: 'joshuabharathi123@gmail.com',
      to: 'joshuabharathi2k4@gmail.com',
      subject: '🚨 URGENT: Service OVERDUE for Heavy Duty Mixer Pro-5000 (12 days overdue)',
      html: html
    })
    
    console.log('✅ Overdue sample email sent successfully!')
    console.log(`📬 Email sent to: joshuabharathi2k4@gmail.com`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log('\n🚨 Overdue Email Features:')
    console.log('   ⚠️ Red urgency indicators and warning messages')
    console.log('   🛡️ Expired warranty with AMC suggestion')
    console.log('   ❤️ Low health score: 45/100 with red progress bar')
    console.log('   💰 Higher savings potential: ₹4,50,000')
    console.log('   📅 12 days overdue with critical styling')
    console.log('   🚨 "Urgent Action Required" warning section')
    console.log('\n📬 Check both emails to see the full range of the template!')
    
  } catch (error) {
    console.error('❌ Failed to send overdue sample email:', error)
  }
}

// Run the overdue email sender
if (require.main === module) {
  sendOverdueSample().catch(console.error)
}

export { sendOverdueSample }