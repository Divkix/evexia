import type { Record } from '@/lib/supabase/queries/records'

export interface ChartDataPoint {
  date: string
  hospital: string
  value: number | null
  label: string
  unit?: string
}

export interface ChartData {
  bmi: ChartDataPoint[]
  bloodPressure: {
    systolic: ChartDataPoint[]
    diastolic: ChartDataPoint[]
  }
  heartRate: ChartDataPoint[]
  cholesterol: ChartDataPoint[]
  a1c: ChartDataPoint[]
}

interface VitalData {
  date?: string
  bmi?: number
  blood_pressure?: string
  heart_rate?: number
}

interface LabData {
  date?: string
  total_cholesterol?: number
  a1c?: number
}

function parseBloodPressure(
  bp: string,
): { systolic: number; diastolic: number } | null {
  if (!bp) return null

  const match = bp.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return null

  return {
    systolic: Number.parseInt(match[1], 10),
    diastolic: Number.parseInt(match[2], 10),
  }
}

export function extractChartData(records: Record[]): ChartData {
  const chartData: ChartData = {
    bmi: [],
    bloodPressure: {
      systolic: [],
      diastolic: [],
    },
    heartRate: [],
    cholesterol: [],
    a1c: [],
  }

  const vitals = records.filter((r) => r.category === 'vitals')
  const labs = records.filter((r) => r.category === 'labs')

  for (const record of vitals) {
    const data = record.data as VitalData
    const date = data.date ?? record.recordDate ?? ''
    const hospital = record.hospital

    if (data.bmi !== undefined) {
      chartData.bmi.push({
        date,
        hospital,
        value: data.bmi,
        label: 'BMI',
        unit: 'kg/m2',
      })
    }

    if (data.blood_pressure) {
      const bp = parseBloodPressure(data.blood_pressure)
      if (bp) {
        chartData.bloodPressure.systolic.push({
          date,
          hospital,
          value: bp.systolic,
          label: 'Systolic',
          unit: 'mmHg',
        })
        chartData.bloodPressure.diastolic.push({
          date,
          hospital,
          value: bp.diastolic,
          label: 'Diastolic',
          unit: 'mmHg',
        })
      }
    }

    if (data.heart_rate !== undefined) {
      chartData.heartRate.push({
        date,
        hospital,
        value: data.heart_rate,
        label: 'Heart Rate',
        unit: 'bpm',
      })
    }
  }

  for (const record of labs) {
    const data = record.data as LabData
    const date = data.date ?? record.recordDate ?? ''
    const hospital = record.hospital

    if (data.total_cholesterol !== undefined) {
      chartData.cholesterol.push({
        date,
        hospital,
        value: data.total_cholesterol,
        label: 'Total Cholesterol',
        unit: 'mg/dL',
      })
    }

    if (data.a1c !== undefined) {
      chartData.a1c.push({
        date,
        hospital,
        value: data.a1c,
        label: 'A1C',
        unit: '%',
      })
    }
  }

  // Sort all chart data by date
  const sortByDate = (a: ChartDataPoint, b: ChartDataPoint) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()

  chartData.bmi.sort(sortByDate)
  chartData.bloodPressure.systolic.sort(sortByDate)
  chartData.bloodPressure.diastolic.sort(sortByDate)
  chartData.heartRate.sort(sortByDate)
  chartData.cholesterol.sort(sortByDate)
  chartData.a1c.sort(sortByDate)

  return chartData
}
