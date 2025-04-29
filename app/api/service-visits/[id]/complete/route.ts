
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { transporter, emailConfig } from "@/lib/email/config"
import { createElement } from "react"
import { render } from "@react-email/render"
import { ServiceRequestClosedEmail } from "@/components/emails/service-request-closed-email"

// Get emails to notify from environment variable
const EMAILS_TO_NOTIFY = process.env.EMAILS_TO_NOTIFY_CLOSE
  ? process.env.EMAILS_TO_NOTIFY_CLOSE.split(',').map(email => email.trim())
  : []

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission("support:write", async () => {
    try {
      const { id } = await params
      const { typeOfIssue, totalCost } = await req.json()

      // Update service visit
      const serviceVisit = await prisma.serviceVisit.update({
        where: { id },
        data: {
          status: 'CLOSED',
          typeOfIssue,
          totalCost,
        },
        include: {
          serviceRequest: {
            include: {
              machine: {
                include: {
                  machineModel: true,
                  sale: true
                }
              }
            }
          },
          engineer: true
        }
      })

      // Send email notification if email addresses are configured
      if (EMAILS_TO_NOTIFY.length > 0) {
        try {
          const { serviceRequest } = serviceVisit;
          const machine = serviceRequest.machine;
          
          // Convert URLs to use care.jket.in domain for production
          const serviceRequestUrl = `https://care.jket.in/dashboard/customer-service/requests/${serviceRequest.id}`;
          
          // Create and render the email
          const emailHtml = await render(
            createElement(ServiceRequestClosedEmail, {
              serviceRequestId: serviceRequest.id,
              machineName: machine.machineModel.name,
              serialNumber: machine.serialNumber,
              customerName: machine.sale?.customerName || 'N/A',
              typeOfIssue: typeOfIssue || 'Not specified',
              totalCost: totalCost || 0,
              engineerName: serviceVisit.engineer?.name || 'Not assigned',
              serviceRequestUrl: serviceRequestUrl
            })
          );

          // Send email notification
          await transporter.sendMail({
            from: emailConfig.from,
            to: EMAILS_TO_NOTIFY.join(','),
            subject: `Service Request #${serviceRequest.id} - Closed`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error('[EMAIL_NOTIFICATION_ERROR]', emailError);
          // Don't fail the request if email sending fails
        }
      }

      return NextResponse.json(serviceVisit)
    } catch (error) {
      console.error("[SERVICE_VISIT_COMPLETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 