'use client'

import { Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SCOPE_OPTIONS = ['Vitals', 'Labs', 'Medications', 'Encounters'] as const

interface Provider {
  id: string
  patientId: string
  providerName: string
  providerOrg: string | null
  providerEmail: string | null
  scope: string[]
  createdAt: string
  updatedAt: string
}

interface ProviderFormValues {
  providerName: string
  providerOrg: string
  providerEmail: string
  scope: string[]
}

interface ProviderManagerProps {
  patientId: string
}

function ProviderManagerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="border rounded-md">
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-8 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getScopeVariant(
  scope: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (scope.toLowerCase()) {
    case 'vitals':
      return 'default'
    case 'labs':
      return 'secondary'
    case 'medications':
      return 'outline'
    case 'encounters':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function ProviderManager({ patientId }: ProviderManagerProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProviderFormValues>({
    defaultValues: {
      providerName: '',
      providerOrg: '',
      providerEmail: '',
      scope: [],
    },
  })

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch(`/api/patient/${patientId}/providers`)
      if (!response.ok) {
        throw new Error('Failed to fetch providers')
      }
      const data = await response.json()
      setProviders(data.providers ?? [])
    } catch (error) {
      toast.error('Failed to load providers')
      console.error('Fetch providers error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const openAddDialog = () => {
    setSelectedProvider(null)
    form.reset({
      providerName: '',
      providerOrg: '',
      providerEmail: '',
      scope: [],
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (provider: Provider) => {
    setSelectedProvider(provider)
    form.reset({
      providerName: provider.providerName,
      providerOrg: provider.providerOrg ?? '',
      providerEmail: provider.providerEmail ?? '',
      scope: provider.scope,
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (provider: Provider) => {
    setSelectedProvider(provider)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (values: ProviderFormValues) => {
    setIsSubmitting(true)
    try {
      const url = `/api/patient/${patientId}/providers`
      const method = selectedProvider ? 'PATCH' : 'POST'
      const body = selectedProvider
        ? { providerId: selectedProvider.id, ...values }
        : values

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to save provider')
      }

      toast.success(
        selectedProvider
          ? 'Provider updated successfully'
          : 'Provider added successfully',
      )
      setIsDialogOpen(false)
      fetchProviders()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save provider',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProvider) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/patient/${patientId}/providers?providerId=${selectedProvider.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('Failed to delete provider')
      }

      toast.success('Provider removed successfully')
      setIsDeleteDialogOpen(false)
      setSelectedProvider(null)
      fetchProviders()
    } catch (error) {
      toast.error('Failed to delete provider')
      console.error('Delete provider error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <ProviderManagerSkeleton />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Healthcare Providers
          </CardTitle>
          <CardDescription>
            Manage providers who can access your health records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No providers added yet.</p>
                <p className="text-sm mt-1">
                  Add a healthcare provider to share your records.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Access Scope</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">
                        {provider.providerName}
                      </TableCell>
                      <TableCell>{provider.providerOrg ?? '-'}</TableCell>
                      <TableCell>{provider.providerEmail ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {provider.scope.length > 0 ? (
                            provider.scope.map((s) => (
                              <Badge key={s} variant={getScopeVariant(s)}>
                                {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No access
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(provider)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(provider)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Provider Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProvider ? 'Edit Provider' : 'Add Provider'}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider
                ? 'Update provider information and access scope.'
                : 'Add a new healthcare provider to share your records with.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="providerName"
                rules={{ required: 'Provider name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerOrg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="City Hospital" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerEmail"
                rules={{
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="doctor@hospital.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Scope</FormLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {SCOPE_OPTIONS.map((scope) => (
                        <div
                          key={scope}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`scope-${scope}`}
                            checked={field.value.includes(scope)}
                            onCheckedChange={(checked) => {
                              const newScope = checked
                                ? [...field.value, scope]
                                : field.value.filter((s) => s !== scope)
                              field.onChange(newScope)
                            }}
                          />
                          <label
                            htmlFor={`scope-${scope}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {scope}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : selectedProvider
                      ? 'Update Provider'
                      : 'Add Provider'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedProvider?.providerName}?
              This will revoke their access to your health records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Removing...' : 'Remove Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
