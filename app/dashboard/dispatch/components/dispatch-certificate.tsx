
interface DispatchCertificateProps {
    machine: {
        serialNumber: string
        machineModel: {
            name: string
        }
    }
}
export function generateDispatchCertificateHTML({ machine }: DispatchCertificateProps) {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Statement</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            line-height: 1.5;
        }
        
        .document {
            max-width: 950px;
            margin: 0 auto;
            position: relative;
        }
        
        .header {
            background-color: #d1f714;
            padding: 20px;
            position: relative;
            height: 90px;
            display: flex;
            align-items: center;
        }
        
        .logo {
            height: 60px;
            margin-left: 10px;
        }
        
        .right-column {
            position: absolute;
            right: 0;
            top: 0;
            width: 120px;
            height: 100%;
            background-color: #00403d;
        }
        
        .profile-img {
            position: absolute;
            right: 40px;
            top: 100px;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            border: 5px solid white;
            z-index: 2;
            overflow: hidden;
            background-color: #f0f0f0;
        }
        
        .content {
            padding: 20px;
        }
        
        h1 {
            color: #333;
            font-size: 36px;
            margin-bottom: 20px;
        }
        
        .rating {
            background-color: #00403d;
            border-radius: 25px;
            width: 180px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .star {
            color: #ffd700;
            font-size: 26px;
            margin-right: 5px;
        }
        
        .greeting {
            font-size: 20px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .company-statement {
            margin-bottom: 20px;
            font-size: 15px;
        }
        
        .quality-checks {
            margin-bottom: 20px;
            font-size: 15px;
        }
        
        .check-item {
            margin-bottom: 10px;
        }
        
        .check-mark {
            color: #00403d;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .italic {
            font-style: italic;
        }
        
        .contact-info {
            margin-top: 40px;
            font-size: 15px;
        }
        
        .contact-label {
            font-weight: bold;
            display: inline-block;
            min-width: 100px;
        }
        
        .contact-line {
            margin-bottom: 0px;
        }
        
        .footer {
            background-color: #00403d;
            color: white;
            padding: 20px;
            position: relative;
            margin-top: 40px;
        }
        
        .footer-text {
            margin-bottom: 0px;
        }
        
        .jket-logo {
            height: 100px;
            width: auto;
            position: absolute;
            right: 130px;
            bottom: 0px;
            width: 100px;
        }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <img src="https://i.imgur.com/9WgBvEu.png" alt="Power Flush Logo" class="logo">
            <div class="right-column"></div>
        </div>
        
        <div class="profile-img">
            <img src="https://i.imgur.com/bbUjFsQ.png" alt="Chief Technical Officer" height="180px" width="180px">
        </div>
        
        <div class="content">
            <h1>QUALITY STATEMENT</h1>
            
            <div class="rating">
                <span class="star">★</span>
                <span class="star">★</span>
                <span class="star">★</span>
                <span class="star">★</span>
                <span class="star">★</span>
            </div>
            
            <div class="greeting">Dear Sir,</div>
            
            <div class="company-statement">
                At <span class="bold">JKET GREEN TECHNOLOGY PRIVATE LIMITED</span>, we take immense pride in delivering <span class="bold">high-quality equipment</span> that meets the highest industry standards. We are committed to ensuring that every product we manufacture undergoes <span class="italic">rigorous quality checks</span> and adheres to all relevant specifications and certifications.
            </div>
            
            <div class="quality-checks">
                We assure you that the <span class="bold">${machine.machineModel.name}</span>, serial number <span class="bold">${machine.serialNumber}</span>, dispatched to you has been subjected to comprehensive quality control procedures, including:
                <div class="check-item">
                    <span class="check-mark">✓</span><span class="bold">Material Inspection</span> Ensuring raw materials meet required specifications.
                </div>
                <div class="check-item">
                    <span class="check-mark">✓</span><span class="bold">Manufacturing Compliance</span> Strict adherence to standard operating procedures during production.
                </div>
                <div class="check-item">
                    <span class="check-mark">✓</span><span class="bold">Performance Testing</span> - Verifying operational efficiency and safety before dispatch.
                </div>
                <div class="check-item">
                    <span class="check-mark">✓</span><span class="bold">Final Inspection & Certification</span> - Ensuring the product meets all regulatory and customer-specific requirements.
                </div>
            </div>
            
            <div class="customer-support">
                Should you encounter any concerns regarding the quality or performance of the equipment, our <span class="bold">Customer Support Team</span> is readily available to assist you. Please refer to the <span class="italic">User Manual</span> for detailed operating instructions, maintenance guidelines, and warranty information.
            </div>
            
            <div style="margin-top: 20px;">
                We appreciate your trust in <span class="bold">JKET GREEN TECHNOLOGY PRIVATE LIMITED</span> and we look forward to supporting your business with reliable and high-quality solutions.
            </div>
            
            <div class="contact-info">
                <div class="bold">For any assistance, please contact us at:</div>
                <div class="contact-line"><span class="contact-label">Phone:</span> +91 8925861789</div>
                <div class="contact-line"><span class="contact-label">Email:</span> customer.support@jket.in</div>
                <div class="contact-line"><span class="contact-label">Toll Free No:</span> 1800 202 0051</div>
                <div class="contact-line"><span class="contact-label">Web Site:</span> www.jket.in</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">Best Regards,</div>
            <div class="footer-text">Chief Technical Officer</div>
            <div class="footer-text">JKET GREEN TECHNOLOGY PRIVATE LIMITED</div>
            
            <div class="jket-logo">
                <img src="https://i.imgur.com/TEopx7X.png" alt="JKET Logo" height="80px" width="auto">
            </div>
        </div>
    </div>
</body>
</html>
  `
}