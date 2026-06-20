import { format, parseISO, subDays } from 'date-fns'
import { Dumbbell, Droplets, Footprints, Moon, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/charts/Sparkline'
import { CardSkeleton } from '@/components/shared/Loaders'
import {
  useProfile,
  useWorkouts,
  useAllWorkoutSets,
  useRuns,
  useSleepRecords,
  useHealthMetrics,
  useWaterLogs,
  useAddWaterLog,
} from '@/hooks/useData'
import { getTodayKey, calculateVolume, formatDuration, formatDistance, formatWeight } from '@/lib/utils'
import { WaterTracker } from '@/components/shared/WaterTracker'
import { toast } from 'sonner'

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: workouts } = useWorkouts()
  const { data: sets } = useAllWorkoutSets()
  const { data: runs } = useRuns()
  const { data: sleep } = useSleepRecords()
  const { data: steps } = useHealthMetrics('steps')
  const { data: waterLogs } = useWaterLogs()
  const addWater = useAddWaterLog()

  const today = getTodayKey()
  const todayWater = (waterLogs ?? [])
    .filter((l) => l.logged_at.startsWith(today))
    .reduce((s, l) => s + l.amount_ml, 0)
  const waterGoal = profile?.water_goal_ml ?? 2500
  const waterPercent = Math.round((todayWater / waterGoal) * 100)

  const lastSleep = sleep?.[0]
  const todaySteps = steps?.find((s) => s.date === today)?.value ?? steps?.[0]?.value ?? 0
  const lastWorkout = workouts?.[0]

  const weekWorkouts = (workouts ?? []).filter((w) => parseISO(w.started_at) >= subDays(new Date(), 7))
  const weekRuns = (runs ?? []).filter((r) => parseISO(r.date) >= subDays(new Date(), 7))
  const weekVolume = weekWorkouts.reduce((acc, wo) => {
    const woSets = (sets ?? []).filter((s) => s.workout_id === wo.id)
    return acc + calculateVolume(woSets)
  }, 0)

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const handleQuickWater = (ml: number) => {
    addWater.mutate(ml, {
      onSuccess: () => toast.success(`Added ${ml}ml`),
      onError: () => toast.error('Failed to log water'),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {profile?.display_name ?? 'Athlete'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Moon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Sleep</span>
            </div>
            <p className="text-2xl font-bold">{lastSleep?.sleep_score ?? '—'}</p>
            <p className="text-xs text-muted-foreground">score last night</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Footprints className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Steps</span>
            </div>
            <p className="text-2xl font-bold">{todaySteps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Water</span>
            </div>
            <p className="text-2xl font-bold">{waterPercent}%</p>
            <p className="text-xs text-muted-foreground">{todayWater}ml / {waterGoal}ml</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Last Workout</span>
            </div>
            <p className="text-lg font-bold truncate">{lastWorkout?.name ?? 'None'}</p>
            <p className="text-xs text-muted-foreground">
              {lastWorkout ? format(parseISO(lastWorkout.started_at), 'MMM d') : 'Start one today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Add</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleQuickWater(250)}>
            <Droplets className="h-4 w-4" /> +250ml
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleQuickWater(500)}>
            <Droplets className="h-4 w-4" /> +500ml
          </Button>
          <Button size="sm" asChild>
            <Link to="/workouts">
              <Plus className="h-4 w-4" /> New Workout
            </Link>
          </Button>
        </CardContent>
      </Card>

      <WaterTracker />

      {/* This week at a glance */}
      <div>
        <h2 className="text-lg font-semibold mb-3">This Week at a Glance</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workouts</p>
                <p className="text-xl font-bold">{weekWorkouts.length}</p>
              </div>
              <Sparkline
                data={weekWorkouts.slice(0, 7).map((_, i) => ({ value: i + 1 }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-xl font-bold">
                  {formatWeight(weekVolume / 1000, profile?.unit_preference ?? 'kg').replace(/\s.*/, 'k')}
                </p>
              </div>
              <Sparkline data={[{ value: weekVolume / 1000 }]} color="#22c55e" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Runs</p>
                <p className="text-xl font-bold">{weekRuns.length}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(weekRuns.reduce((s, r) => s + r.distance_m, 0), profile?.distance_unit ?? 'km')}
                </p>
              </div>
              <Sparkline
                data={weekRuns.slice(0, 7).map((r) => ({ value: r.distance_m / 1000 }))}
                color="#f59e0b"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
