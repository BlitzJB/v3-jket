"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { usePermission } from "@/lib/rbac/client"
import { Building2, Phone, Globe, MoreVertical, Check, X, Pencil, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  approved: boolean
  emailVerified: Date | null
  phoneNumber: string | null
  region: string | null
  organizationName: string | null
}

interface UsersTableProps {
  initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const canApproveUsers = usePermission('users:approve')

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user approval status")
      }

      const updatedUser = await response.json()
      setUsers(users.map(user => 
        user.id === userId ? { ...user, approved: updatedUser.approved } : user
      ))

      toast.success(
        approved ? "User has been approved" : "User approval has been revoked"
      )
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    }
  }

  const filteredUsers = users.filter(user => {
    const searchTerm = search.toLowerCase()
    return (
      user.name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm) ||
      user.organizationName?.toLowerCase().includes(searchTerm) ||
      user.region?.toLowerCase().includes(searchTerm)
    )
  })

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { original: User } }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: { original: User } }) => (
        <Badge variant="secondary">
          {row.original.role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "approved",
      header: "Status",
      cell: ({ row }: { row: { original: User } }) => (
        <Badge variant={row.original.approved ? "success" : "secondary"}>
          {row.original.approved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }: { row: { original: User } }) => (
        row.original.organizationName ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.organizationName}</span>
          </div>
        ) : null
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="space-y-1">
          {row.original.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{row.original.phoneNumber}</span>
            </div>
          )}
          {row.original.region && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{row.original.region}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: User } }) => (
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
            {canApproveUsers && (
              <>
                <DropdownMenuItem
                  onClick={() => handleApproval(row.original.id, !row.original.approved)}
                  className="flex items-center gap-2 text-sm"
                >
                  {row.original.approved ? (
                    <>
                      <X className="h-4 w-4 text-destructive" />
                      <span>Revoke Access</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      <span>Approve User</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <Link href={`/dashboard/customer-service/users/${row.original.id}/edit`}>
              <DropdownMenuItem
                className="flex items-center gap-2 text-sm"
              >
                <Pencil className="h-4 w-4 text-primary" />
                <span>Edit Details</span>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        pagination
      />
    </div>
  )
} 