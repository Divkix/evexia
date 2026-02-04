'use client'

import { AlertTriangle, Info, Key, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { HealthCharts } from '@/components/patient/health-charts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ChartDataPoint {
  date: string
  value: number
}

interface ChartData {
  bmi: ChartDataPoint[]
  cholesterol: ChartDataPoint[]
  a1c: ChartDataPoint[]
}

interface Summary {
  clinicianSummary: string
  patientSummary: string
  anomalies: Anomaly[]
}

interface Anomaly {
  type: string
  message: string
  severity: 'warning' | 'high' | 'critical'
  value?: string | number
}

interface RecordData {
  [key: string]: unknown
}

interface MedicalRecord {
  id: string
  category: string
  hospital: string
  data: RecordData
  recordDate: string | null
}

interface AccessResponse {
  success: boolean
  patientName: string
  dateOfBirth: string
  scope: string[]
  records: MedicalRecord[]
  summary: Summary | null
  chartData: ChartData
  providerName: string
  providerOrg: string
  disclaimer: string
  error?: string
}

interface OtpRequestResponse {
  success: boolean
  maskedEmail: string
  scope: string[]
  providerName: string
  providerOrg: string
  error?: string
}

type OtpStep = 'request' | 'verify'

export default function ProviderPortalPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [accessData, setAccessData] = useState<AccessResponse | null>(null)

  // Token access form state
  const [token, setToken] = useState('')
  const [tokenEmployeeId, setTokenEmployeeId] = useState('')

  // OTP access form state
  const [otpPatientId, setOtpPatientId] = useState('')
  const [otpEmployeeId, setOtpEmployeeId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpStep, setOtpStep] = useState<OtpStep>('request')
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('')

  const handleTokenAccess = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!token.trim() || !tokenEmployeeId.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/provider/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          employeeId: tokenEmployeeId.trim(),
        }),
      })

      const data: AccessResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Access denied')
        return
      }

      setAccessData(data)
      toast.success('Access granted')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!otpPatientId.trim() || !otpEmployeeId.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/provider/otp-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-otp',
          patientId: otpPatientId.trim(),
          employeeId: otpEmployeeId.trim(),
        }),
      })

      const data: OtpRequestResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to send verification code')
        return
      }

      setOtpMaskedEmail(data.maskedEmail)
      setOtpStep('verify')
      toast.success('Verification code sent to patient')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!otpCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/provider/otp-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          patientId: otpPatientId.trim(),
          employeeId: otpEmployeeId.trim(),
          code: otpCode.trim(),
        }),
      })

      const data: AccessResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Verification failed')
        return
      }

      setAccessData(data)
      toast.success('Access granted')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpBack = () => {
    setOtpStep('request')
    setOtpCode('')
    setOtpMaskedEmail('')
  }

  const handleNewAccess = () => {
    setAccessData(null)
    setToken('')
    setTokenEmployeeId('')
    setOtpPatientId('')
    setOtpEmployeeId('')
    setOtpCode('')
    setOtpStep('request')
    setOtpMaskedEmail('')
  }

  const groupRecordsByCategory = (records: MedicalRecord[]) => {
    const grouped: Record<string, MedicalRecord[]> = {}
    for (const record of records) {
      if (!grouped[record.category]) {
        grouped[record.category] = []
      }
      grouped[record.category].push(record)
    }
    return grouped
  }

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      vitals: 'Vital Signs',
      labs: 'Lab Results',
      meds: 'Medications',
      encounters: 'Encounters',
    }
    return labels[category] || category
  }

  const formatRecordData = (data: RecordData): string => {
    return Object.entries(data)
      .filter(([key]) => key !== 'date')
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        return `${formattedKey}: ${value}`
      })
      .join(', ')
  }

  // If we have access data, show the patient records view
  if (accessData) {
    const groupedRecords = groupRecordsByCategory(accessData.records)

    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patient Records</h1>
            <p className="text-muted-foreground">
              Viewing records for {accessData.patientName}
            </p>
          </div>
          <Button onClick={handleNewAccess} variant="outline">
            New Access Request
          </Button>
        </div>

        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{accessData.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{accessData.dateOfBirth}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Accessing Provider
                </p>
                <p className="font-medium">{accessData.providerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium">{accessData.providerOrg}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">Access Scope</p>
              <div className="flex flex-wrap gap-2">
                {accessData.scope.map((scope) => (
                  <Badge key={scope} variant="secondary">
                    {getCategoryLabel(scope)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        {accessData.summary && (
          <div className="mb-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Summary</CardTitle>
                <CardDescription>
                  AI-generated summary for healthcare providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {accessData.summary.clinicianSummary}
                </p>
              </CardContent>
            </Card>

            {accessData.summary.anomalies &&
              accessData.summary.anomalies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Detected Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {accessData.summary.anomalies.map((anomaly, index) => (
                        <Badge
                          key={`${anomaly.type}-${index}`}
                          variant={
                            anomaly.severity === 'critical' ||
                            anomaly.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {anomaly.type}
                          {anomaly.value && (
                            <span className="ml-1 opacity-80">
                              ({anomaly.value})
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {accessData.summary.anomalies.map((anomaly, index) => (
                        <li
                          key={`detail-${anomaly.type}-${index}`}
                          className="flex items-start gap-2"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              anomaly.severity === 'critical' ||
                              anomaly.severity === 'high'
                                ? 'bg-destructive'
                                : 'bg-warning'
                            }`}
                          />
                          <span>{anomaly.message}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {/* Health Charts */}
        {accessData.chartData && (
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold">Health Trends</h2>
            <HealthCharts chartData={accessData.chartData} />
          </div>
        )}

        {/* Medical Records by Category */}
        <div className="mb-6 space-y-4">
          <h2 className="text-xl font-semibold">Medical Records</h2>
          {Object.entries(groupedRecords).map(([category, records]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {getCategoryLabel(category)}
                </CardTitle>
                <CardDescription>
                  {records.length} record{records.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {record.hospital}
                        </span>
                        {record.recordDate && (
                          <span className="text-xs text-muted-foreground">
                            {record.recordDate}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatRecordData(record.data)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {accessData.records.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No records available for the granted scope.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Medical Disclaimer */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Medical Disclaimer</AlertTitle>
          <AlertDescription>{accessData.disclaimer}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Access request form with tabs
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Provider Portal</CardTitle>
          <CardDescription>
            Access patient records using a share token or live OTP verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="token" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Token Access
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Live OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="token" className="mt-4">
              <form onSubmit={handleTokenAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Share Token</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter the share token from patient"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The patient provides this token to share their records
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenEmployeeId">Employee ID</Label>
                  <Input
                    id="tokenEmployeeId"
                    type="text"
                    placeholder="e.g., EMP-001"
                    value={tokenEmployeeId}
                    onChange={(e) => setTokenEmployeeId(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your organization&apos;s employee ID for access logging
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Access Records'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="mt-4">
              {otpStep === 'request' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpPatientId">Patient ID</Label>
                    <Input
                      id="otpPatientId"
                      type="text"
                      placeholder="Enter patient ID"
                      value={otpPatientId}
                      onChange={(e) => setOtpPatientId(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The patient&apos;s unique identifier in the system
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otpEmployeeId">Employee ID</Label>
                    <Input
                      id="otpEmployeeId"
                      type="text"
                      placeholder="e.g., EMP-001"
                      value={otpEmployeeId}
                      onChange={(e) => setOtpEmployeeId(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your organization&apos;s employee ID
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Request Verification'}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    A verification code will be sent to the patient&apos;s
                    email. The patient must share this code with you.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Code Sent</AlertTitle>
                    <AlertDescription>
                      Verification code sent to {otpMaskedEmail}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="otpCode">Verification Code</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={isLoading}
                      required
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ask the patient to share the code they received
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleOtpBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Access'}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
