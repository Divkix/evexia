'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AccessLogs } from '@/components/patient/access-logs'

interface Patient {
  id: string
  name: string
  email: string
}

interface SessionResponse {
  authenticated: boolean
  patient?: Patient
  bypass?: boolean
  error?: string
}

export default function AccessLogsPage() {
  const router = useRouter()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSession = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/auth/session')
      const data: SessionResponse = await res.json()

      if (!data.authenticated || !data.patient) {
        router.replace('/patient/login')
        return
      }

      setPatientId(data.patient.id)
    } catch (err) {
      console.error('Session check error:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify session')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true)
            checkSession()
          }}
          className="text-primary underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!patientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Access Logs
        </h2>
        <p className="text-muted-foreground">
          View who has accessed your health records
        </p>
      </div>
      <AccessLogs patientId={patientId} />
    </div>
  )
}
