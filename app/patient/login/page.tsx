'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LogoWithText } from '@/components/brand'
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

type LoginStep = 'credentials' | 'verification'

interface SendOtpResponse {
  success: boolean
  maskedEmail: string
  patientId: string
  error?: string
}

interface VerifyOtpResponse {
  success: boolean
  patientId: string
  error?: string
}

export default function PatientLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('credentials')
  const [isLoading, setIsLoading] = useState(false)

  // Credentials form state
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // OTP verification state
  const [maskedEmail, setMaskedEmail] = useState('')
  const [patientId, setPatientId] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const isDevelopmentBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  // Check if already authenticated and redirect
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated && data.patient) {
          router.replace('/patient')
        }
      } catch {
        // Ignore errors, user needs to log in
      }
    }
    checkSession()
  }, [router])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !dateOfBirth) {
      toast.error('Please enter your full name and date of birth')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          dateOfBirth,
        }),
      })

      const data: SendOtpResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to send verification code')
        return
      }

      setMaskedEmail(data.maskedEmail)
      setPatientId(data.patientId)
      setStep('verification')
      toast.success('Verification code sent to your email')
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
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
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          code: otpCode,
        }),
      })

      const data: VerifyOtpResponse = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Invalid verification code')
        return
      }

      toast.success('Verification successful')
      router.push('/patient')
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoBypass = () => {
    toast.success('Continuing as demo patient')
    router.push('/patient')
  }

  const handleBackToCredentials = () => {
    setStep('credentials')
    setOtpCode('')
    setMaskedEmail('')
    setPatientId('')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-8">
        <LogoWithText size={48} className="text-foreground" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Patient Login</CardTitle>
          <CardDescription>
            {step === 'credentials'
              ? 'Enter your information to receive a verification code'
              : `Enter the 6-digit code sent to ${maskedEmail}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
              {isDevelopmentBypass && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDemoBypass}
                >
                  Continue as Demo Patient
                </Button>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to {maskedEmail}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToCredentials}
                disabled={isLoading}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
