import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'QUALITY_TESTING'
  | 'DISPATCH_MANAGER'
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'SERVICE_ENGINEER'
  | 'CUSTOMER_SERVICE'
  | 'SALES'
  | 'USER'
  | 'GUEST'

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold mb-4">Session Data</h1>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}