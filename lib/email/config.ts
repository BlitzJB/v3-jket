import nodemailer from 'nodemailer'

// Email configuration - all credentials from environment variables
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'JKET Prime Care'
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'

if (!SMTP_USER || !SMTP_PASS) {
  console.warn('⚠️  SMTP credentials not configured. Email sending will fail.')
  console.warn('   Please set SMTP_USER and SMTP_PASS environment variables.')
}

export const emailConfig = {
  from: `${SMTP_FROM_NAME} <${SMTP_USER}>`,
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})
