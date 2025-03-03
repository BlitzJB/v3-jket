'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrReader } from 'react-qr-reader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ScanPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(true)

  const handleScan = (result: any) => {
    if (result?.text) {
      try {
        setIsScanning(false)
        // Extract serial number from URL like "https://care.jket.in/machine/TC-TM-18-01-2025-0002"
        const url = new URL(result.text)
        const serialNumber = url.pathname.split('/').pop()
        
        if (!serialNumber) {
          throw new Error('Invalid QR code format')
        }

        router.push(`/machines/${serialNumber}`)
      } catch (error) {
        console.error('Error parsing QR code:', error)
        toast.error('Invalid QR code format. Please try again or enter serial number manually.')
        setIsScanning(true)
      }
    } else if (result?.error) {
      console.error(result.error)
      toast.error('Error accessing camera. Please check permissions and try again.')
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
          <h1 className="text-2xl font-bold mb-4 text-center">Scan QR Code</h1>
          <p className="text-muted-foreground mb-8 text-center">
            Position the QR code on your machine within the camera frame to scan.
          </p>

          {/* QR Scanner */}
          <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg mb-8 relative">
            <div className="absolute inset-0 z-10">
              <QrReader
                constraints={{ 
                  facingMode: 'environment',
                  aspectRatio: 1,
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 640, ideal: 1280, max: 1920 }
                }}
                onResult={handleScan}
                videoId="qr-video"
                scanDelay={500}
                videoStyle={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                containerStyle={{
                  width: '100%',
                  height: '100%',
                  padding: 0
                }}
              />
            </div>

            {/* Scanner UI Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Corners */}
              <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-primary"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-primary"></div>
              
              {/* Scanning line animation */}
              <div className="animate-scan" />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Having trouble scanning?</p>
            <Link href="/customer/lookup" className="text-primary hover:underline">
              Enter serial number manually
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Add this to your global CSS file (app/globals.css)
const cssComment = `
@keyframes scan {
  0% {
    transform: translateY(0%);
  }
  50% {
    transform: translateY(97%);
  }
  100% {
    transform: translateY(0%);
  }
}

.animate-scan {
  animation: scan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
` 