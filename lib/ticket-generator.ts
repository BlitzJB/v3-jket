import { prisma } from "@/lib/prisma"

/**
 * Generates a friendly ticket ID in the format JKETCCMMYYXXXX
 * where:
 * - JKETCC: Prefix
 * - MM: Month (01-12)
 * - YY: Year (last 2 digits)
 * - XXXX: Serial number within this month and year (padded to 4 digits)
 */
export async function generateTicketFriendlyId(): Promise<string> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)

  const prefix = `JKETCC${month}${year}`

  // Find the highest serial number for this month and year
  const lastTicket = await prisma.serviceRequest.findFirst({
    where: {
      ticketFriendlyId: {
        startsWith: prefix
      }
    },
    orderBy: {
      ticketFriendlyId: 'desc'
    },
    select: {
      ticketFriendlyId: true
    }
  })

  let serialNumber = 1

  if (lastTicket) {
    // Extract the last 4 digits and increment
    const lastSerial = lastTicket.ticketFriendlyId.slice(-4)
    serialNumber = parseInt(lastSerial, 10) + 1
  }

  // Pad to 4 digits
  const serialString = String(serialNumber).padStart(4, '0')

  return `${prefix}${serialString}`
}
