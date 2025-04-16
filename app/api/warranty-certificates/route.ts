import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addMonths, format } from 'date-fns'
import { createElement } from 'react'
import { render } from '@react-email/render'
import { transporter, emailConfig } from '@/lib/email/config'
import { WarrantyConfirmationEmail } from '@/components/emails/warranty-confirmation-email'

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
        machineModel: {
          select: {
            id: true,
            name: true,
            warrantyPeriodMonths: true,
            catalogueFileUrl: true,
            userManualFileUrl: true,
          }
        }
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

    // Send warranty confirmation email
    try {
      const warrantyStartDate = new Date();
      const warrantyEndDate = addMonths(warrantyStartDate, machine.machineModel.warrantyPeriodMonths);
      const machineUrl = `${request.headers.get('origin')}/machines/${machine.serialNumber}`;
      
      // Only send email if customer email is available
      if (machine.sale?.customerEmail) {
        const emailHtml = await render(
          createElement(WarrantyConfirmationEmail, {
            customerName: name,
            machineName: machine.machineModel.name,
            serialNumber: machine.serialNumber,
            warrantyPeriodMonths: machine.machineModel.warrantyPeriodMonths,
            warrantyEndDate: format(warrantyEndDate, 'PPP'),
            machineUrl: machineUrl,
            catalogueFileUrl: machine.machineModel.catalogueFileUrl?.replace('http://', 'https://').replace('://', '://care.jket.in') || undefined,
            userManualFileUrl: machine.machineModel.userManualFileUrl?.replace('http://', 'https://').replace('://', '://care.jket.in') || undefined,
          })
        )

        await transporter.sendMail({
          from: emailConfig.from,
          to: machine.sale.customerEmail,
          subject: `Warranty Registration Confirmation - ${machine.machineModel.name}`,
          html: emailHtml,
        })
      }
    } catch (emailError) {
      console.error('Failed to send warranty confirmation email:', emailError)
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(warrantyCertificate)
  } catch (error) {
    console.error('[WARRANTY_CERTIFICATE_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 