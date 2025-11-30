import { WarrantyHelper } from '../warranty-helper'

interface ReminderEmailData {
  customerName: string
  machineName: string
  serialNumber: string
  daysUntilService: number
  healthScore: number
  totalSavings: number
  warrantyActive: boolean
  warrantyExpiryDate: Date | null
  scheduleUrl: string
}

export function generateServiceReminderHTML(data: ReminderEmailData): string {
  const urgency = WarrantyHelper.getUrgencyLevel(data.daysUntilService)
  const healthScore = Math.round(data.healthScore)
  
  // Professional color palette - using brand colors
  const brandPrimary = '#1a5f7a'  // Your brand teal
  const brandSecondary = '#f8f9fa'  // Light gray
  const textPrimary = '#333333'    // Dark gray
  const textSecondary = '#666666'  // Medium gray
  const borderColor = '#e5e5e5'    // Light border
  const bgLight = '#f6f9fc'        // Very light blue-gray
  
  // Urgency-specific colors (professional palette)
  const urgencyStyles = {
    'OVERDUE': { color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' },
    'URGENT': { color: '#d97706', bgColor: '#fffbeb', borderColor: '#fed7aa' },
    'SOON': { color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
    'UPCOMING': { color: '#059669', bgColor: '#ecfdf5', borderColor: '#a7f3d0' }
  }
  
  const urgencyStyle = urgencyStyles[urgency]
  
  // Health score colors
  const healthColor = healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626'
  const healthBgColor = healthScore >= 80 ? '#ecfdf5' : healthScore >= 60 ? '#fffbeb' : '#fef2f2'
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const serviceStatusText = data.daysUntilService > 0 
    ? `Service due in ${data.daysUntilService} days`
    : data.daysUntilService === 0
    ? 'Service due today'
    : `Service ${Math.abs(data.daysUntilService)} days overdue`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Service Reminder - JKET Engineering</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .metrics-table { width: 100% !important; }
      .metric-cell { display: block !important; width: 100% !important; margin-bottom: 15px !important; }
      .main-content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${bgLight};">
    <tr>
      <td style="padding: 40px 20px;" align="center">
        
        <!-- Main Container -->
        <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 1px solid ${borderColor};">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandPrimary}; padding: 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                      JKET Engineering
                    </h1>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                      Service Reminder
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="main-content" style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 8px; color: ${textPrimary}; font-size: 20px; font-weight: 600;">
                      Hello ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 20px; color: ${textSecondary}; font-size: 16px; line-height: 1.5;">
                      Your machine requires scheduled maintenance to ensure optimal performance.
                    </p>
                    ${data.warrantyActive ? `
                    <div style="display: inline-block; background-color: #ecfdf5; border: 2px solid #059669; padding: 8px 16px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                        ✓ FREE WARRANTY SERVICE
                      </p>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Machine Information -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${urgencyStyle.bgColor}; border-left: 4px solid ${urgencyStyle.color}; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 8px; color: ${textPrimary}; font-size: 18px; font-weight: 600;">
                      ${data.machineName}
                    </h3>
                    <p style="margin: 0 0 15px; color: ${textSecondary}; font-size: 14px;">
                      Serial Number: <strong>${data.serialNumber}</strong>
                    </p>
                    <div style="display: inline-block; background-color: ${urgencyStyle.color}; color: #ffffff; padding: 8px 16px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${serviceStatusText}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Metrics -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="metrics-table" style="margin-bottom: 30px;">
                <tr>
                  <!-- Health Score -->
                  <td class="metric-cell" style="width: 32%; vertical-align: top; padding-right: 10px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${healthBgColor}; border: 1px solid ${borderColor};">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0 0 10px; color: ${textSecondary}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                            Health Score
                          </p>
                          <div style="font-size: 28px; font-weight: 700; color: ${healthColor}; line-height: 1; margin-bottom: 8px;">
                            ${healthScore}<span style="font-size: 16px; color: ${textSecondary};">/100</span>
                          </div>
                          <div style="background-color: #e5e5e5; height: 6px; width: 100%; margin: 10px 0;">
                            <div style="background-color: ${healthColor}; height: 6px; width: ${healthScore}%;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Total Savings -->
                  <td class="metric-cell" style="width: 36%; vertical-align: top; padding: 0 5px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border: 1px solid ${borderColor};">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0 0 10px; color: ${textSecondary}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                            Total Savings
                          </p>
                          <div style="font-size: 24px; font-weight: 700; color: #059669; line-height: 1;">
                            ₹${data.totalSavings.toLocaleString('en-IN')}
                          </div>
                          <p style="margin: 8px 0 0; color: #047857; font-size: 11px;">
                            with regular service
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Warranty Status -->
                  <td class="metric-cell" style="width: 32%; vertical-align: top; padding-left: 10px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${data.warrantyActive ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${borderColor};">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0 0 10px; color: ${textSecondary}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                            Warranty
                          </p>
                          <div style="font-size: 16px; font-weight: 700; color: ${data.warrantyActive ? '#059669' : '#dc2626'}; margin-bottom: 8px;">
                            ${data.warrantyActive ? 'Active' : 'Expired'}
                          </div>
                          <p style="margin: 0; color: ${textSecondary}; font-size: 11px;">
                            ${data.warrantyActive ? `Free service until ${formatDate(data.warrantyExpiryDate)}` : 'Service charges may apply'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Overdue Warning -->
              ${urgency === 'OVERDUE' ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 60px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background-color: #dc2626; color: #ffffff; text-align: center; line-height: 40px; font-weight: bold;">!</div>
                        </td>
                        <td style="vertical-align: top;">
                          <h4 style="margin: 0 0 8px; color: #dc2626; font-size: 16px; font-weight: 600;">Important Notice</h4>
                          <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                            Delaying service may affect your warranty coverage and increase the risk of equipment breakdown.${data.warrantyActive ? ' Your warranty service is still complimentary - schedule now to avoid losing this benefit.' : ''}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                <tr>
                  <td style="text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: ${brandPrimary}; padding: 15px 40px;">
                          <a href="${data.scheduleUrl}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; display: block;">
                            ${data.warrantyActive ? 'Schedule Free Service' : 'Schedule Service'}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0; color: ${textSecondary}; font-size: 12px;">
                      ${data.warrantyActive ? 'Complimentary warranty service • No charges apply' : 'Click to schedule your service appointment'}
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${brandSecondary}; padding: 30px; text-align: center; border-top: 1px solid ${borderColor};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 15px; color: ${textPrimary}; font-size: 16px; font-weight: 600;">
                      Need Assistance?
                    </h4>
                    <p style="margin: 0 0 15px; color: ${textSecondary}; font-size: 14px;">
                      <a href="tel:18002020051" style="color: ${brandPrimary}; text-decoration: none;">1800 202 0051</a>
                      &nbsp;|&nbsp;
                      <a href="mailto:customer.support@jket.in" style="color: ${brandPrimary}; text-decoration: none;">customer.support@jket.in</a>
                    </p>
                    <div style="border-top: 1px solid ${borderColor}; padding-top: 15px; color: ${textSecondary}; font-size: 12px;">
                      <p style="margin: 0;">© 2024 JKET Engineering Solutions Pvt. Ltd. All rights reserved.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `
}