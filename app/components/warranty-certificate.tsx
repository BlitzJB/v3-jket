import { format, addMonths } from "date-fns"

interface WarrantyCertificateProps {
  machine: {
    serialNumber: string
    manufacturingDate: string
    machineModel: {
      name: string
      warrantyPeriodMonths: number
      category: {
        name: string
      }
      catalogueFileUrl?: string
      userManualFileUrl?: string
    }
    sale: {
      saleDate: string
    }
    warrantyCertificate: {
      createdAt: string
      name: string
      address: string
      state: string
      zipCode: string
      country: string
    }
  }
}

export function generateWarrantyCertificateHTML({ machine }: WarrantyCertificateProps) {
  const warrantyStartDate = new Date(machine.warrantyCertificate.createdAt)
  const warrantyEndDate = addMonths(warrantyStartDate, machine.machineModel.warrantyPeriodMonths)

  // Check if documentation is available
  const hasDocumentation = machine.machineModel.catalogueFileUrl || machine.machineModel.userManualFileUrl;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .page {
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: linear-gradient(45deg, #14332d0a 25%, transparent 25%),
                            linear-gradient(-45deg, #14332d0a 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #14332d0a 75%),
                            linear-gradient(-45deg, transparent 75%, #14332d0a 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            z-index: 0;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #14332d;
          }
          .logo {
            width: 120px;
            height: auto;
            object-fit: contain;
          }
          .logo.jket {
            width: 150px;
          }
          .title-container {
            text-align: center;
            flex-grow: 1;
            margin: 0 20px;
          }
          .title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #14332d;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
            letter-spacing: 1px;
          }
          .section {
            margin-bottom: 25px;
            background: white;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #14332d;
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 2px solid #14332d30;
            display: flex;
            align-items: center;
          }
          .section-title::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 16px;
            background-color: #14332d;
            margin-right: 8px;
            border-radius: 2px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
          }
          .info-label {
            font-weight: bold;
            color: #14332d;
            font-size: 13px;
            min-width: 140px;
            position: relative;
            margin-right: 10px;
          }
          .info-label::after {
            content: ':';
            position: absolute;
            right: 0;
          }
          .info-value {
            font-size: 14px;
            flex-grow: 1;
            padding-left: 5px;
          }
          .warranty-text {
            text-align: justify;
            margin: 20px 0;
            line-height: 1.4;
            font-size: 10px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #14332d;
          }
          .footer {
            margin-top: 0px;
            text-align: center;
            color: #666;
            font-size: 6px;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 150px;
            color: rgba(26, 95, 122, 0.03);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }
          .page-break {
            page-break-before: always;
          }
          .terms-page {
            padding: 30px;
            background: white;
            position: relative;
          }
          .terms-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #2c3e50;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .terms-section {
            margin-bottom: 20px;
          }
          .terms-heading {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .terms-content {
            font-size: 13px;
            color: #34495e;
            margin-bottom: 15px;
            line-height: 1.6;
          }
          .terms-list {
            list-style-type: none;
            padding-left: 20px;
            margin: 10px 0;
          }
          .terms-list li {
            position: relative;
            padding-left: 15px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #34495e;
          }
          .terms-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #2c3e50;
          }
          .contact-info {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #2c3e50;
          }
          .contact-info p {
            margin: 5px 0;
            font-size: 13px;
            color: #34495e;
          }
          .documentation-box {
            background-color: #f0f7fa;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
          }
          .documentation-link {
            display: block;
            color: #14332d;
            text-decoration: none;
            margin: 10px 0;
            font-size: 14px;
            font-weight: bold;
          }
          .documentation-link:hover {
            text-decoration: underline;
          }
          @media print {
            body {
              background: white;
            }
            .page {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="background-pattern"></div>
          <div class="watermark">JKET</div>
          <div class="content">
            <div class="header">
              <img src="https://i.imgur.com/tV7kovY.png" alt="JKET Logo" class="logo jket" />
              <div class="title-container">
                <div class="title">Warranty Certificate</div>
                <div class="subtitle">JKET GREEN TECHNOLOGY PRIVATE LIMITED</div>
              </div>
              <img src="https://i.imgur.com/QxoIOhf.png" alt="Powerflush Logo" class="logo" />
            </div>

            <div class="section">
              <div class="section-title">Product Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Machine Model</div>
                  <div class="info-value">${machine.machineModel.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Category</div>
                  <div class="info-value">${machine.machineModel.category.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Serial Number</div>
                  <div class="info-value">${machine.serialNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Manufacturing Date</div>
                  <div class="info-value">${format(new Date(machine.manufacturingDate), 'PPP')}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Customer Name</div>
                  <div class="info-value">${machine.warrantyCertificate.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Address</div>
                  <div class="info-value">${machine.warrantyCertificate.address}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">State</div>
                  <div class="info-value">${machine.warrantyCertificate.state}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">ZIP Code</div>
                  <div class="info-value">${machine.warrantyCertificate.zipCode}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Warranty Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Purchase Date</div>
                  <div class="info-value">${format(new Date(machine.sale.saleDate), 'PPP')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Registration Date</div>
                  <div class="info-value">${format(warrantyStartDate, 'PPP')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Warranty Period</div>
                  <div class="info-value">${machine.machineModel.warrantyPeriodMonths} months</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Warranty Expiry</div>
                  <div class="info-value">${format(warrantyEndDate, 'PPP')}</div>
                </div>
              </div>
            </div>

            ${hasDocumentation ? `
            <div class="section">
              <div class="section-title">Product Documentation</div>
              <div class="documentation-box">
                ${machine.machineModel.catalogueFileUrl ? `
                <a href="${machine.machineModel.catalogueFileUrl}" class="documentation-link" target="_blank">
                  📄 Product Catalogue
                </a>` : ''}
                ${machine.machineModel.userManualFileUrl ? `
                <a href="${machine.machineModel.userManualFileUrl}" class="documentation-link" target="_blank">
                  📚 User Manual
                </a>` : ''}
              </div>
            </div>
            ` : ''}

            <div class="warranty-text">
              This certifies that the ${machine.machineModel.name}, serial number ${machine.serialNumber}, 
              purchased on ${format(new Date(machine.sale.saleDate), 'PPP')}, is covered by a limited warranty from 
              JKET GREEN TECHNOLOGY PRIVATE LIMITED for a period of ${machine.machineModel.warrantyPeriodMonths} months 
              from the date of purchase. During this period, JKET GREEN TECHNOLOGY PRIVATE LIMITED will repair or replace 
              any defective parts arising from material or workmanship issues, free of charge, under normal use and service 
              conditions, in accordance with the warranty terms and conditions. This warranty does not cover damages due to 
              misuse, improper installation, unauthorized modifications and purchased from unauthorized sources.
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="terms-page">
          <div class="background-pattern"></div>
          <div class="watermark">JKET</div>
          <div class="content">
            <div class="terms-title">Warranty Terms and Conditions</div>
            
            <div class="terms-section">
              <div class="terms-heading">1. General Warranty Coverage</div>
              <div class="terms-content">
                JKET GREEN TECHNOLOGY PRIVATE LIMITED warrants that the Machine (hereinafter referred to as "the Product") is free from defects in materials and workmanship under normal use for a period of ${machine.machineModel.warrantyPeriodMonths} months from the date of purchase, subject to the terms and conditions specified herein.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">2. Scope of Warranty</div>
              <div class="terms-content">
                The warranty covers defects in materials or workmanship but does not cover:
                <ul class="terms-list">
                  <li>Regular wear and tear.</li>
                  <li>Damage caused by misuse, improper installation, or negligence.</li>
                  <li>Any modifications or repairs made by unauthorized persons or entities.</li>
                  <li>Damage resulting from accidents, electrical power fluctuations, fire, water, or other external factors which has no control of the OEM.</li>
                  <li>Consumable parts (such as filters, fuses, or belts), Lubricants, Paint, Glass, Plastic parts unless found defective in manufacturing.</li>
                  <li>Preventive maintenance not carried out as per the instructions during warrantee Period.</li>
                  <li>Recommended spare parts or consumables have not be used during warrantee Period.</li>
                </ul>
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">3. Warranty Claim Process</div>
              <div class="terms-content">
                To claim warranty services, the customer must:
                <ul class="terms-list">
                  <li>Provide proof of purchase (e.g., invoice or receipt).</li>
                  <li>Notify JKET GREEN TECHNOLOGY PRIVATE LIMITED of the defect within 10 days after discovery.</li>
                  <li>Ship the defective Product to JKET GREEN TECHNOLOGY PRIVATE LIMITED or its authorized service center at the customer's expense (if applicable).</li>
                </ul>
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">4. Warranty Remedies</div>
              <div class="terms-content">
                Upon receipt of a valid warranty claim, JKET GREEN TECHNOLOGY PRIVATE LIMITED will, at its discretion:
                <ul class="terms-list">
                  <li>Repair or replace the defective Product or part at no additional charge to the customer.</li>
                  <li>Refund the purchase price of the Product, if repair or replacement is not possible.</li>
                </ul>
                Any repaired or replaced part will be covered under the remaining warranty period or 3 months, whichever is longer.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">5. Exclusions and Limitations</div>
              <div class="terms-content">
                This warranty is void if the Product:
                <ul class="terms-list">
                  <li>Is used in a manner other than its intended use.</li>
                  <li>Has been modified or altered without the written consent of JKET GREEN TECHNOLOGY PRIVATE LIMITED.</li>
                  <li>Shows signs of damage from improper installation or environmental factors.</li>
                </ul>
                The warranty does not cover travel expenses for on-site repairs or any incidental costs associated with returning the Product for warranty service.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">6. Limitation of Liability</div>
              <div class="terms-content">
                JKET GREEN TECHNOLOGY PRIVATE LIMITED will not be liable for any indirect, consequential, or incidental damages resulting from the use or inability to use the Product, even if JKET GREEN TECHNOLOGY PRIVATE LIMITED has been advised of the possibility of such damages. The maximum liability of JKET GREEN TECHNOLOGY PRIVATE LIMITED shall not exceed the purchase price of the Product.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">7. Customer Obligations</div>
              <div class="terms-content">
                The customer must:
                <ul class="terms-list">
                  <li>Operate and maintain the Product according to the provided user manual.</li>
                  <li>Notify JKET GREEN TECHNOLOGY PRIVATE LIMITED immediately if any defects arise.</li>
                  <li>Make the Product available for inspection by authorized service personnel if required.</li>
                </ul>
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">8. Governing Law</div>
              <div class="terms-content">
                This warranty is governed by the laws of Government of India, Chennai jurisdiction. Any disputes arising from this warranty will be settled in the courts of Chennai.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">9. Transferability</div>
              <div class="terms-content">
                This warranty is valid only for the original purchaser and is not transferable unless specified in writing by JKET GREEN TECHNOLOGY PRIVATE LIMITED.
              </div>
            </div>

            <div class="terms-section">
              <div class="terms-heading">10. Amendments</div>
              <div class="terms-content">
                JKET GREEN TECHNOLOGY PRIVATE LIMITED reserves the right to amend these warranty terms and conditions at any time, with changes applicable to future sales only.
              </div>
            </div>

            <div class="contact-info">
              <div class="terms-heading">Contact Information</div>
              <p><strong>JKET GREEN TECHNOLOGY PRIVATE LIMITED</strong></p>
              <p>Address: 2ND FLOOR, 85, RAJKILPAKKAM, EAST TAMBARAM, CHENNAI -600073, TAMILNADU</p>
              <p>Phone: Toll Free: 1800 202 0051 / 8925861789</p>
              <p>Email: customer.support@jket.in</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
} 