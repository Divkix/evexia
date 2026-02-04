'use client'

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

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

// Reference ranges for common vitals and labs
const REFERENCE_RANGES: Record<
  string,
  { min?: number; max?: number; unit?: string }
> = {
  // Vitals
  systolic: { min: 90, max: 120, unit: 'mmHg' },
  diastolic: { min: 60, max: 80, unit: 'mmHg' },
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  heart_rate: { min: 60, max: 100, unit: 'bpm' },
  temperature: { min: 97.0, max: 99.5, unit: 'F' },
  respiratoryRate: { min: 12, max: 20, unit: '/min' },
  respiratory_rate: { min: 12, max: 20, unit: '/min' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  oxygen_saturation: { min: 95, max: 100, unit: '%' },
  spo2: { min: 95, max: 100, unit: '%' },
  // Labs
  glucose: { min: 70, max: 100, unit: 'mg/dL' },
  hemoglobin: { min: 12.0, max: 17.5, unit: 'g/dL' },
  hematocrit: { min: 36, max: 50, unit: '%' },
  wbc: { min: 4000, max: 11000, unit: '/uL' },
  platelets: { min: 150000, max: 400000, unit: '/uL' },
  creatinine: { min: 0.7, max: 1.3, unit: 'mg/dL' },
  bun: { min: 7, max: 20, unit: 'mg/dL' },
  sodium: { min: 136, max: 145, unit: 'mEq/L' },
  potassium: { min: 3.5, max: 5.0, unit: 'mEq/L' },
  chloride: { min: 98, max: 106, unit: 'mEq/L' },
  co2: { min: 23, max: 29, unit: 'mEq/L' },
  calcium: { min: 8.5, max: 10.5, unit: 'mg/dL' },
  totalProtein: { min: 6.0, max: 8.3, unit: 'g/dL' },
  albumin: { min: 3.5, max: 5.0, unit: 'g/dL' },
  bilirubin: { min: 0.1, max: 1.2, unit: 'mg/dL' },
  alt: { min: 7, max: 56, unit: 'U/L' },
  ast: { min: 10, max: 40, unit: 'U/L' },
  alkalinePhosphatase: { min: 44, max: 147, unit: 'U/L' },
  cholesterol: { max: 200, unit: 'mg/dL' },
  ldl: { max: 100, unit: 'mg/dL' },
  hdl: { min: 40, unit: 'mg/dL' },
  triglycerides: { max: 150, unit: 'mg/dL' },
  hba1c: { max: 5.7, unit: '%' },
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L' },
}

// Labels for display
const DISPLAY_LABELS: Record<string, string> = {
  systolic: 'Systolic BP',
  diastolic: 'Diastolic BP',
  heartRate: 'Heart Rate',
  heart_rate: 'Heart Rate',
  temperature: 'Temperature',
  respiratoryRate: 'Respiratory Rate',
  respiratory_rate: 'Respiratory Rate',
  oxygenSaturation: 'SpO2',
  oxygen_saturation: 'SpO2',
  spo2: 'SpO2',
  bloodPressure: 'Blood Pressure',
  blood_pressure: 'Blood Pressure',
  glucose: 'Glucose',
  hemoglobin: 'Hemoglobin',
  hematocrit: 'Hematocrit',
  wbc: 'White Blood Cells',
  platelets: 'Platelets',
  creatinine: 'Creatinine',
  bun: 'BUN',
  sodium: 'Sodium',
  potassium: 'Potassium',
  chloride: 'Chloride',
  co2: 'CO2',
  calcium: 'Calcium',
  totalProtein: 'Total Protein',
  albumin: 'Albumin',
  bilirubin: 'Bilirubin',
  alt: 'ALT',
  ast: 'AST',
  alkalinePhosphatase: 'Alkaline Phosphatase',
  cholesterol: 'Total Cholesterol',
  ldl: 'LDL',
  hdl: 'HDL',
  triglycerides: 'Triglycerides',
  hba1c: 'HbA1c',
  tsh: 'TSH',
  medication: 'Medication',
  dosage: 'Dosage',
  frequency: 'Frequency',
  prescribedBy: 'Prescribed By',
  startDate: 'Start Date',
  endDate: 'End Date',
  instructions: 'Instructions',
  reason: 'Reason',
  diagnosis: 'Diagnosis',
  notes: 'Notes',
  provider: 'Provider',
  location: 'Location',
  type: 'Type',
  duration: 'Duration',
  followUp: 'Follow-up',
  testName: 'Test Name',
  result: 'Result',
  unit: 'Unit',
  referenceRange: 'Reference Range',
  status: 'Status',
}

function isAbnormalValue(key: string, value: number): boolean {
  const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '')
  const range = REFERENCE_RANGES[key] || REFERENCE_RANGES[normalizedKey]
  if (!range) return false
  if (range.min !== undefined && value < range.min) return true
  if (range.max !== undefined && value > range.max) return true
  return false
}

