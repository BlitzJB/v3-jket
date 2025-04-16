import * as React from 'react'
import {
  Html,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Heading,
  Button,
  Hr,
} from '@react-email/components'

interface WarrantyConfirmationEmailProps {
  customerName: string
  machineName: string
  serialNumber: string
  warrantyPeriodMonths: number
  warrantyEndDate: string
  machineUrl: string
  catalogueFileUrl?: string
  userManualFileUrl?: string
}

export function WarrantyConfirmationEmail({
  customerName,
  machineName,
  serialNumber,
  warrantyPeriodMonths,
  warrantyEndDate,
  machineUrl,
  catalogueFileUrl,
  userManualFileUrl,
}: WarrantyConfirmationEmailProps) {
  return (
    <Html>
      <Preview>Your Warranty Registration for {machineName} has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={h1}>Warranty Registration Confirmed</Heading>
            <Text style={text}>Hello {customerName},</Text>
            <Text style={text}>
              Thank you for registering your warranty with JKET. Your warranty registration for the following product has been confirmed:
            </Text>
            
            <Section style={productBox}>
              <Text style={productTitle}>{machineName}</Text>
              <Text style={productDetail}>
                Serial Number: <strong>{serialNumber}</strong>
              </Text>
              <Text style={productDetail}>
                Warranty Period: <strong>{warrantyPeriodMonths} months</strong>
              </Text>
              <Text style={productDetail}>
                Warranty Expiry: <strong>{warrantyEndDate}</strong>
              </Text>
            </Section>
            
            <Text style={text}>
              You can view your machine details and warranty information at any time by visiting your machine page:
            </Text>
            
            <Section style={{ textAlign: 'center', marginTop: '15px', marginBottom: '15px' }}>
              <Button
                href={machineUrl}
                style={button}
              >
                View Machine Details
              </Button>
            </Section>

            {(catalogueFileUrl || userManualFileUrl) && (
              <>
                <Text style={text}>
                  For your convenience, you can access the following documentation for your machine:
                </Text>
                <Section style={resourcesBox}>
                  {catalogueFileUrl && (
                    <Link href={catalogueFileUrl} style={resourceLink}>
                      📄 Product Catalogue
                    </Link>
                  )}
                  {userManualFileUrl && (
                    <Link href={userManualFileUrl} style={resourceLink}>
                      📚 User Manual
                    </Link>
                  )}
                </Section>
              </>
            )}
            
            <Hr style={hr} />
            
            <Text style={text}>
              If you have any questions or need assistance, please don't hesitate to contact our customer support:
            </Text>
            
            <Text style={contactDetail}>
              Email: <Link href="mailto:customer.support@jket.in" style={link}>customer.support@jket.in</Link>
            </Text>
            <Text style={contactDetail}>
              Phone: 1800 202 0051 / 8925861789
            </Text>
            
            <Text style={text}>
              Thank you for choosing JKET.
            </Text>
            
            <Text style={text}>Best regards,</Text>
            <Text style={text}>The JKET Customer Support Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  padding: '40px 20px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '5px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a5f7a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#1a5f7a',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
  padding: '10px 20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const link = {
  color: '#1a5f7a',
  textDecoration: 'underline',
}

const productBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '20px',
  borderLeft: '4px solid #1a5f7a',
}

const productTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
}

const productDetail = {
  margin: '5px 0',
  fontSize: '14px',
}

const resourcesBox = {
  backgroundColor: '#f0f7fa',
  borderRadius: '4px',
  padding: '15px',
  margin: '10px 0 20px 0',
}

const resourceLink = {
  display: 'block',
  color: '#1a5f7a',
  textDecoration: 'none',
  margin: '10px 0',
  fontSize: '16px',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #eaeaea',
  margin: '26px 0',
}

const contactDetail = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#666',
} 