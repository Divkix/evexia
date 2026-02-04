'use client'

import { AlertTriangle, Info, Key, Smartphone } from 'lucide-react'
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
  disclaimer: string
  error?: string
}

interface OtpRequestResponse {
  success: boolean
  message: string
  maskedEmail: string
  patientId: string
  providerId: string
  scope: string[]
  error?: string
}

type OtpStep = 'request' | 'verify'

export default function ProviderPortalPage() {
  const [activeTab, setActiveTab] = useState('token')
  const [isLoading, setIsLoading] = useState(false)
  const [accessData, setAccessData] = useState<AccessResponse | null>(null)

  // Token access state
  const [token, setToken] = useState('')
  const [tokenPatientName, setTokenPatientName] = useState('')
  const [tokenDateOfBirth, setTokenDateOfBirth] = useState('')
  const [tokenProviderName, setTokenProviderName] = useState('')
  const [tokenProviderOrg, setTokenProviderOrg] = useState('')

  // OTP access state
  const [otpStep, setOtpStep] = useState<OtpStep>('request')
  const [otpPatientName, setOtpPatientName] = useState('')
  const [otpDateOfBirth, setOtpDateOfBirth] = useState('')
  const [otpProviderName, setOtpProviderName] = useState('')
  const [otpProviderOrg, setOtpProviderOrg] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('')
  const [otpPatientId, setOtpPatientId] = useState('')
  const [otpProviderId, setOtpProviderId] = useState('')

  const handleTokenAccess = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token.trim() || !tokenPatientName.trim() || !tokenDateOfBirth) {
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
          patientName: tokenPatientName.trim(),
          dateOfBirth: tokenDateOfBirth,
          providerName: tokenProviderName.trim() || undefined,
          providerOrg: tokenProviderOrg.trim() || undefined,
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpPatientName.trim() || !otpDateOfBirth || !otpProviderName.trim()) {
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
          patientName: otpPatientName.trim(),
          dateOfBirth: otpDateOfBirth,
          providerName: otpProviderName.trim(),
        }),
      })

      const data: OtpRequestResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to request OTP')
        return
      }

      setOtpMaskedEmail(data.maskedEmail)
      setOtpPatientId(data.patientId)
      setOtpProviderId(data.providerId)
      setOtpStep('verify')
      toast.success('Verification code sent to patient')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/provider/otp-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          patientId: otpPatientId,
          providerId: otpProviderId,
          code: otpCode,
          providerName: otpProviderName.trim(),
          providerOrg: otpProviderOrg.trim() || undefined,
        }),
      })

      const data: AccessResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Invalid verification code')
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

  const handleBackToRequest = () => {
    setOtpStep('request')
    setOtpCode('')
    setOtpMaskedEmail('')
    setOtpPatientId('')
    setOtpProviderId('')
  }

  const handleNewAccess = () => {
    setAccessData(null)
    setToken('')
    setTokenPatientName('')
    setTokenDateOfBirth('')
    setTokenProviderName('')
    setTokenProviderOrg('')
    setOtpStep('request')
    setOtpPatientName('')
    setOtpDateOfBirth('')
    setOtpProviderName('')
    setOtpProviderOrg('')
    setOtpCode('')
    setOtpMaskedEmail('')
    setOtpPatientId('')
    setOtpProviderId('')
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

            {accessData.summary.anomalies.length > 0 && (
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

  // Access request forms
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Provider Portal</CardTitle>
          <CardDescription>
            Access patient records with a share token or live OTP verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token" className="gap-2">
                <Key className="h-4 w-4" />
                Token Access
              </TabsTrigger>
              <TabsTrigger value="otp" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Live OTP
              </TabsTrigger>
            </TabsList>

            {/* Token Access Tab */}
            <TabsContent value="token" className="mt-6">
              <form onSubmit={handleTokenAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Share Token *</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter the share token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenPatientName">Patient Name *</Label>
                  <Input
                    id="tokenPatientName"
                    type="text"
                    placeholder="John Doe"
                    value={tokenPatientName}
                    onChange={(e) => setTokenPatientName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenDateOfBirth">
                    Patient Date of Birth *
                  </Label>
                  <Input
                    id="tokenDateOfBirth"
                    type="date"
                    value={tokenDateOfBirth}
                    onChange={(e) => setTokenDateOfBirth(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenProviderName">
                    Your Name (for logging)
                  </Label>
                  <Input
                    id="tokenProviderName"
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={tokenProviderName}
                    onChange={(e) => setTokenProviderName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenProviderOrg">
                    Organization (for logging)
                  </Label>
                  <Input
                    id="tokenProviderOrg"
                    type="text"
                    placeholder="Mayo Clinic"
                    value={tokenProviderOrg}
                    onChange={(e) => setTokenProviderOrg(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Access Records'}
                </Button>
              </form>
            </TabsContent>

            {/* OTP Access Tab */}
            <TabsContent value="otp" className="mt-6">
              {otpStep === 'request' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otpPatientName">Patient Name *</Label>
                    <Input
                      id="otpPatientName"
                      type="text"
                      placeholder="John Doe"
                      value={otpPatientName}
                      onChange={(e) => setOtpPatientName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otpDateOfBirth">
                      Patient Date of Birth *
                    </Label>
                    <Input
                      id="otpDateOfBirth"
                      type="date"
                      value={otpDateOfBirth}
                      onChange={(e) => setOtpDateOfBirth(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otpProviderName">Your Name *</Label>
                    <Input
                      id="otpProviderName"
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={otpProviderName}
                      onChange={(e) => setOtpProviderName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      You must be added as an authorized provider by the patient
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otpProviderOrg">Organization</Label>
                    <Input
                      id="otpProviderOrg"
                      type="text"
                      placeholder="Mayo Clinic"
                      value={otpProviderOrg}
                      onChange={(e) => setOtpProviderOrg(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Request Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Code Sent</AlertTitle>
                    <AlertDescription>
                      A verification code was sent to {otpMaskedEmail}. Ask the
                      patient to share the 6-digit code with you.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="otpCode">Verification Code</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setOtpCode(value)
                      }}
                      disabled={isLoading}
                      required
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify and Access Records'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleBackToRequest}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
