'use client'

import { useEffect, useState } from 'react'
import { EmergencyAccessSettings } from '@/components/patient/emergency-access-settings'
import { Skeleton } from '@/components/ui/skeleton'

interface SessionResponse {
  authenticated: boolean
  patient?: {
    id: string
    name: string
    email: string
  }
}

export default function SettingsPage() {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data: SessionResponse = await response.json()
        if (data.patient) {
          setPatientId(data.patient.id)
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSession()
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!patientId) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-6">Settings</h1>
      <EmergencyAccessSettings patientId={patientId} />
    </div>
  )
}
