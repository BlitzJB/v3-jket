import { generateServiceReminderHTML } from '@/lib/email-templates/service-reminder'

describe('generateServiceReminderHTML', () => {
  const baseData = {
    customerName: 'John Doe',
    machineName: 'Industrial Mixer Pro',
    serialNumber: 'MX-2024-001',
    daysUntilService: 15,
    healthScore: 85,
    totalSavings: 185000,
    scheduleUrl: 'https://example.com/schedule/MX-2024-001'
  }

  describe('HTML Structure', () => {
    it('should generate valid HTML with all required elements', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')
      expect(html).toContain('<body')
      expect(html).toContain('</body>')
    })

    it('should include customer name', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('John Doe')
    })

    it('should include machine name and serial number', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('Industrial Mixer Pro')
      expect(html).toContain('MX-2024-001')
    })

    it('should include schedule URL as a link', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('href="https://example.com/schedule/MX-2024-001"')
      expect(html).toContain('Schedule Service Now')
    })

    it('should display health score', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('85/100')
    })

    it('should display total savings in Indian rupee format', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('₹1,85,000')
    })
  })

  describe('Service Timing Display', () => {
    it('should display positive days correctly', () => {
      const data = { ...baseData, daysUntilService: 10 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('Service due in 10 days')
    })

    it('should display zero days as "today"', () => {
      const data = { ...baseData, daysUntilService: 0 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('Service due today')
    })

    it('should display negative days as overdue', () => {
      const data = { ...baseData, daysUntilService: -5 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('Service 5 days overdue')
    })
  })

  describe('Urgency Color Coding', () => {
    it('should use red color for OVERDUE urgency', () => {
      const data = { ...baseData, daysUntilService: -3 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('#dc2626') // Red color for overdue
    })

    it('should use orange color for URGENT urgency', () => {
      const data = { ...baseData, daysUntilService: 2 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('#f59e0b') // Orange color for urgent
    })

    it('should use blue color for SOON urgency', () => {
      const data = { ...baseData, daysUntilService: 5 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('#3b82f6') // Blue color for soon
    })

    it('should use green color for UPCOMING urgency', () => {
      const data = { ...baseData, daysUntilService: 15 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('#10b981') // Green color for upcoming
    })
  })

  describe('Health Score Color Coding', () => {
    it('should use green color for high health score (≥80)', () => {
      const data = { ...baseData, healthScore: 85 }
      const html = generateServiceReminderHTML(data)

      // Should contain green color for health score
      expect(html).toMatch(/#10b981.*85\/100|85\/100.*#10b981/s)
    })

    it('should use orange color for medium health score (60-79)', () => {
      const data = { ...baseData, healthScore: 70 }
      const html = generateServiceReminderHTML(data)

      // Should contain orange color for health score
      expect(html).toMatch(/#f59e0b.*70\/100|70\/100.*#f59e0b/s)
    })

    it('should use red color for low health score (<60)', () => {
      const data = { ...baseData, healthScore: 45 }
      const html = generateServiceReminderHTML(data)

      // Should contain red color for health score
      expect(html).toMatch(/#dc2626.*45\/100|45\/100.*#dc2626/s)
    })
  })

  describe('Overdue Warning', () => {
    it('should show warning box when service is overdue', () => {
      const data = { ...baseData, daysUntilService: -10 }
      const html = generateServiceReminderHTML(data)

      expect(html).toContain('⚠️ Important')
      expect(html).toContain('Delaying service may affect your warranty coverage')
    })

    it('should not show warning box when service is not overdue', () => {
      const data = { ...baseData, daysUntilService: 5 }
      const html = generateServiceReminderHTML(data)

      expect(html).not.toContain('⚠️ Important')
      expect(html).not.toContain('Delaying service may affect your warranty coverage')
    })
  })

  describe('Contact Information', () => {
    it('should include customer support phone number', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('1800 202 0051')
    })

    it('should include customer support email', () => {
      const html = generateServiceReminderHTML(baseData)

      expect(html).toContain('customer.support@jket.in')
    })
  })
})
