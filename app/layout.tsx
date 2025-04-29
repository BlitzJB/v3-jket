import { Providers } from './providers'
import { Inter } from 'next/font/google'
import './globals.css'
// Import dynamic config
import './route-segment-config'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
