'use client'

import {
  FileText,
  Key,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

const navItems = [
  { href: '/patient', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/providers', label: 'My Providers', icon: Users },
  { href: '/patient/tokens', label: 'Share Tokens', icon: Key },
  { href: '/patient/access-logs', label: 'Access Logs', icon: FileText },
  { href: '/patient/settings', label: 'Settings', icon: Settings },
]

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data: SessionResponse = await response.json()

        if (!data.authenticated || !data.patient) {
          router.replace('/patient/login')
          return
        }

        setPatient(data.patient)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        router.replace('/patient/login')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  // Early return for login page - don't render sidebar
  if (pathname === '/patient/login') {
    return <>{children}</>
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Clear supabase session via API
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/')
    } catch (error) {
      console.error('Logout failed:', error)
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar skeleton */}
        <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Skeleton key={item.href} className="h-10 w-full" />
            ))}
          </nav>
        </aside>
        {/* Main content skeleton */}
        <main className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </header>
          <div className="flex flex-1 items-center justify-center">
            <Loader2
              className="size-8 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo and title */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <Logo size={28} />
          <span className="font-serif text-xl font-semibold text-sidebar-foreground">
            evexia
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/patient'
                ? pathname === '/patient'
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive &&
                    'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            )
          })}

          {/* Logout button at bottom */}
          <div className="mt-auto pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="size-5" aria-hidden="true" />
              )}
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="font-serif text-lg font-medium text-foreground">
            Patient Portal
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Welcome,</span>
            <span className="font-medium text-foreground">
              {patient?.name ?? 'Patient'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
