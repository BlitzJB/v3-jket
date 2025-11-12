import { transporter } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

async function sendExpiredWarrantySample() {
  console.log('📧 Sending EXPIRED WARRANTY service reminder email...\n')
  
  try {
    // Create sample data with expired warranty to show different messaging
    const emailData = {
      customerName: 'Joshua Bharathi',
      machineName: 'Industrial Press Machine Elite 3000',
      serialNumber: 'IPM-E3000-2022-005',
      daysUntilService: -8, // 8 days overdue
      healthScore: 55,
      totalSavings: 450000,
      warrantyActive: false, // Expired warranty
      warrantyExpiryDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      scheduleUrl: 'https://example.com/machines/IPM-E3000-2022-005/service-request?source=warranty-reminder'
    }
    
    // Generate the HTML email with expired warranty messaging
    const html = generateServiceReminderHTML(emailData)
    
    // Send the email
    const info = await transporter.sendMail({
      from: 'joshuabharathi123@gmail.com',
      to: 'joshuabharathi2k4@gmail.com',
      subject: 'URGENT: Service Overdue - Industrial Press Machine Elite 3000 (Warranty Expired)',
      html: html
    })
    
    console.log('✅ Expired warranty sample email sent successfully!')
    console.log(`📬 Email sent to: joshuabharathi2k4@gmail.com`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log('\n⚠️  EXPIRED WARRANTY MESSAGING DIFFERENCES:')
    console.log('   ❌ NO "FREE WARRANTY SERVICE" banner (only for active warranties)')
    console.log('   📅 "Schedule Service" button (no "Free" text)')
    console.log('   💰 "Click to schedule your service appointment" (standard text)')
    console.log('   🔴 "Service charges may apply" in warranty status card')
    console.log('   📍 "Warranty: Expired" with red indicator')
    console.log('   🚨 Enhanced overdue warning without free service messaging')
    console.log('\n💡 Smart conditional messaging based on warranty status!')
    console.log('🎯 Check both emails to see the intelligent differentiation')
    
  } catch (error) {
    console.error('❌ Failed to send expired warranty sample email:', error)
  }
}

// Run the expired warranty email sender  
if (require.main === module) {
  sendExpiredWarrantySample().catch(console.error)
}

export { sendExpiredWarrantySample }