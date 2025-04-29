
import { NextResponse } from 'next/server'
import { transporter, emailConfig } from '@/lib/email/config'
import { render } from '@react-email/render'

export async function POST(request: Request) {
  try {
    const { to, subject, template } = await request.json()

    if (!to || !subject || !template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const html = await render(template)

    const info = await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
    })

    return NextResponse.json({ messageId: info.messageId })
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 