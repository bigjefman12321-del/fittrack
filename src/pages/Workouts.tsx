import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from 'date-fns'
import { Dumbbell, Plus, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/Loaders'
import { TimeRangeSelector } from '@/components/shared/TimeRangeSelector'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { ContributionHeatmap } from '@/components/charts/Heatmap'
import {
  useWorkouts,
  useAllWorkoutSets,
  useExercises,
  usePRs,
  useCreateWorkout,
  useProfile,
} from '@/hooks/useData'
import { useUIStore } from '@/stores'
import {
  filterByTimeRange,
  formatChartDate,
  calculateVolume,
  formatDuration,
  formatWeight,
} from '@/lib/utils'
import { toast } from 'sonner'

export default function Workouts() {
  const navigate = useNavigate()
  const { timeRange, setTimeRange } = useUIStore()
  const { data: workouts, isLoading } = useWorkouts()
  const { data: sets } = useAllWorkoutSets()
  const { data: exercises } = useExercises()
  const { data: prs } = usePRs()
  const { data: profile } = useProfile()
  const createWorkout = useCreateWorkout()
  const [newName, setNewName] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('ex-1')

  const filteredWorkouts = useMemo(
    () => filterByTimeRange(workouts ?? [], timeRange, 'started_at'),
    [workouts, timeRange]
  )

  const maxWeightChart = useMemo(() => {
    const exerciseMap = new Map<string, { date: string; weight: number; name: string }[]>()
    ;(sets ?? []).forEach((s) => {
      if (s.set_type === 'warmup') return
      const date = (workouts ?? []).find((w) => w.id === s.workout_id)?.started_at?.split('T')[0]
      if (!date) return
      const arr = exerciseMap.get(s.exercise_id) ?? []
      const existing = arr.find((a) => a.date === date)
      if (!existing || s.weight > existing.weight) {
        if (existing) existing.weight = s.weight
        else arr.push({ date, weight: s.weight, name: s.exercise?.name ?? 'Exercise' })
      }
      exerciseMap.set(s.exercise_id, arr)
    })
    const exData = exerciseMap.get(selectedExercise) ?? []
    return exData
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ date: formatChartDate(d.date, timeRange), weight: d.weight }))
  }, [sets, workouts, selectedExercise, timeRange])

  const weeklyVolume = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subDays(new Date(), 180), end: new Date() })
    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart)
      const weekWorkouts = (workouts ?? []).filter((w) => {
        const d = parseISO(w.started_at)
        return d >= weekStart && d <= weekEnd
      })
      const volume = weekWorkouts.reduce((acc, wo) => {
        const woSets = (sets ?? []).filter((s) => s.workout_id === wo.id)
        return acc + calculateVolume(woSets)
      }, 0)
      return { date: format(weekStart, 'MMM d'), volume: Math.round(volume) }
    }).slice(-12)
  }, [workouts, sets])

  const handleCreate = () => {
    if (!newName.trim()) return
    createWorkout.mutate(newName, {
      onSuccess: (wo) => {
        setDialogOpen(false)
        setNewName('')
        toast.success('Workout started!')
        navigate(`/workouts/${wo.id}`)
      },
      onError: () => toast.error('Failed to create workout'),
    })
  }

  if (isLoading) return <ListSkeleton count={5} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-sm text-muted-foreground">Track lifts, sets, and PRs</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Workout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Workout</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Push Day, Leg Day..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} className="w-full">Start</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* PRs */}
      {(prs ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-500" /> Personal Records
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {prs!.map((pr) => (
              <Card key={pr.exercise_id} className="min-w-[160px] shrink-0 border-yellow-500/20">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{pr.exercise_name}</p>
                  <p className="text-lg font-bold text-yellow-500">
                    {formatWeight(pr.max_weight, profile?.unit_preference ?? 'kg')} × {pr.reps}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <select
            className="mb-2 h-8 rounded-md border border-border bg-background px-2 text-sm"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
          >
            {(exercises ?? []).map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <LineChartCard
            title="Max Weight Over Time"
            data={maxWeightChart}
            dataKey="weight"
            formatter={(v) => formatWeight(v, profile?.unit_preference ?? 'kg')}
          />
        </div>
        <BarChartCard title="Weekly Volume" data={weeklyVolume} dataKey="volume" />
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Workout Frequency</h3>
          <ContributionHeatmap
            dates={(workouts ?? []).map((w) => w.started_at)}
            weeks={16}
          />
        </CardContent>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold mb-3">History</h2>
        {filteredWorkouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-8 w-8" />}
            title="No workouts yet"
            description="Start your first session to begin tracking your lifts and progress."
            actionLabel="Start Workout"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {filteredWorkouts.map((wo) => {
              const woSets = (sets ?? []).filter((s) => s.workout_id === wo.id)
              const volume = calculateVolume(woSets)
              const duration = wo.ended_at
                ? Math.round((parseISO(wo.ended_at).getTime() - parseISO(wo.started_at).getTime()) / 1000)
                : null
              return (
                <Link key={wo.id} to={`/workouts/${wo.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{wo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(wo.started_at), 'MMM d, yyyy')}
                          {duration ? ` · ${formatDuration(duration)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatWeight(volume / 1000, profile?.unit_preference ?? 'kg').replace(/\s.*/, '')}k vol
                        </p>
                        <p className="text-xs text-muted-foreground">{woSets.length} sets</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
