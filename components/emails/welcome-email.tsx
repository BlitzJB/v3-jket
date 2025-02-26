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
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  email: string
  password: string
  loginUrl: string
}

export function WelcomeEmail({ name, email, password, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Preview>Welcome to JKET Prime Care - Your Login Credentials</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={h1}>Welcome to JKET Prime Care</Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Thank you for registering with JKET Prime Care. We're excited to have you on board!
            </Text>
            <Text style={text}>
              Here are your login credentials:
            </Text>
            <Section style={credentialsBox}>
              <Text style={credentialsText}>
                Email: {email}
              </Text>
              <Text style={credentialsText}>
                Password: {password}
              </Text>
            </Section>
            <Text style={text}>
              You can sign in to your account at:{' '}
              <Link href={loginUrl} style={link}>
                {loginUrl}
              </Link>
            </Text>
            <Text style={text}>
              For security reasons, we recommend changing your password after your first login.
            </Text>
            <Text style={text}>
              If you have any questions, feel free to reach out to our support team.
            </Text>
            <Text style={text}>Best regards,</Text>
            <Text style={text}>The JKET Prime Care Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#19413A',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
}

const credentialsBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
}

const credentialsText = {
  color: '#19413A',
  fontSize: '16px',
  fontFamily: 'monospace',
  margin: '8px 0',
}

const link = {
  color: '#19413A',
  textDecoration: 'underline',
} 