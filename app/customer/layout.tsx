import Link from 'next/link'
import Image from 'next/image'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/customer" className="flex items-center space-x-2">
            <Image
              src="/logo-horizontal.svg"
              alt="JKET Logo"
              width={92}
              height={16}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} JKET. All rights reserved.</p>
            <p className="mt-2">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              {' · '}
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 