import React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SendEmailOptions {
  to: string
  subject: string
  template: React.ReactElement
}

interface UseEmailReturn {
  sendEmail: (options: SendEmailOptions) => Promise<void>
  isSending: boolean
}

export function useEmail(): UseEmailReturn {
  const [isSending, setIsSending] = useState(false)

  const sendEmail = async ({ to, subject, template }: SendEmailOptions) => {
    setIsSending(true)
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, template }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Email sent successfully')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
      throw error
    } finally {
      setIsSending(false)
    }
  }

  return { sendEmail, isSending }
} 