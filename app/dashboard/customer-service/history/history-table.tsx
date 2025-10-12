"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Search, Phone, MapPin } from "lucide-react"
import { ServiceRequestStatus } from "@prisma/client"

interface ServiceRequest {
  id: string
  ticketFriendlyId: string
  complaint: string | null
  createdAt: Date
  updatedAt: Date
  machine: {
    serialNumber: string
    machineModel: {
      name: string
      category: {
        name: string
      }
    }
    warrantyCertificate: {
      name: string
      address: string
      state: string
    } | null
    sale: {
      customerName: string
      customerPhoneNumber: string
      customerAddress: string
      state?: string
    } | null
  }
  serviceVisit: {
    id: string
    serviceVisitDate: Date
    typeOfIssue: string | null
    totalCost: number | null
    status: ServiceRequestStatus
    engineer: {
      name: string | null
      id: string
      email: string | null
      emailVerified: Date | null
      image: string | null
      password: string | null
      role: string
      approved: boolean
      phoneNumber: string | null
      region: string | null
      organizationName: string | null
      createdAt: Date
      updatedAt: Date
    } | null
  } | null
}

interface HistoryTableProps {
  requests: ServiceRequest[]
}

export function HistoryTable({ requests }: HistoryTableProps) {
  const router = useRouter()
  const [globalFilter, setGlobalFilter] = useState("")

  // Function to filter data based on search query
  const filterData = (data: ServiceRequest[], searchQuery: string) => {
    const query = searchQuery.toLowerCase().trim()
    
    if (!query) return data

    return data.filter((request) => {
      const searchableFields = [
        request.ticketFriendlyId,
        request.machine.serialNumber,
        request.machine.machineModel.name,
        request.machine.warrantyCertificate?.name,
        request.machine.warrantyCertificate?.state,
        request.machine.sale?.customerName,
        request.machine.sale?.customerPhoneNumber,
        request.machine.sale?.state,
        request.serviceVisit?.typeOfIssue,
        request.serviceVisit?.engineer?.name,
        request.serviceVisit ? format(new Date(request.serviceVisit.serviceVisitDate), "MMMM do, yyyy").toLowerCase() : null,
        request.serviceVisit?.totalCost?.toString()
      ]

      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(query)
      )
    })
  }

  const filteredData = filterData(requests, globalFilter)

  const columns = [
    {
      accessorKey: "ticketId",
      header: "Ticket ID",
      cell: ({ row }: any) => (
        <div className="font-mono font-medium">
          {row.original.ticketFriendlyId}
        </div>
      ),
    },
    {
      accessorKey: "machine.serialNumber",
      header: "Serial Number",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.machine.serialNumber}
        </div>
      ),
    },
    {
      accessorKey: "machine.machineModel.name",
      header: "Model",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.machine.machineModel.name}
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }: any) => {
        const { machine } = row.original
        const customer = machine.warrantyCertificate || machine.sale
        if (!customer) return null

        const name = machine.warrantyCertificate?.name || machine.sale?.customerName
        const phone = machine.sale?.customerPhoneNumber
        const state = machine.warrantyCertificate?.state || machine.sale?.state

        return (
          <div className="space-y-1">
            <div className="font-medium">{name}</div>
            {phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {phone}
              </div>
            )}
            {state && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {state}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "serviceVisit.typeOfIssue",
      header: "Issue Type",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.serviceVisit?.typeOfIssue || 'Not specified'}
        </div>
      ),
    },
    {
      accessorKey: "serviceVisit.totalCost",
      header: "Cost",
      cell: ({ row }: any) => {
        const cost = row.original.serviceVisit?.totalCost
        return (
          <div className="font-medium">
            {cost ? `₹ ${cost.toLocaleString()}` : 'Not specified'}
          </div>
        )
      },
    },
    {
      accessorKey: "serviceVisit.engineer.name",
      header: "Engineer",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.serviceVisit?.engineer?.name || 'Not assigned'}
        </div>
      ),
    },
    {
      accessorKey: "serviceVisit.serviceVisitDate",
      header: "Visit Date",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.serviceVisit ? format(new Date(row.original.serviceVisit.serviceVisitDate), "MMMM do, yyyy") : 'Not scheduled'}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/customer-service/requests/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by serial number, customer, issue type..."
            className="pl-9"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
      />
    </div>
  )
} 