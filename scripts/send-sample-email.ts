import { transporter } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

async function sendSampleEmail() {
  console.log('📧 Sending sample warranty reminder email...\n')
  
  try {
    // Create sample data for the email
    const emailData = {
      customerName: 'Joshua Bharathi',
      machineName: 'Industrial Grinder Pro XL-2024',
      serialNumber: 'IGP-2024-JKT-001',
      daysUntilService: 5,
      healthScore: 78,
      totalSavings: 275000,
      warrantyActive: true,
      warrantyExpiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      scheduleUrl: 'https://example.com/machines/IGP-2024-JKT-001/service-request?source=warranty-reminder'
    }
    
    // Generate the beautiful HTML email
    const html = generateServiceReminderHTML(emailData)
    
    // Send the email
    const info = await transporter.sendMail({
      from: 'joshuabharathi123@gmail.com',
      to: 'joshuabharathi2k4@gmail.com',
      subject: '🔧 Service Reminder: Your Industrial Grinder Pro XL-2024 (Due in 5 days)',
      html: html
    })
    
    console.log('✅ Sample email sent successfully!')
    console.log(`📬 Email sent to: joshuabharathi2k4@gmail.com`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log('\n🌟 Email Features Showcased:')
    console.log('   📧 Modern gradient design with professional branding')
    console.log('   🛡️ Active warranty status with expiry date')
    console.log('   ❤️ Health score: 78/100 with visual progress bar')
    console.log('   💰 Total savings: ₹2,75,000 with Indian formatting')
    console.log('   📅 Service due in 5 days with urgency indicators')
    console.log('   📱 Mobile-responsive design for all email clients')
    console.log('   🎨 Professional JKet Engineering branding')
    console.log('\n👀 Check your email inbox to see the stunning new design!')
    
  } catch (error) {
    console.error('❌ Failed to send sample email:', error)
  }
}

// Run the email sender
if (require.main === module) {
  sendSampleEmail().catch(console.error)
}

export { sendSampleEmail }