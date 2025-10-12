"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Building2, MapPin, Calendar, MoreVertical, WrenchIcon, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateVisitDialog } from "./create-visit-dialog"

interface ServiceRequest {
  id: string
  ticketFriendlyId: string
  complaint: string | null
  createdAt: Date
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      category: {
        id: string
        name: string
      }
    }
    warrantyCertificate: {
      id: string
      name: string
      address: string
      state: string
      zipCode: string
    } | null
    sale: {
      id: string
      customerName: string
      customerPhoneNumber: string
      customerAddress: string
    } | null
  }
  serviceVisit: {
    id: string
    status: string
    serviceVisitDate: Date
    engineer: {
      id: string
      name: string | null
    } | null
  } | null
}

interface RequestsTableProps {
  initialRequests: ServiceRequest[]
}

export function RequestsTable({ initialRequests }: RequestsTableProps) {
  const router = useRouter()
  const [requests] = useState<ServiceRequest[]>(initialRequests)
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)

  const filteredRequests = requests.filter((request) => {
    const searchLower = search.toLowerCase()
    return (
      request.ticketFriendlyId.toLowerCase().includes(searchLower) ||
      request.machine.serialNumber.toLowerCase().includes(searchLower) ||
      request.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      request.complaint?.toLowerCase().includes(searchLower) ||
      request.machine.warrantyCertificate?.name.toLowerCase().includes(searchLower) ||
      request.machine.warrantyCertificate?.state.toLowerCase().includes(searchLower) ||
      request.machine.sale?.customerName.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      accessorKey: 'ticketId',
      header: 'Ticket ID',
      cell: ({ row }: { row: { original: ServiceRequest } }) => (
        <div className="font-mono font-medium">
          {row.original.ticketFriendlyId}
        </div>
      ),
    },
    {
      accessorKey: 'machine',
      header: 'Machine',
      cell: ({ row }: { row: { original: ServiceRequest } }) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">
            {row.original.machine.machineModel.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.machine.serialNumber}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.machine.machineModel.category.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }: { row: { original: ServiceRequest } }) => {
        const { warrantyCertificate, sale } = row.original.machine

        if (warrantyCertificate) {
          return (
            <div className="flex flex-col gap-1">
              <div className="font-medium">{warrantyCertificate.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {`${warrantyCertificate.address}, ${warrantyCertificate.state}`}
              </div>
            </div>
          )
        }

        if (sale) {
          return (
            <div className="flex flex-col gap-1">
              <div className="font-medium">{sale.customerName}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {sale.customerPhoneNumber}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {sale.customerAddress}
              </div>
            </div>
          )
        }

        return (
          <div className="text-sm text-muted-foreground">No customer information</div>
        )
      },
    },
    {
      accessorKey: 'complaint',
      header: 'Issue',
      cell: ({ row }: { row: { original: ServiceRequest } }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">
            {row.original.complaint}
          </div>
          <div className="text-sm text-muted-foreground">
            Created {format(new Date(row.original.createdAt), 'PPP')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'visit',
      header: 'Visit Status',
      cell: ({ row }: { row: { original: ServiceRequest } }) => {
        const visit = row.original.serviceVisit
        return visit ? (
          <div className="space-y-1">
            <Badge variant={
              visit.status === 'COMPLETED' ? 'success' :
              visit.status === 'IN_PROGRESS' ? 'default' :
              visit.status === 'CANCELLED' ? 'destructive' :
              'secondary'
            }>
              {visit.status}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(visit.serviceVisitDate), 'PPP')}
            </div>
            {visit.engineer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WrenchIcon className="h-3 w-3" />
                {visit.engineer.name}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="secondary">Unscheduled</Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: ServiceRequest } }) => (
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
              onClick={() => router.push(`/dashboard/customer-service/requests/${row.original.id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {!row.original.serviceVisit && (
              <DropdownMenuItem
                onClick={() => setSelectedRequest(row.original)}
                className="cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Visit
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredRequests}
        pagination
      />
      {selectedRequest && (
        <CreateVisitDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}
    </div>
  )
} 