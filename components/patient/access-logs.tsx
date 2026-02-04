'use client'

import { AlertTriangle, History, Shield } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AccessLogEntry {
  id: string
  tokenId?: string | null
  patientId: string
  providerName?: string | null
  providerOrg?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  accessMethod?: string | null
  scope?: string[] | null
  accessedAt: string
}

interface AccessLogsProps {
  patientId: string
}

function maskIpAddress(ip: string | null | undefined): string {
  if (!ip) return 'Unknown'

  // Handle IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`
    }
  }

  // Handle IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:****:****`
    }
  }

  return '***.***.***'
}

function formatDateTime(dateString: string): { date: string; time: string } {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function getMethodVariant(
  method: string | null | undefined,
): 'default' | 'secondary' {
  return method?.toLowerCase() === 'otp' ? 'default' : 'secondary'
}

function getScopeVariant(
  scope: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  const scopeLower = scope.toLowerCase()
  if (scopeLower === 'vitals') return 'default'
  if (scopeLower === 'labs') return 'secondary'
  if (scopeLower === 'meds' || scopeLower === 'medications') return 'outline'
  if (scopeLower === 'encounters') return 'destructive'
  return 'outline'
}

function AccessLogsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
          {['row-1', 'row-2', 'row-3', 'row-4', 'row-5'].map((rowId) => (
            <div key={rowId} className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-2">No Access Logs</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Your health records have not been accessed by any external providers
            yet. Access logs will appear here when providers view your records.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function AccessLogs({ patientId }: AccessLogsProps) {
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/patient/${patientId}/access-logs`)

      if (!response.ok) {
        if (response.status === 404) {
          setLogs([])
          return
        }
        throw new Error('Failed to fetch access logs')
      }

      const data = await response.json()
      setLogs(data.logs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  if (isLoading) {
    return <AccessLogsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (logs.length === 0) {
    return <EmptyState />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <History className="h-5 w-5" />
          Access History
        </CardTitle>
        <CardDescription>
          Record of who has accessed your health information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const { date, time } = formatDateTime(log.accessedAt)
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{date}</span>
                      <span className="text-muted-foreground text-xs">
                        {time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {log.providerName || 'Unknown Provider'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {log.providerOrg || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getMethodVariant(log.accessMethod)}>
                      {log.accessMethod?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {log.scope && log.scope.length > 0 ? (
                        log.scope.map((s) => (
                          <Badge
                            key={`${log.id}-${s}`}
                            variant={getScopeVariant(s)}
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          None
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {maskIpAddress(log.ipAddress)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
