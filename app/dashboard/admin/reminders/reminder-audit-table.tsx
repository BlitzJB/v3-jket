"use client"

import { useState } from "react"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react"
import { format } from "date-fns"

interface Machine {
  serialNumber: string
  machineModel: {
    name: string
  }
  sale: {
    customerName: string | null
    customerEmail: string | null
  } | null
}

interface ReminderLog {
  id: string
  machineId: string
  actionType: string
  channel: string
  metadata: any
  createdAt: Date
  machine: Machine
}

interface ReminderAuditTableProps {
  initialReminders: ReminderLog[]
}

export function ReminderAuditTable({ initialReminders }: ReminderAuditTableProps) {
  const [reminders, setReminders] = useState(initialReminders)
  const [searchQuery, setSearchQuery] = useState("")
  const [urgencyFilter, setUrgencyFilter] = useState<string | null>(null)

  const filteredReminders = reminders.filter(reminder => {
    const metadata = reminder.metadata as any
    const matchesSearch =
      reminder.machine.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.machine.machineModel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.machine.sale?.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.machine.sale?.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata?.sentTo?.toLowerCase().includes(searchQuery.toLowerCase())

    if (urgencyFilter) {
      return matchesSearch && metadata?.urgency === urgencyFilter
    }
    return matchesSearch
  })

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'OVERDUE':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        )
      case 'URGENT':
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </Badge>
        )
      case 'SOON':
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Soon
          </Badge>
        )
      case 'UPCOMING':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Upcoming
          </Badge>
        )
      default:
        return <Badge variant="outline">{urgency}</Badge>
    }
  }

  const columns = [
    {
      accessorKey: "createdAt",
      header: "Sent Date",
      cell: ({ row }: { row: { original: ReminderLog } }) => (
        <div className="font-medium">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          <div className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), "h:mm a")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "machine",
      header: "Machine",
      cell: ({ row }: { row: { original: ReminderLog } }) => (
        <div>
          <div className="font-medium">{row.original.machine.machineModel.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.machine.serialNumber}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }: { row: { original: ReminderLog } }) => {
        const metadata = row.original.metadata as any
        const email = metadata?.sentTo || row.original.machine.sale?.customerEmail
        const name = row.original.machine.sale?.customerName

        return (
          <div>
            {name && <div className="font-medium">{name}</div>}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {email || '—'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "urgency",
      header: "Urgency",
      cell: ({ row }: { row: { original: ReminderLog } }) => {
        const metadata = row.original.metadata as any
        return metadata?.urgency ? getUrgencyBadge(metadata.urgency) : '—'
      },
    },
    {
      accessorKey: "daysUntilService",
      header: "Days Until Service",
      cell: ({ row }: { row: { original: ReminderLog } }) => {
        const metadata = row.original.metadata as any
        const days = metadata?.daysUntilService

        if (days === undefined || days === null) return '—'

        return (
          <div className={`font-medium ${
            days < 0 ? 'text-red-600' :
            days <= 3 ? 'text-orange-600' :
            days <= 7 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}
          </div>
        )
      },
    },
    {
      accessorKey: "healthScore",
      header: "Health Score",
      cell: ({ row }: { row: { original: ReminderLog } }) => {
        const metadata = row.original.metadata as any
        const score = metadata?.healthScore

        if (score === undefined || score === null) return '—'

        return (
          <div className={`font-medium ${
            score >= 80 ? 'text-green-600' :
            score >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {score}/100
          </div>
        )
      },
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }: { row: { original: ReminderLog } }) => (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <Mail className="h-3 w-3" />
          {row.original.channel}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: ReminderLog } }) => (
        <Link href={`/dashboard/admin/reminders/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by machine, customer, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={urgencyFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setUrgencyFilter(null)}
          >
            All
          </Button>
          <Button
            variant={urgencyFilter === 'OVERDUE' ? "default" : "outline"}
            size="sm"
            onClick={() => setUrgencyFilter('OVERDUE')}
            className="flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Button>
          <Button
            variant={urgencyFilter === 'URGENT' ? "default" : "outline"}
            size="sm"
            onClick={() => setUrgencyFilter('URGENT')}
            className="flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Urgent
          </Button>
          <Button
            variant={urgencyFilter === 'SOON' ? "default" : "outline"}
            size="sm"
            onClick={() => setUrgencyFilter('SOON')}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Soon
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredReminders}
        searchable={false}
      />

      {filteredReminders.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || urgencyFilter ? 'No reminders found matching your filters' : 'No reminders sent yet'}
          </p>
        </div>
      )}
    </div>
  )
}
