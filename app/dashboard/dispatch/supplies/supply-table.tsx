"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Building2, Globe, Calendar, MoreVertical, Pencil, File, User, Phone, Mail, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { generateDispatchCertificateHTML } from "../components/dispatch-certificate"
import { usePdfGenerator } from "@/hooks/use-pdf-generator"
import { usePermission } from "@/lib/rbac/client"

interface Supply {
  id: string
  supplyDate: Date
  sellBy: Date
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      shortCode: string
      category: {
        id: string
        name: string
        shortCode: string
      }
    }
    return: {
      id: string
      returnDate: Date
      returnReason: string
    } | null
    sale?: {
      id: string
      saleDate: Date
      customerName: string
      customerContactPersonName: string
      customerEmail: string
      customerPhoneNumber: string
      customerAddress: string
      distributorInvoiceNumber?: string | null
    } | null
    warrantyCertificate?: any
    serviceRequests?: any[]
  }
  distributor: {
    id: string
    name: string
    organizationName: string
    region: string
  }
  canDelete?: boolean
  dependencies?: string[]
}

interface SupplyTableProps {
  initialSupplies: Supply[]
}

export function SupplyTable({ initialSupplies }: SupplyTableProps) {
  const router = useRouter()
  const [supplies, setSupplies] = useState<Supply[]>(initialSupplies)
  const [search, setSearch] = useState('')
  const [supplyToDelete, setSupplyToDelete] = useState<Supply | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [supplyDeletionStatus, setSupplyDeletionStatus] = useState<Record<string, { canDelete: boolean, dependencies: string[] }>>({})
  const { generatePdf } = usePdfGenerator()
  
  // Check if user is SUPER_ADMIN
  const isSuperAdmin = usePermission('*')

  // Check deletion status for all supplies (only for SUPER_ADMIN)
  useEffect(() => {
    if (!isSuperAdmin) return

    const checkDeletionStatus = async () => {
      const statusMap: Record<string, { canDelete: boolean, dependencies: string[] }> = {}
      
      for (const supply of supplies) {
        try {
          const response = await fetch(`/api/dispatch/supplies/${supply.id}`)
          if (response.ok) {
            const data = await response.json()
            statusMap[supply.id] = {
              canDelete: data.canDelete || false,
              dependencies: data.dependencies || []
            }
          }
        } catch (error) {
          console.error('Error checking deletion status:', error)
          statusMap[supply.id] = { canDelete: false, dependencies: [] }
        }
      }
      
      setSupplyDeletionStatus(statusMap)
    }
    
    checkDeletionStatus()
  }, [supplies, isSuperAdmin])

  const filteredSupplies = supplies.filter((supply) => {
    const searchLower = search.toLowerCase()
    return (
      supply.machine.serialNumber.toLowerCase().includes(searchLower) ||
      supply.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      supply.machine.machineModel.category.name.toLowerCase().includes(searchLower) ||
      supply.distributor.organizationName.toLowerCase().includes(searchLower) ||
      supply.distributor.region.toLowerCase().includes(searchLower) ||
      supply.machine.sale?.customerName.toLowerCase().includes(searchLower) ||
      supply.machine.sale?.customerContactPersonName.toLowerCase().includes(searchLower) ||
      supply.machine.sale?.customerEmail.toLowerCase().includes(searchLower)
    )
  })

  // Check if this is a direct-to-customer supply
  const isDirectToCustomer = (supply: Supply) => {
    return supply.distributor.organizationName === "JKET D2C"
  }

  const handleDeleteSupply = async (supply: Supply) => {
    if (!isSuperAdmin) {
      toast.error('You do not have permission to delete supplies')
      return
    }

    const status = supplyDeletionStatus[supply.id]
    if (!status?.canDelete) {
      toast.error('Cannot delete supply with existing dependencies')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/dispatch/supplies/${supply.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete supply')
      }

      // Remove supply from local state
      setSupplies(prev => prev.filter(s => s.id !== supply.id))
      toast.success('Supply deleted successfully. Machine returned to inventory.')
      router.refresh()
    } catch (error) {
      console.error('Error deleting supply:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete supply')
    } finally {
      setIsDeleting(false)
      setSupplyToDelete(null)
    }
  }

  const handleGenerateDispatchCertificate = async (supply: Supply) => {
    const html = generateDispatchCertificateHTML({ machine: {
      serialNumber: supply.machine.serialNumber,
      machineModel: {
        name: supply.machine.machineModel.name,
      }
    } })
    const pdfBlob = await generatePdf({ html })
    const url = URL.createObjectURL(pdfBlob)
    window.open(url)
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      accessorKey: 'machine.serialNumber',
      header: 'Serial Number',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex items-center gap-2">
          <div>{row.original.machine.serialNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: 'machine.machineModel.name',
      header: 'Model',
      cell: ({ row }: { row: { original: Supply } }) => (
        <div className="flex items-center gap-2">
          <div>
            <div>{row.original.machine.machineModel.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.machine.machineModel.category.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'distributor',
      header: 'Distributor/Customer',
      cell: ({ row }: { row: { original: Supply } }) => {
        const isDirect = isDirectToCustomer(row.original)
        const sale = row.original.machine.sale
        
        // Debug logging for production issue
        if (isDirect) {
          console.log('JKET D2C Entry:', {
            serialNumber: row.original.machine.serialNumber,
            hasSale: !!sale,
            saleData: sale ? {
              customerName: sale.customerName,
              customerEmail: sale.customerEmail,
              customerPhone: sale.customerPhoneNumber
            } : null
          })
        }
        
        if (isDirect && sale) {
          return (
            <div className="flex flex-col gap-1">
              <Badge className="mb-1 w-fit" variant="outline">Direct to Customer</Badge>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary/60" />
                {sale.customerName}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {sale.customerContactPersonName}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {sale.customerEmail}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {sale.customerPhoneNumber}
              </div>
              {sale.distributorInvoiceNumber && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold">Invoice:</span> {sale.distributorInvoiceNumber}
                </div>
              )}
            </div>
          )
        }
        
        // Handle JKET D2C without sale data
        if (isDirect && !sale) {
          return (
            <div className="flex flex-col gap-1">
              <Badge className="mb-1 w-fit" variant="outline">Direct to Customer</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {row.original.distributor.organizationName}
              </div>
              <div className="text-xs text-muted-foreground">
                ⚠️ Sale data missing
              </div>
            </div>
          )
        }
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary/60" />
              {row.original.distributor.organizationName}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {row.original.distributor.region}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'dates',
      header: 'Dates',
      cell: ({ row }: { row: { original: Supply } }) => {
        const isDirect = isDirectToCustomer(row.original)
        const sale = row.original.machine.sale
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/60" />
              Supplied: {format(row.original.supplyDate, 'PP')}
            </div>
            {isDirect && sale ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Sold: {format(sale.saleDate, 'PP')}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Sell by: {format(row.original.sellBy, 'PP')}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Supply } }) => {
        const hasReturn = row.original.machine.return !== null
        const isDirect = isDirectToCustomer(row.original)
        
        if (hasReturn) {
          return <Badge variant="destructive">Returned</Badge>
        }
        
        if (isDirect && row.original.machine.sale) {
          return <Badge variant="secondary">Sold to Customer</Badge>
        }
        
        return <Badge variant="success">Active</Badge>
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Supply } }) => {
        const deletionStatus = supplyDeletionStatus[row.original.id]
        const canDelete = deletionStatus?.canDelete || false
        const dependencies = deletionStatus?.dependencies || []
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/dispatch/supplies/${row.original.id}`)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {/* Generate Dispatch Certificate */}
              <DropdownMenuItem
                onClick={() => handleGenerateDispatchCertificate(row.original)}
                className="cursor-pointer"
              >
                <File className="mr-2 h-4 w-4" />
                Generate Dispatch Certificate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/dispatch/supplies/${row.original.id}/edit`)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Supply
              </DropdownMenuItem>
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={`cursor-pointer ${
                      !canDelete 
                        ? "opacity-50 cursor-not-allowed text-muted-foreground" 
                        : "text-destructive focus:text-destructive"
                    }`}
                    onClick={() => {
                      if (canDelete) {
                        setSupplyToDelete(row.original)
                      }
                    }}
                    disabled={!canDelete}
                    title={
                      !canDelete && dependencies.length > 0 
                        ? `Cannot delete: machine has ${dependencies.join(", ")}` 
                        : undefined
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Supply
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  console.log(supplies)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search supplies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredSupplies}
        pagination
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!supplyToDelete} onOpenChange={() => setSupplyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supply Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the supply record for machine{" "}
              <strong>{supplyToDelete?.machine.serialNumber}</strong>?
              <br />
              <br />
              <strong>The machine will NOT be deleted</strong> - it will be returned to inventory for future dispatch.
              Only the supply record linking this machine to{" "}
              <strong>{supplyToDelete?.distributor.organizationName}</strong> will be removed.
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => supplyToDelete && handleDeleteSupply(supplyToDelete)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Supply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 