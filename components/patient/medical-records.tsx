'use client'

import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RecordCategory = 'vitals' | 'labs' | 'meds' | 'encounters'

interface MedicalRecord {
  id: string
  patientId: string
  hospital: string
  category: RecordCategory
  data: unknown
  recordDate: string | null
  source: string | null
  createdAt: string
}

interface RecordsResponse {
  patient: {
    id: string
    name: string
    dateOfBirth: string
  }
  records: MedicalRecord[]
}

interface MedicalRecordsProps {
  patientId: string
}

const CATEGORY_LABELS: Record<RecordCategory | 'all', string> = {
  all: 'All',
  vitals: 'Vitals',
  labs: 'Labs',
  meds: 'Medications',
  encounters: 'Encounters',
}

const CATEGORY_VALUES = ['all', 'vitals', 'labs', 'meds', 'encounters'] as const

const SKELETON_TAB_IDS = [
  'skel-tab-1',
  'skel-tab-2',
  'skel-tab-3',
  'skel-tab-4',
  'skel-tab-5',
]
const SKELETON_ROW_IDS = [
  'skel-row-1',
  'skel-row-2',
  'skel-row-3',
  'skel-row-4',
  'skel-row-5',
]

function MedicalRecordsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {SKELETON_TAB_IDS.map((id) => (
            <Skeleton key={id} className="h-9 w-24" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {SKELETON_ROW_IDS.map((id) => (
            <Skeleton key={id} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
      new Date(dateString),
    )
  } catch {
    return 'Invalid Date'
  }
}

function formatJsonData(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

interface RecordRowProps {
  record: MedicalRecord
}

function RecordRow({ record }: RecordRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{record.hospital}</TableCell>
        <TableCell>{formatDate(record.recordDate)}</TableCell>
        <TableCell className="capitalize">
          {CATEGORY_LABELS[record.category]}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/50">
            <pre className="max-h-64 overflow-auto rounded-md bg-background p-4 text-xs">
              {formatJsonData(record.data)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

interface RecordsTableProps {
  records: MedicalRecord[]
  emptyMessage: string
}

function RecordsTable({ records, emptyMessage }: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText
          className="mb-4 h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hospital</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </TableBody>
    </Table>
  )
}

export function MedicalRecords({ patientId }: MedicalRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')

  const fetchRecords = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/patient/${patientId}/records`)

      if (!response.ok) {
        if (response.status === 404) {
          setRecords([])
          return
        }
        throw new Error('Failed to fetch medical records')
      }

      const data: RecordsResponse = await response.json()
      setRecords(data.records)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  if (isLoading) {
    return <MedicalRecordsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchRecords}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Medical Records</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {CATEGORY_VALUES.map((category) => {
              const count =
                category === 'all'
                  ? records.length
                  : records.filter((r) => r.category === category).length
              return (
                <TabsTrigger key={category} value={category}>
                  {CATEGORY_LABELS[category]} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
          {CATEGORY_VALUES.map((category) => (
            <TabsContent key={category} value={category}>
              <RecordsTable
                records={
                  category === 'all'
                    ? records
                    : records.filter((r) => r.category === category)
                }
                emptyMessage={
                  category === 'all'
                    ? 'No medical records found'
                    : `No ${CATEGORY_LABELS[category].toLowerCase()} records found`
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
