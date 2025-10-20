import { jest } from '@jest/globals'

export const emailMock = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(undefined)
}

export const emailConfig = {
  from: 'test@example.com'
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
