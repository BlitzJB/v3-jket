
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { transporter, emailConfig } from "@/lib/email/config"
import { createElement } from "react"
import { render } from "@react-email/render"
import { format } from "date-fns"
import { ServiceEngineerAssignedEmail } from "@/components/emails/service-engineer-assigned-email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission('support:write', async () => {
    const { id } = await params
    const { engineerId, serviceVisitDate, typeOfIssue, customerSupportNotes } = await req.json()

    // Validate request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        serviceVisit: true,
        machine: {
          include: {
            machineModel: true,
            sale: true
          }
        }
      },
    })

    if (!request) {
      return new NextResponse('Service request not found', { status: 404 })
    }

    if (request.serviceVisit) {
      return new NextResponse('Service visit already exists for this request', { status: 400 })
    }

    // Get engineer details
    const engineer = await prisma.user.findUnique({
      where: { id: engineerId },
      select: {
        name: true,
        email: true
      }
    })

    if (!engineer || !engineer.email) {
      return new NextResponse('Engineer not found or has no email', { status: 400 })
    }

    // Create service visit
    const visit = await prisma.serviceVisit.create({
      data: {
        serviceRequest: {
          connect: { id },
        },
        engineer: {
          connect: { id: engineerId },
        },
        serviceVisitDate: new Date(serviceVisitDate),
        typeOfIssue,
        customerSupportNotes,
        status: 'PENDING',
      },
    })

    // Send email notification to the engineer
    try {
      const formattedDate = format(new Date(serviceVisitDate), "PPP");
      const serviceVisitUrl = `https://care.jket.in/dashboard/service/visits/${visit.id}`
      
      const emailHtml = await render(
        createElement(ServiceEngineerAssignedEmail, {
          serviceRequestId: id,
          machineName: request.machine.machineModel.name,
          serialNumber: request.machine.serialNumber,
          customerName: request.machine.sale?.customerName || 'N/A',
          customerAddress: request.machine.sale?.customerAddress || 'N/A',
          customerPhoneNumber: request.machine.sale?.customerPhoneNumber || 'N/A',
          complaint: request.complaint || 'No complaint details provided',
          typeOfIssue: typeOfIssue,
          serviceVisitDate: formattedDate,
          engineerName: engineer.name || 'Service Engineer',
          serviceVisitUrl: serviceVisitUrl
        })
      );

      await transporter.sendMail({
        from: emailConfig.from,
        to: engineer.email,
        subject: `New Service Visit Assignment - Request #${id}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('[ENGINEER_EMAIL_NOTIFICATION_ERROR]', emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(visit)
  })
} 