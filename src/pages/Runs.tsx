import { useMemo, useState } from 'react'
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from 'date-fns'
import { ExternalLink, Footprints, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/Loaders'
import { TimeRangeSelector } from '@/components/shared/TimeRangeSelector'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { CalendarHeatmap } from '@/components/charts/Heatmap'
import { useRuns, useProfile, useAddManualRun } from '@/hooks/useData'
import { useUIStore } from '@/stores'
import { filterByTimeRange, formatChartDate, formatDistance, formatDuration, formatPace, getTodayKey } from '@/lib/utils'
import { getStravaActivityUrl } from '@/lib/strava'
import { toast } from 'sonner'

export default function Runs() {
  const { timeRange, setTimeRange } = useUIStore()
  const { data: runs, isLoading } = useRuns()
  const { data: profile } = useProfile()
  const addRun = useAddManualRun()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [manualDate, setManualDate] = useState(getTodayKey())
  const [manualDistance, setManualDistance] = useState('')
  const [manualDuration, setManualDuration] = useState('')
  const unit = profile?.distance_unit ?? 'km'

  const filtered = useMemo(() => filterByTimeRange(runs ?? [], timeRange), [runs, timeRange])

  const weeklyDistance = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subDays(new Date(), 180), end: new Date() })
    return weeks.map((ws) => {
      const we = endOfWeek(ws)
      const dist = (runs ?? [])
        .filter((r) => {
          const d = parseISO(r.date)
          return d >= ws && d <= we
        })
        .reduce((s, r) => s + r.distance_m, 0)
      return { date: format(ws, 'MMM d'), distance: Math.round(dist / 100) / 10 }
    }).slice(-12)
  }, [runs])

  const paceTrend = useMemo(() =>
    filtered
      .slice()
      .reverse()
      .map((r) => ({
        date: formatChartDate(r.date, timeRange),
        pace: Math.round(r.pace_s_per_km),
      })),
    [filtered, timeRange]
  )

  const elevationTrend = useMemo(() =>
    filtered
      .slice()
      .reverse()
      .map((r) => ({
        date: formatChartDate(r.date, timeRange),
        elevation: r.elevation_m ?? 0,
      })),
    [filtered, timeRange]
  )

  const handleManualAdd = () => {
    const distKm = parseFloat(manualDistance)
    const durMin = parseFloat(manualDuration)
    if (!distKm || !durMin) return
    const distance_m = unit === 'miles' ? distKm * 1609.34 : distKm * 1000
    const duration_s = durMin * 60
    addRun.mutate(
      {
        date: manualDate,
        distance_m,
        duration_s,
        pace_s_per_km: duration_s / (distance_m / 1000),
        elevation_m: null,
        avg_hr: null,
        polyline: null,
        source: 'manual',
        name: 'Manual Run',
      },
      {
        onSuccess: () => {
          toast.success('Run logged')
          setDialogOpen(false)
        },
        onError: () => toast.error('Failed to log run'),
      }
    )
  }

  if (isLoading) return <ListSkeleton count={5} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Runs</h1>
          <p className="text-sm text-muted-foreground">Synced from Strava or logged manually</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary"><Plus className="h-4 w-4" /> Manual Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Manual Run</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Date</Label><Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} /></div>
                <div><Label>Distance ({unit})</Label><Input type="number" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)} /></div>
                <div><Label>Duration (minutes)</Label><Input type="number" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} /></div>
                <Button onClick={handleManualAdd} className="w-full">Save Run</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BarChartCard
          title={`Weekly Distance (${unit})`}
          data={weeklyDistance}
          dataKey="distance"
          color="#22c55e"
        />
        <LineChartCard
          title="Pace Trend"
          data={paceTrend}
          dataKey="pace"
          color="#f59e0b"
          formatter={(v) => formatPace(v, unit)}
        />
      </div>

      <LineChartCard title="Elevation Gain" data={elevationTrend} dataKey="elevation" color="#8b5cf6" />

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Run Calendar</h3>
          <CalendarHeatmap dates={(runs ?? []).map((r) => r.date)} months={3} />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">All Runs</h2>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Footprints className="h-8 w-8" />}
            title="No runs yet"
            description="Connect Strava in Settings or log a run manually."
            actionLabel="Log Run"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{run.name ?? 'Run'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(run.date), 'MMM d, yyyy')} · {run.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatDistance(run.distance_m, unit)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(run.duration_s)} · {formatPace(run.pace_s_per_km, unit)}
                      </p>
                    </div>
                    {run.strava_id && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={getStravaActivityUrl(run.strava_id)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
