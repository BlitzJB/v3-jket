import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { machineId, name, address, state, zipCode, country } = body

    // Validate machine exists and has been sold
    const machine = await prisma.machine.findFirst({
      where: {
        id: machineId,
        sale: {
          isNot: null,
        },
        warrantyCertificate: null, // Ensure no existing warranty
      },
      include: {
        sale: true,
      },
    })

    if (!machine) {
      return new NextResponse(
        'Machine not found, not sold, or warranty already registered',
        { status: 404 }
      )
    }

    // Create warranty certificate
    const warrantyCertificate = await prisma.warrantyCertificate.create({
      data: {
        machineId,
        name,
        address,
        state,
        zipCode,
        country: country || 'India',
      },
    })

    return NextResponse.json(warrantyCertificate)
  } catch (error) {
    console.error('[WARRANTY_CERTIFICATE_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 