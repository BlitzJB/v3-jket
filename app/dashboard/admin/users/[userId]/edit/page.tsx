'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'QUALITY_TESTING',
  'DISPATCH_MANAGER',
  'MANUFACTURER',
  'DISTRIBUTOR',
  'SERVICE_ENGINEER',
  'CUSTOMER_SERVICE',
  'SALES',
  'USER',
  'GUEST',
] as const

type Role = typeof ROLES[number]

interface FormData {
  name: string
  email: string
  password?: string
  role: Role
  phoneNumber: string
  region: string
  organizationName: string
}

interface User extends Omit<FormData, 'password'> {
  id: string
  approved: boolean
  emailVerified: Date | null
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/admin/users/${userId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

async function updateUser(userId: string, data: FormData): Promise<User> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update user')
  }
  
  return response.json()
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { userId } = React.use(params)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'USER',
    phoneNumber: '',
    region: '',
    organizationName: '',
  })

  // Fetch user data
  const { isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    retry: 1,
    enabled: !!userId,
  })

  // Set form data when user data is fetched
  React.useEffect(() => {
    const user = queryClient.getQueryData<User>(['user', userId])
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role as Role,
        phoneNumber: user.phoneNumber || '',
        region: user.region || '',
        organizationName: user.organizationName || '',
      })
    }
  }, [userId, queryClient])

  // Update user mutation
  const { mutate: updateUserMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: FormData) => updateUser(userId, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] }) // Invalidate users list if it exists
      router.push('/dashboard/admin/users')
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateUserMutation(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleSelect = (role: Role) => {
    setFormData((prev) => ({ ...prev, role }))
  }

  if (userError) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading User</h1>
        <p className="text-muted-foreground mb-4">
          {userError instanceof Error ? userError.message : 'Failed to load user data'}
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit User</h1>
        <p className="text-muted-foreground mt-1">
          Update user account details
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Modify the user account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter full name"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password (Leave blank to keep current)
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                value={formData.password || ''}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="role"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Role
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={isLoadingUser}
                  >
                    {formData.role}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full" align="start">
                  {ROLES.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onSelect={() => handleRoleSelect(role)}
                    >
                      {role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="phoneNumber"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Phone Number (Optional)
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="region"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Region (Optional)
              </label>
              <Input
                id="region"
                name="region"
                placeholder="Enter region"
                value={formData.region}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="organizationName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Organization Name (Optional)
              </label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Enter organization name"
                value={formData.organizationName}
                onChange={handleChange}
                disabled={isLoadingUser}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoadingUser || isUpdating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoadingUser || isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 