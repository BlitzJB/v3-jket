"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Building2, Phone, Globe, MoreVertical, Check, X, Pencil, Search, Filter, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"

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

interface UserManagementTableProps {
  initialUsers: User[]
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (showPendingOnly) {
      return matchesSearch && !user.approved
    }
    return matchesSearch
  })

  async function handleApproval(userId: string, approved: boolean) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user status")
      }

      const updatedUser = await response.json()
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, approved: updatedUser.approved } : user
        )
      )

      toast.success(
        `User ${approved ? "approved" : "revoked"} successfully`
      )
    } catch (error) {
      console.error("Error updating user status:", error)
      toast.error("Failed to update user status")
    }
  }

  async function handleDelete(user: User) {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id))
      toast.success("User deleted successfully")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setUserToDelete(null)
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary/60" />
          {row.original.organizationName || "—"}
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary/60" />
          {row.original.phoneNumber || "—"}
        </div>
      ),
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary/60" />
          {row.original.region || "—"}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: { row: { original: User } }) => (
        <Badge variant={row.original.role === "ADMIN" ? "default" : "secondary"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "approved",
      header: "Status",
      cell: ({ row }: { row: { original: User } }) => (
        <Badge variant={row.original.approved ? "success" : "destructive"}>
          {row.original.approved ? "Approved" : "Pending"}
        </Badge>
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
            <Link href={`/dashboard/admin/users/${row.original.id}/edit`}>
              <DropdownMenuItem
                className="flex items-center gap-2 text-sm"
              >
                <Pencil className="h-4 w-4 text-primary" />
                <span>Edit Details</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
              onClick={() => setUserToDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete User</span>
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
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showPendingOnly ? "default" : "outline"}
          onClick={() => setShowPendingOnly(!showPendingOnly)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showPendingOnly ? "Showing Pending" : "Show Pending"}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filteredUsers}
        pagination
      />
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {userToDelete?.name || userToDelete?.email}'s account and remove their
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 