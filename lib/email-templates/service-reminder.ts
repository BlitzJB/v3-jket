import { WarrantyHelper } from '../warranty-helper'

interface ReminderEmailData {
  customerName: string
  machineName: string
  serialNumber: string
  daysUntilService: number
  healthScore: number
  totalSavings: number
  scheduleUrl: string
}

export function generateServiceReminderHTML(data: ReminderEmailData): string {
  const urgency = WarrantyHelper.getUrgencyLevel(data.daysUntilService)
  
  const urgencyColor = {
    'OVERDUE': '#dc2626',
    'URGENT': '#f59e0b', 
    'SOON': '#3b82f6',
    'UPCOMING': '#10b981'
  }[urgency]
  
  const healthColor = data.healthScore >= 80 ? '#10b981' : 
                      data.healthScore >= 60 ? '#f59e0b' : '#dc2626'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: #1a5f7a; color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Service Reminder</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Keep your equipment running smoothly</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 24px; font-size: 16px;">Hello ${data.customerName},</p>
      
      <!-- Machine Info -->
      <div style="background: #f9fafb; border-left: 4px solid ${urgencyColor}; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px;">${data.machineName}</h2>
        <p style="margin: 0 0 8px; color: #6b7280;">Serial: ${data.serialNumber}</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${urgencyColor};">
          ${data.daysUntilService > 0 
            ? `Service due in ${data.daysUntilService} days`
            : data.daysUntilService === 0
            ? 'Service due today'
            : `Service ${Math.abs(data.daysUntilService)} days overdue`}
        </p>
      </div>
      
      <!-- Metrics -->
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Health Score</div>
          <div style="font-size: 32px; font-weight: bold; color: ${healthColor};">
            ${Math.round(data.healthScore)}/100
          </div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Total Savings</div>
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">
            ₹${data.totalSavings.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      
      ${urgency === 'OVERDUE' ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #dc2626;">
          <strong>⚠️ Important:</strong> Delaying service may affect your warranty coverage and increase breakdown risk.
        </p>
      </div>
      ` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.scheduleUrl}" style="
          display: inline-block;
          background: #1a5f7a;
          color: white;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
        ">Schedule Service Now</a>
      </div>
      
      <p style="margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        This link will expire in 7 days. For assistance, call <strong>1800 202 0051</strong> or email <strong>customer.support@jket.in</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `
}