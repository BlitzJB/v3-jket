export interface CapturedEmail {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  timestamp: Date
}

export class EmailCapture {
  private emails: CapturedEmail[] = []
  public mockTransport: any

  setup() {
    // Create a mock transporter that captures emails
    this.mockTransport = {
      sendMail: jest.fn(async (mailOptions) => {
        this.emails.push({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text,
          timestamp: new Date()
        })
        return { messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
      }),
      verify: jest.fn(async () => true)
    }

    return this.mockTransport
  }

  getEmails(): CapturedEmail[] {
    return [...this.emails]
  }

  getEmailsTo(email: string): CapturedEmail[] {
    return this.emails.filter(e => e.to === email)
  }

  getLastEmail(): CapturedEmail | undefined {
    return this.emails[this.emails.length - 1]
  }

  clear() {
    this.emails = []
    if (this.mockTransport?.sendMail) {
      this.mockTransport.sendMail.mockClear()
    }
  }

  assertEmailSent(to: string, subjectContains?: string): CapturedEmail {
    const email = this.emails.find(e =>
      e.to === to &&
      (!subjectContains || e.subject.includes(subjectContains))
    )

    if (!email) {
      const emailList = this.emails.length > 0
        ? this.emails.map(e => `  - ${e.to}: "${e.subject}"`).join('\n')
        : '  (no emails captured)'

      throw new Error(
        `Expected email to ${to}${subjectContains ? ` with subject containing "${subjectContains}"` : ''} but none found.\n` +
        `Captured ${this.emails.length} email(s):\n${emailList}`
      )
    }

    return email
  }

  assertNoEmailSent() {
    if (this.emails.length > 0) {
      const emailList = this.emails.map(e => `  - ${e.to}: "${e.subject}"`).join('\n')
      throw new Error(
        `Expected no emails to be sent, but ${this.emails.length} were sent:\n${emailList}`
      )
    }
  }

  getEmailCount(): number {
    return this.emails.length
  }
}
