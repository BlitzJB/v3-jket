import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DefaultDashboard() {

  const session = await auth()

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
    redirect('/dashboard/admin')
  }

  if (session.user.role === 'USER') {
    redirect('/customer')
  }

  if (session.user.role === 'DISTRIBUTOR') {
    redirect('/dashboard/distributor')
  }

  if (session.user.role === 'SALES') {
    redirect('/dashboard/sales')
  }

  if (session.user.role === 'SERVICE_ENGINEER') {
    redirect('/dashboard/service')
  }

  if (session.user.role === 'CUSTOMER_SERVICE') {
    redirect('/dashboard/customer-service')
  }

  if (session.user.role === 'MANUFACTURER') {
    redirect('/dashboard/manufacturer')
  }

  if (session.user.role === 'QUALITY_TESTING') {
    redirect('/dashboard/quality-testing')
  }

  if (session.user.role === 'DISPATCH_MANAGER') {
    redirect('/dashboard/dispatch')
  }

  if (session.user.role === 'GUEST') {
    redirect('/dashboard/guest')
  }


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>This is the default dashboard for regular users.</p>
    </div>
  )
} 