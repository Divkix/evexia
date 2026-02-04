import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
  lastUpdated?: string
}

export function LegalPageLayout({
  title,
  children,
  lastUpdated = 'February 2026',
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight hover:text-primary"
          >
            Evexia
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Alert className="mb-8 border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>Hackathon Prototype</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This is a demonstration application built for a hackathon. It is
              not a production service and should not be used for actual medical
              data management.
            </AlertDescription>
          </Alert>

          <h1 className="mb-2 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Evexia. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
