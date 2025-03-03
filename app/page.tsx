import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Users2, Building2, Wrench, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo-horizontal.svg"
              alt="JKET Logo"
              width={92}
              height={16}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/customer">
              <Button>Customer Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-center">
            JKET Prime Care
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground text-center max-w-3xl mx-auto">
            Your trusted partner in industrial equipment management. We provide comprehensive solutions for equipment maintenance, warranty tracking, and customer support.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Employee Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/customer">
              <Button size="lg" variant="outline" className="gap-2">
                Customer Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Comprehensive Equipment Management
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Everything you need to manage your industrial equipment lifecycle
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
              <Card className="p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                  <Users2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Customer Support</h3>
                <p className="text-muted-foreground">
                  Dedicated support team available to assist with all your equipment needs
                </p>
              </Card>

              <Card className="p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Distributor Network</h3>
                <p className="text-muted-foreground">
                  Extensive network of authorized distributors ensuring quality service
                </p>
              </Card>

              <Card className="p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Service Management</h3>
                <p className="text-muted-foreground">
                  Efficient service request handling and maintenance tracking
                </p>
              </Card>

              <Card className="p-8 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Warranty Protection</h3>
                <p className="text-muted-foreground">
                  Comprehensive warranty coverage and easy claim processing
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

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