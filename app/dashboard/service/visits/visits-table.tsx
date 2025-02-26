"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Building2, MapPin, Calendar, MoreVertical, MessageSquare, CheckCircle2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ServiceVisit {
  id: string
  serviceVisitDate: Date
  serviceVisitNotes: string | null
  status: string
  comments: Array<{
    id: string
    comment: string
    attachments: any
    createdAt: Date
  }>
  serviceRequest: {
    id: string
    complaint: string
    attachments: any
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
    }
  }
}

interface VisitsTableProps {
  initialVisits: ServiceVisit[]
}

export function VisitsTable({ initialVisits }: VisitsTableProps) {
  const router = useRouter()
  const [visits] = useState<ServiceVisit[]>(initialVisits)
  const [search, setSearch] = useState('')

  const filteredVisits = visits.filter((visit) => {
    const searchLower = search.toLowerCase()
    return (
      visit.serviceRequest.machine.serialNumber.toLowerCase().includes(searchLower) ||
      visit.serviceRequest.machine.machineModel.name.toLowerCase().includes(searchLower) ||
      visit.serviceRequest.complaint.toLowerCase().includes(searchLower) ||
      visit.serviceRequest.machine.warrantyCertificate?.name.toLowerCase().includes(searchLower) ||
      visit.serviceRequest.machine.warrantyCertificate?.state.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      accessorKey: 'machine',
      header: 'Machine',
      cell: ({ row }: { row: { original: ServiceVisit } }) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">
            {row.original.serviceRequest.machine.machineModel.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.serviceRequest.machine.serialNumber}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.serviceRequest.machine.machineModel.category.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }: { row: { original: ServiceVisit } }) => {
        const certificate = row.original.serviceRequest.machine.warrantyCertificate
        return certificate ? (
          <div className="flex flex-col gap-1">
            <div className="font-medium">{certificate.name}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {certificate.address}, {certificate.state}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No warranty information</div>
        )
      },
    },
    {
      accessorKey: 'complaint',
      header: 'Issue',
      cell: ({ row }: { row: { original: ServiceVisit } }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">
            {row.original.serviceRequest.complaint}
          </div>
          {row.original.serviceVisitNotes && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.serviceVisitNotes}
            </div>
          )}
          {row.original.comments.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MessageSquare className="h-3 w-3" />
              {row.original.comments.length} comments
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Visit Date',
      cell: ({ row }: { row: { original: ServiceVisit } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {format(new Date(row.original.serviceVisitDate), 'PPP')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: ServiceVisit } }) => (
        <Badge variant={
          row.original.status === 'COMPLETED' ? 'success' :
          row.original.status === 'IN_PROGRESS' ? 'default' :
          row.original.status === 'CANCELLED' ? 'destructive' :
          'secondary'
        }>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: ServiceVisit } }) => (
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
              onClick={() => router.push(`/dashboard/service/visits/${row.original.id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {row.original.status === 'PENDING' && (
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/service/visits/${row.original.id}/start`)}
                className="cursor-pointer"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Start Visit
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
            placeholder="Search visits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredVisits}
        pagination
      />
    </div>
  )
} 