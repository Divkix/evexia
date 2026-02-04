'use client'

import { Check, Copy, Key, Plus, ShieldOff, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConsentExplainerModal } from './consent-explainer-modal'

interface ShareToken {
  id: string
  patientId: string
  token: string
  scope: string[]
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

interface TokenManagerProps {
  patientId: string
}

type TokenStatus = 'active' | 'expired' | 'revoked'

function getTokenStatus(token: ShareToken): TokenStatus {
  if (token.revokedAt) return 'revoked'
  if (new Date(token.expiresAt) < new Date()) return 'expired'
  return 'active'
}

function getStatusBadgeVariant(
  status: TokenStatus,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default'
    case 'expired':
      return 'secondary'
    case 'revoked':
      return 'destructive'
  }
}

function getScopeStyles(scope: string): string {
  // Use semantic scope colors from CSS variables
  switch (scope.toLowerCase()) {
    case 'vitals':
      return 'bg-[hsl(var(--scope-vitals))] text-white border-transparent'
    case 'labs':
      return 'bg-[hsl(var(--scope-labs))] text-white border-transparent'
    case 'medications':
      return 'bg-[hsl(var(--scope-medications))] text-black border-transparent'
    case 'encounters':
      return 'bg-[hsl(var(--scope-encounters))] text-white border-transparent'
    default:
      return ''
  }
}

function formatExpiry(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  if (diffMs < 0) {
    return `Expired ${formatRelativeTime(-diffMs)} ago`
  }

  return `Expires in ${formatRelativeTime(diffMs)}`
}

function formatRelativeTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  const minutes = Math.floor(ms / (1000 * 60))
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function TokenManagerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
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
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TokenManager({ patientId }: TokenManagerProps) {
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [isTokenDisplayOpen, setIsTokenDisplayOpen] = useState(false)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<ShareToken | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    try {
      const response = await fetch(`/api/patient/${patientId}/tokens`)
      if (!response.ok) {
        throw new Error('Failed to fetch tokens')
      }
      const data = await response.json()
      setTokens(data.tokens ?? [])
    } catch (error) {
      toast.error('Failed to load tokens')
      console.error('Fetch tokens error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  const openConsentModal = () => {
    setShowConsentModal(true)
  }

  const openRevokeDialog = (token: ShareToken) => {
    setSelectedToken(token)
    setIsRevokeDialogOpen(true)
  }

  const openDeleteDialog = (token: ShareToken) => {
    setSelectedToken(token)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateFromConsent = async (
    selectedTypes: string[],
    expiryHours: number,
  ) => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one scope')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/patient/${patientId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: selectedTypes,
          expiryHours,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to create token')
      }

      const data = await response.json()
      setNewTokenValue(data.token)
      setShowConsentModal(false)
      setIsTokenDisplayOpen(true)
      toast.success('Token created successfully')
      fetchTokens()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create token',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async () => {
    if (!selectedToken) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/patient/${patientId}/tokens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedToken.id,
          action: 'revoke',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to revoke token')
      }

      toast.success('Token revoked successfully')
      setIsRevokeDialogOpen(false)
      setSelectedToken(null)
      fetchTokens()
    } catch (error) {
      toast.error('Failed to revoke token')
      console.error('Revoke token error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedToken) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/patient/${patientId}/tokens?tokenId=${selectedToken.id}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('Failed to delete token')
      }

      toast.success('Token deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedToken(null)
      fetchTokens()
    } catch (error) {
      toast.error('Failed to delete token')
      console.error('Delete token error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (token: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopiedTokenId(tokenId)
      toast.success('Token copied to clipboard')
      setTimeout(() => setCopiedTokenId(null), 2000)
    } catch {
      toast.error('Failed to copy token')
    }
  }

  if (isLoading) {
    return <TokenManagerSkeleton />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Key className="h-5 w-5" aria-hidden="true" />
            Share Tokens
          </CardTitle>
          <CardDescription>
            Generate temporary tokens to share your health records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openConsentModal}>
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
            </div>

            {tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tokens created yet.</p>
                <p className="text-sm mt-1">
                  Create a token to share your records with providers.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => {
                    const status = getTokenStatus(token)
                    const isActive = status === 'active'
                    return (
                      <TableRow key={token.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {token.token.slice(0, 8)}...
                              {token.token.slice(-4)}
                            </code>
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  copyToClipboard(token.token, token.id)
                                }
                              >
                                {copiedTokenId === token.id ? (
                                  <Check
                                    className="h-3 w-3 text-green-600"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Copy
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                )}
                                <span className="sr-only">Copy token</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {token.scope.map((s) => (
                              <Badge key={s} className={getScopeStyles(s)}>
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatExpiry(token.expiresAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRevokeDialog(token)}
                              >
                                <ShieldOff
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">Revoke</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(token)}
                            >
                              <Trash2
                                className="h-4 w-4 text-destructive"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consent Explainer Modal */}
      <ConsentExplainerModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleCreateFromConsent}
        patientId={patientId}
        isCreating={isSubmitting}
      />

      {/* Token Display Dialog (shown after creation) */}
      <Dialog open={isTokenDisplayOpen} onOpenChange={setIsTokenDisplayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token Created</DialogTitle>
            <DialogDescription>
              Copy this token and share it securely. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm font-mono break-all">
                {newTokenValue}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  newTokenValue && copyToClipboard(newTokenValue, 'new')
                }
              >
                {copiedTokenId === 'new' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsTokenDisplayOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this token? Anyone using this
              token will immediately lose access to your health records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevokeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Revoking...' : 'Revoke Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this token? This
              action cannot be undone.
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
              {isSubmitting ? 'Deleting...' : 'Delete Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
