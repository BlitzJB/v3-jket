import { transporter } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

async function sendProfessionalSample() {
  console.log('📧 Sending PROFESSIONAL warranty reminder email...\n')
  
  try {
    // Create professional sample data
    const emailData = {
      customerName: 'Joshua Bharathi',
      machineName: 'Industrial Mixer Pro 5000',
      serialNumber: 'IMP-5000-2024-001',
      daysUntilService: 7,
      healthScore: 72,
      totalSavings: 185000,
      warrantyActive: true,
      warrantyExpiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), // 150 days from now
      scheduleUrl: 'https://example.com/machines/IMP-5000-2024-001/service-request?source=warranty-reminder'
    }
    
    // Generate the new professional HTML email
    const html = generateServiceReminderHTML(emailData)
    
    // Send the email
    const info = await transporter.sendMail({
      from: 'joshuabharathi123@gmail.com',
      to: 'joshuabharathi2k4@gmail.com',
      subject: 'Service Reminder: Industrial Mixer Pro 5000 - Maintenance Due',
      html: html
    })
    
    console.log('✅ Professional sample email sent successfully!')
    console.log(`📬 Email sent to: joshuabharathi2k4@gmail.com`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log('\n🏢 NEW PROFESSIONAL DESIGN FEATURES:')
    console.log('   ✅ Clean, minimal ERP-style layout')
    console.log('   ✅ Your brand color #1a5f7a (teal) used consistently')
    console.log('   ✅ No gradients - solid professional colors only')
    console.log('   ✅ No rounded borders - sharp, business edges')
    console.log('   ✅ No emojis - professional text throughout')
    console.log('   ✅ Table-based structure like your warranty emails')
    console.log('   ✅ Professional typography and spacing')
    console.log('   ✅ Warranty status: Active until date shown')
    console.log('   ✅ Health score: 72/100 with clean progress bar')
    console.log('   ✅ Clean call-to-action button in brand color')
    console.log('\n📧 This should look MUCH more professional and ERP-like!')
    
  } catch (error) {
    console.error('❌ Failed to send professional sample email:', error)
  }
}

// Run the professional email sender
if (require.main === module) {
  sendProfessionalSample().catch(console.error)
}

export { sendProfessionalSample }