import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Search } from 'lucide-react'

export default function CustomerPortal() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-center">
            Welcome to JKET Prime Care
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground text-center">
            Access your machine's warranty information and service support with ease.
            Simply scan your machine's QR code or enter the serial number.
          </p>
        </div>
      </div>

      {/* Options Section */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="p-4 bg-primary/5 rounded-full mb-4">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Scan QR Code</h2>
            <p className="text-muted-foreground mb-8">
              Quickly access your machine's information by scanning the QR code located on your machine.
            </p>
            <Link href="/customer/scan" className="mt-auto">
              <Button size="lg" className="w-full">
                Scan QR Code
              </Button>
            </Link>
          </Card>

          <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <div className="p-4 bg-primary/5 rounded-full mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Enter Serial Number</h2>
            <p className="text-muted-foreground mb-8">
              Don't have access to the QR code? Enter your machine's serial number manually.
            </p>
            <Link href="/customer/lookup" className="mt-auto">
              <Button size="lg" className="w-full">
                Enter Serial Number
              </Button>
            </Link>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
          <p className="text-muted-foreground">
            Contact our customer support at{' '}
            <a href="tel:+1234567890" className="text-primary hover:underline">
              123-456-7890
            </a>
            {' '}or email us at{' '}
            <a href="mailto:support@jket.com" className="text-primary hover:underline">
              support@jket.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 