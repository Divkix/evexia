/**
 * Demo mode configuration for hackathon presentations.
 * Allows demo patients to bypass Supabase OTP rate limits.
 */

export const DEMO_CODE = '12345678'

export const DEMO_PATIENT_EMAILS = [
  'chauhan.divanshu@gmail.com',
  'manushrimkumar@gmail.com',
  'shriya.vallabha@gmail.com',
]

export function isDemoPatient(email: string): boolean {
  return DEMO_PATIENT_EMAILS.includes(email.toLowerCase())
}

export function isDemoCode(code: string): boolean {
  return code === DEMO_CODE
}
