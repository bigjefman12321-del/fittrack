import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Heart, Moon, Footprints, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ListSkeleton } from '@/components/shared/Loaders'
import { TimeRangeSelector } from '@/components/shared/TimeRangeSelector'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { useSleepRecords, useHealthMetrics } from '@/hooks/useData'
import { useUIStore } from '@/stores'
import { filterByTimeRange, formatChartDate } from '@/lib/utils'

export default function Health() {
  const { timeRange, setTimeRange } = useUIStore()
  const { data: sleep, isLoading: sleepLoading } = useSleepRecords()
  const { data: vo2 } = useHealthMetrics('vo2max')
  const { data: restingHr } = useHealthMetrics('resting_hr')
  const { data: steps } = useHealthMetrics('steps')
  const filteredSleep = useMemo(() => filterByTimeRange(sleep ?? [], timeRange), [sleep, timeRange])
  const filteredSteps = useMemo(() => filterByTimeRange(steps ?? [], timeRange), [steps, timeRange])
  const filteredVo2 = useMemo(() => filterByTimeRange(vo2 ?? [], timeRange), [vo2, timeRange])
  const filteredHr = useMemo(() => filterByTimeRange(restingHr ?? [], timeRange), [restingHr, timeRange])

  const lastSleep = sleep?.[0]
  const todaySteps = steps?.[0]?.value ?? 0
  const currentVo2 = vo2?.[0]?.value ?? 0
  const currentRhr = restingHr?.[0]?.value ?? 0

  const sleepStacked = useMemo(() =>
    filteredSleep
      .slice()
      .reverse()
      .map((s) => ({
        date: formatChartDate(s.date, timeRange),
        deep: Math.round(s.deep_s / 3600 * 10) / 10,
        light: Math.round(s.light_s / 3600 * 10) / 10,
        rem: Math.round(s.rem_s / 3600 * 10) / 10,
      })),
    [filteredSleep, timeRange]
  )

  const sleepScoreTrend = useMemo(() =>
    filteredSleep
      .slice()
      .reverse()
      .map((s) => ({ date: formatChartDate(s.date, timeRange), score: s.sleep_score ?? 0 })),
    [filteredSleep, timeRange]
  )

  const hrvTrend = useMemo(() =>
    filteredSleep
      .slice()
      .reverse()
      .filter((s) => s.hrv)
      .map((s) => ({ date: formatChartDate(s.date, timeRange), hrv: s.hrv! })),
    [filteredSleep, timeRange]
  )

  const stepsChart = useMemo(() =>
    filteredSteps
      .slice()
      .reverse()
      .map((s) => ({ date: formatChartDate(s.date, timeRange), steps: s.value })),
    [filteredSteps, timeRange]
  )

  const vo2Chart = useMemo(() =>
    filteredVo2
      .slice()
      .reverse()
      .map((v) => ({ date: formatChartDate(v.date, timeRange), vo2: v.value })),
    [filteredVo2, timeRange]
  )

  const rhrChart = useMemo(() =>
    filteredHr
      .slice()
      .reverse()
      .map((h) => ({ date: formatChartDate(h.date, timeRange), hr: h.value })),
    [filteredHr, timeRange]
  )

  if (sleepLoading) return <ListSkeleton count={4} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-sm text-muted-foreground">Sleep, recovery & vitals from Garmin</p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <Moon className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold">{lastSleep?.sleep_score ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Sleep Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Activity className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold">{currentVo2.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">VO2 Max</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Footprints className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold">{todaySteps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Steps Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Heart className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold">{currentRhr}</p>
            <p className="text-xs text-muted-foreground">Resting HR (bpm)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BarChartCard
          title="Sleep Duration (hours)"
          data={sleepStacked}
          dataKey="deep"
          stacked
          stackKeys={[
            { key: 'deep', color: '#1e40af', name: 'Deep' },
            { key: 'light', color: '#3b82f6', name: 'Light' },
            { key: 'rem', color: '#8b5cf6', name: 'REM' },
          ]}
        />
        <LineChartCard title="Sleep Score" data={sleepScoreTrend} dataKey="score" color="#6366f1" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <LineChartCard title="VO2 Max" data={vo2Chart} dataKey="vo2" color="#22c55e" />
        <LineChartCard title="Resting Heart Rate" data={rhrChart} dataKey="hr" color="#ef4444" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BarChartCard title="Daily Steps" data={stepsChart} dataKey="steps" color="#f59e0b" />
        <LineChartCard title="HRV" data={hrvTrend} dataKey="hrv" color="#06b6d4" />
      </div>
    </div>
  )
}