function getDisplayLabel(key: string): string {
  return (
    DISPLAY_LABELS[key] ||
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/_/g, ' ')
  )
}

function getUnit(key: string): string | undefined {
  const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '')
  return REFERENCE_RANGES[key]?.unit || REFERENCE_RANGES[normalizedKey]?.unit
}

interface DataValueProps {
  label: string
  value: unknown
  isAbnormal?: boolean
}

function DataValue({ label, value, isAbnormal = false }: DataValueProps) {
  const displayValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  const unit = getUnit(label)

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border px-3 py-2',
        isAbnormal
          ? 'border-warning/50 bg-warning/5'
          : 'border-border bg-background',
      )}
    >
      <span className="text-sm text-muted-foreground">
        {getDisplayLabel(label)}
      </span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-medium',
            isAbnormal ? 'text-warning' : 'text-foreground',
          )}
        >
          {displayValue}
          {unit && (
            <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
          )}
        </span>
        {isAbnormal && (
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

interface RecordDataRendererProps {
  data: unknown
  category: RecordCategory
}

function RecordDataRenderer({ data, category }: RecordDataRendererProps) {
  // Handle null/undefined data
  if (data === null || data === undefined) {
    return (
      <p className="text-sm italic text-muted-foreground">No data available</p>
    )
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return <p className="text-sm">{String(data)}</p>
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="text-sm italic text-muted-foreground">No items</p>
    }

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={`array-item-${index}-${typeof item === 'object' ? 'obj' : String(item).slice(0, 10)}`}
            className="rounded-lg border border-border p-3"
          >
            {typeof item === 'object' && item !== null ? (
              <RecordDataRenderer data={item} category={category} />
            ) : (
              <p className="text-sm">{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Handle objects - render as key-value pairs
  const entries = Object.entries(data as Record<string, unknown>)
  if (entries.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">No data available</p>
    )
  }

  // Group entries for better display
  const abnormalEntries: [string, unknown][] = []
  const normalEntries: [string, unknown][] = []

  for (const [key, value] of entries) {
    if (typeof value === 'number' && isAbnormalValue(key, value)) {
      abnormalEntries.push([key, value])
    } else {
      normalEntries.push([key, value])
    }
  }

  // Show abnormal values first
  const sortedEntries = [...abnormalEntries, ...normalEntries]

  return (
    <div className="space-y-4">
      {abnormalEntries.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {abnormalEntries.length} value
            {abnormalEntries.length > 1 ? 's' : ''} outside normal range
          </span>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {sortedEntries.map(([key, value]) => {
          // Handle nested objects
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            return (
              <div key={key} className="col-span-full">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  {getDisplayLabel(key)}
                </p>
                <div className="ml-4 rounded-lg border border-border p-3">
                  <RecordDataRenderer data={value} category={category} />
                </div>
              </div>
            )
          }

          // Handle arrays in values
          if (Array.isArray(value)) {
            return (
              <div key={key} className="col-span-full">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  {getDisplayLabel(key)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {value.map((item, i) => (
                    <Badge
                      key={`${key}-${i}-${String(item).slice(0, 10)}`}
                      variant="secondary"
                    >
                      {String(item)}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          }

          // Handle primitive values
          const isAbnormal =
            typeof value === 'number' && isAbnormalValue(key, value)
          return (
            <DataValue
              key={key}
              label={key}
              value={value}
              isAbnormal={isAbnormal}
            />
          )
        })}
      </div>
    </div>
  )
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
      <TableRow>
        <TableCell colSpan={4} className="p-0">
          <div
            className={`grid transition-all duration-300 ${
              isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-muted/50 p-4">
                <RecordDataRenderer
                  data={record.data}
                  category={record.category}
                />
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
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
