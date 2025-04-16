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

interface ServiceRequestClosedEmailProps {
  serviceRequestId: string
  machineName: string
  serialNumber: string
  customerName: string
  typeOfIssue: string
  totalCost: number
  engineerName: string
  serviceRequestUrl: string
}

export function ServiceRequestClosedEmail({
  serviceRequestId,
  machineName,
  serialNumber,
  customerName,
  typeOfIssue,
  totalCost,
  engineerName,
  serviceRequestUrl,
}: ServiceRequestClosedEmailProps) {
  return (
    <Html>
      <Preview>Service Request #{serviceRequestId} has been closed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={h1}>Service Request Closed</Heading>
            <Text style={text}>
              This is an automated notification that Service Request <strong>#{serviceRequestId}</strong> has been marked as closed.
            </Text>
            
            <Section style={detailsBox}>
              <Text style={detailsHeading}>Service Request Details</Text>
              <Text style={detailItem}>
                <strong>Machine:</strong> {machineName} (SN: {serialNumber})
              </Text>
              <Text style={detailItem}>
                <strong>Customer:</strong> {customerName}
              </Text>
              <Text style={detailItem}>
                <strong>Type of Issue:</strong> {typeOfIssue}
              </Text>
              <Text style={detailItem}>
                <strong>Total Cost:</strong> ₹{totalCost.toLocaleString('en-IN')}
              </Text>
              <Text style={detailItem}>
                <strong>Assigned Engineer:</strong> {engineerName}
              </Text>
            </Section>
            
            <Text style={text}>
              You can view the full details of this service request by clicking the button below:
            </Text>
            
            <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
              <Button
                href={serviceRequestUrl}
                style={button}
              >
                View Service Request
              </Button>
            </Section>
            
            <Hr style={hr} />
            
            <Text style={footerText}>
              This is an automated message from the JKET Customer Support System. Please do not reply to this email.
            </Text>
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

const detailsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  padding: '20px',
  marginTop: '20px',
  marginBottom: '20px',
  borderLeft: '4px solid #1a5f7a',
}

const detailsHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 15px 0',
  color: '#1a5f7a',
}

const detailItem = {
  margin: '8px 0',
  fontSize: '14px',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #eaeaea',
  margin: '26px 0',
}

const footerText = {
  color: '#666',
  fontSize: '12px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
} 