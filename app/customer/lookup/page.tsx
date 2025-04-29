'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LookupPage() {
  const router = useRouter()
  const [serialNumber, setSerialNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialNumber.trim()) {
      toast.error('Please enter a serial number')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/machines/${serialNumber}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Machine not found. Please check the serial number and try again.')
        } else {
          toast.error('An error occurred while looking up the machine.')
        }
        return
      }

      router.push(`/machines/${serialNumber}`)
    } catch (error) {
      console.error('Error looking up machine:', error)
      toast.error('An error occurred while looking up the machine.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href="/customer">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Enter Serial Number</h1>
          <p className="text-muted-foreground mb-8 text-center">
            Please enter your machine's serial number to access warranty information and service support.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="max-w-md mx-auto">
              <label htmlFor="serialNumber" className="block text-sm font-medium mb-2">
                Serial Number
              </label>
              <div className="relative">
                <Input
                  id="serialNumber"
                  placeholder="e.g., TC-TM-18-01-2025-0002"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can find the serial number on your machine or warranty card.
              </p>
            </div>

            <div className="flex justify-center">
              <Button type="submit" size="lg" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </>
                ) : (
                  'Look Up Machine'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Have a QR code instead?</p>
            <Link href="/customer/scan" className="text-primary hover:underline">
              Scan QR code
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}