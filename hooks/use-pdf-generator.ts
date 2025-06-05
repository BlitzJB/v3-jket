import { useState } from 'react'
import { toast } from 'sonner'

interface PdfGeneratorOptions {
  html: string
  options?: {
    format?: 'a4' | 'letter' | 'legal' | 'tabloid' | 'ledger'
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }
}

interface UsePdfGeneratorReturn {
  generatePdf: (options: PdfGeneratorOptions) => Promise<Blob>
  isGenerating: boolean
}
 
export function usePdfGenerator(): UsePdfGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = async ({ html, options }: PdfGeneratorOptions): Promise<Blob> => {
    setIsGenerating(true)

    try {
      const response = await fetch('https://pdf-jket.blitzdnd.com/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html, options }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to generate PDF')
      }

      const pdfBlob = await response.blob()
      return pdfBlob
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF')
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  return { generatePdf, isGenerating }
} 