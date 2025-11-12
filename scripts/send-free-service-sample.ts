import { transporter } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

async function sendFreeServiceSample() {
  console.log('📧 Sending FREE SERVICE warranty reminder email...\n')
  
  try {
    // Create sample data with active warranty to showcase FREE service
    const emailData = {
      customerName: 'Joshua Bharathi',
      machineName: 'Heavy Duty Conveyor Belt System Pro',
      serialNumber: 'HDCBS-PRO-2024-002',
      daysUntilService: 5,
      healthScore: 78,
      totalSavings: 320000,
      warrantyActive: true,
      warrantyExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      scheduleUrl: 'https://example.com/machines/HDCBS-PRO-2024-002/service-request?source=warranty-reminder'
    }
    
    // Generate the HTML email with free service messaging
    const html = generateServiceReminderHTML(emailData)
    
    // Send the email
    const info = await transporter.sendMail({
      from: 'joshuabharathi123@gmail.com',
      to: 'joshuabharathi2k4@gmail.com',
      subject: 'Free Warranty Service: Heavy Duty Conveyor Belt System Pro - Maintenance Due',
      html: html
    })
    
    console.log('✅ FREE SERVICE sample email sent successfully!')
    console.log(`📬 Email sent to: joshuabharathi2k4@gmail.com`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log('\n💰 FREE SERVICE MESSAGING HIGHLIGHTS:')
    console.log('   ✅ "✓ FREE WARRANTY SERVICE" banner prominently displayed')
    console.log('   ✅ "Schedule Free Service" call-to-action button')
    console.log('   ✅ "Complimentary warranty service • No charges apply" below button')
    console.log('   ✅ "Free service until [date]" in warranty status card')
    console.log('   ✅ Enhanced urgency message about keeping free benefit')
    console.log('   ✅ Professional design maintained throughout')
    console.log('\n🎯 This should significantly increase customer response rates!')
    console.log('💡 The FREE service messaging is strategically placed for maximum impact')
    
  } catch (error) {
    console.error('❌ Failed to send free service sample email:', error)
  }
}

// Run the free service email sender
if (require.main === module) {
  sendFreeServiceSample().catch(console.error)
}

export { sendFreeServiceSample }