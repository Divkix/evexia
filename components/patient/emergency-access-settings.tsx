'use client'

import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

interface EmergencyAccessSettingsProps {
  patientId: string
}

function SettingsSkeleton() {
  return (
    <Card className="border-amber-500/40">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

export function EmergencyAccessSettings({
  patientId,
}: EmergencyAccessSettingsProps) {
  const [allowEmergencyAccess, setAllowEmergencyAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/patient/${patientId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setAllowEmergencyAccess(data.allowEmergencyAccess ?? false)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function handleToggle(checked: boolean) {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/patient/${patientId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowEmergencyAccess: checked }),
      })
      if (response.ok) {
        setAllowEmergencyAccess(checked)
        toast.success(
          checked ? 'Emergency access enabled' : 'Emergency access disabled',
        )
      } else {
        toast.error('Failed to update setting')
      }
    } catch {
      toast.error('Failed to update setting')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <Card className="border-amber-500/40">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <AlertTriangle
            className="h-5 w-5 text-amber-500"
            aria-hidden="true"
          />
          Emergency Access
        </CardTitle>
        <CardDescription>
          Allow ER doctors to access your records without verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle
            className="h-4 w-4 text-amber-500"
            aria-hidden="true"
          />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            When enabled, emergency room healthcare providers can access your
            medical records without requiring OTP verification or a share token.
            This feature is designed for life-threatening situations where quick
            access to your medical history is critical.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="emergency-access"
              className="text-base font-medium cursor-pointer"
            >
              Enable Emergency Access
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow verified ER staff to view your records
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="emergency-access"
              checked={allowEmergencyAccess}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Info
              className="h-5 w-5 text-muted-foreground mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                What this means for you:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  ER doctors can access your vitals, medications, and lab
                  results
                </li>
                <li>All emergency access attempts are logged and auditable</li>
                <li>
                  You will be notified after any emergency access to your
                  records
                </li>
                <li>You can disable this setting at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
