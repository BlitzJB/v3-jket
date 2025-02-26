"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Search, MoreVertical, Eye, QrCode, Filter, X } from "lucide-react"
import Image from "next/image"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import QRCode from "qrcode"
import { PickerDialog } from "../log-test/picker-dialog"

interface Category {
    id: string
    name: string
    shortCode: string
    machineModels: MachineModel[]
}

interface MachineModel {
    id: string
    name: string
    shortCode: string
    coverImageUrl: string | null
    categoryId: string
}

interface Machine {
    id: string
    serialNumber: string
    manufacturingDate: Date
    testResultData: Record<string, any>
    testAdditionalNotes: string | null
    machineModel: {
        id: string
        name: string
        shortCode: string
        coverImageUrl: string | null
        category: {
            id: string
            name: string
            shortCode: string
        }
    }
}

interface QualityTestingHistoryTableProps {
    initialMachines: Machine[]
    categories: Category[]
}

export function QualityTestingHistoryTable({ initialMachines, categories }: QualityTestingHistoryTableProps) {
    const router = useRouter()
    const [machines] = useState(initialMachines)
    const [searchQuery, setSearchQuery] = useState("")
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedModel, setSelectedModel] = useState<string>("")

    // Reset model when category changes
    useEffect(() => {
        setSelectedModel("")
    }, [selectedCategory])

    // Generate QR codes for all machines on mount
    useEffect(() => {
        const generateQRCodes = async () => {
            const codes: Record<string, string> = {}
            for (const machine of machines) {
                try {
                    const qrCodeURL = `https://care.jket.in/machine/${machine.serialNumber}`
                    const qrCodeSVG = await QRCode.toString(qrCodeURL, {
                        type: 'svg',
                        margin: 1,
                        width: 64,
                    })
                    codes[machine.serialNumber] = qrCodeSVG
                } catch (error) {
                    console.error('Error generating QR code:', error)
                }
            }
            setQrCodes(codes)
        }
        generateQRCodes()
    }, [machines])

    const filteredMachines = machines.filter(machine => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = (
            machine.serialNumber.toLowerCase().includes(searchLower) ||
            machine.machineModel.name.toLowerCase().includes(searchLower) ||
            machine.machineModel.category.name.toLowerCase().includes(searchLower)
        )

        const matchesCategory = !selectedCategory || machine.machineModel.category.id === selectedCategory
        const matchesModel = !selectedModel || machine.machineModel.id === selectedModel

        return matchesSearch && matchesCategory && matchesModel
    })

    const getTestResultsSummary = (testResultData: Record<string, any>) => {
        const totalTests = Object.keys(testResultData).length
        const passedTests = Object.values(testResultData).filter(
            result => result.condition?.toLowerCase().includes('pass') ||
                result.condition?.toLowerCase().includes('good')
        ).length

        return {
            total: totalTests,
            passed: passedTests,
            status: passedTests === totalTests ? "success" : "warning"
        }
    }

    const handlePrintQRCode = async (serialNumber: string) => {
        try {
            const qrCodeURL = `https://care.jket.in/machine/${serialNumber}`
            const qrCodeSVG = await QRCode.toString(qrCodeURL, {
                type: 'svg',
                margin: 2,
            })

            // Create a new window for printing
            const printWindow = window.open('', '_blank')
            if (!printWindow) return

            // Set up the print layout with QR code and serial number
            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${serialNumber}</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .qr-container {
                width: 148mm; /* A4 width / 2 */
                height: 74mm;  /* A4 height / 4 */
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
              }
              .qr-code {
                width: 50mm;
                height: 50mm;
              }
              .serial-number {
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin-top: 8px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-code">
                ${qrCodeSVG}
              </div>
              <div class="serial-number">
                Serial Number: ${serialNumber}
              </div>
            </div>
          </body>
        </html>
      `)

            // Print and close the window
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        } catch (error) {
            console.error('Error generating QR code:', error)
        }
    }

    const columns = [
        {
            accessorKey: "serialNumber",
            header: "Serial Number",
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }: { row: { original: Machine } }) => (
                row.original.machineModel.category.name
            ),
        },
        {
            accessorKey: "model",
            header: "Model",
            cell: ({ row }: { row: { original: Machine } }) => (
                <div className="flex items-center gap-2">
                    {row.original.machineModel.coverImageUrl && (
                        <div className="relative w-8 h-8 rounded overflow-hidden">
                            <Image
                                src={row.original.machineModel.coverImageUrl}
                                alt={row.original.machineModel.name}
                                fill
                                className="object-cover border rounded-md"
                            />
                        </div>
                    )}
                    <span>{row.original.machineModel.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "manufacturingDate",
            header: "Manufacturing Date",
            cell: ({ row }: { row: { original: Machine } }) => (
                format(new Date(row.original.manufacturingDate), "PPP")
            ),
        },
        {
            accessorKey: "testResults",
            header: "Test Results",
            cell: ({ row }: { row: { original: Machine } }) => {
                const summary = getTestResultsSummary(row.original.testResultData)
                return (
                    <Badge>
                        {summary.total} Tests Assessed
                    </Badge>
                )
            },
        },
        {
            accessorKey: "qrCode",
            header: "QR Code",
            cell: ({ row }: { row: { original: Machine } }) => {
                const qrCode = qrCodes[row.original.serialNumber]
                if (!qrCode) return null

                return (
                    <div
                        className="w-16 h-16 cursor-pointer"
                        onClick={() => handlePrintQRCode(row.original.serialNumber)}
                        dangerouslySetInnerHTML={{ __html: qrCode }}
                    />
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }: { row: { original: Machine } }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-sm"
                            onClick={() => router.push(`/dashboard/quality-testing/history/${row.original.id}`)}
                        >
                            <Eye className="h-4 w-4 text-primary" />
                            <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-sm"
                            onClick={() => handlePrintQRCode(row.original.serialNumber)}
                        >
                            <QrCode className="h-4 w-4 text-primary" />
                            <span>Print QR Code</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search machines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <PickerDialog
                        type="category"
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelect={setSelectedCategory}
                        trigger={
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                {selectedCategory ? 
                                    categories.find(c => c.id === selectedCategory)?.name : 
                                    "Filter by Category"
                                }
                            </Button>
                        }
                    />
                    {selectedCategory && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCategory("")}
                            className="rounded-full h-6 w-6"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <PickerDialog
                        type="model"
                        categories={categories}
                        selectedCategory={selectedCategory}
                        selectedModel={selectedModel}
                        onSelect={setSelectedModel}
                        disabled={!selectedCategory}
                        trigger={
                            <Button variant="outline" className="gap-2" disabled={!selectedCategory}>
                                <Filter className="h-4 w-4" />
                                {selectedModel ? 
                                    categories
                                        .find(c => c.id === selectedCategory)
                                        ?.machineModels.find(m => m.id === selectedModel)?.name : 
                                    "Filter by Model"
                                }
                            </Button>
                        }
                    />
                    {selectedModel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedModel("")}
                            className="rounded-full h-6 w-6"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <DataTable
                columns={columns}
                data={filteredMachines}
                pagination
            />
        </div>
    )
} 