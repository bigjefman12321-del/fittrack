import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Timer, Plus, Check, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ListSkeleton } from '@/components/shared/Loaders'
import {
  useWorkouts,
  useWorkoutSets,
  useExercises,
  useAddWorkoutSet,
  useFinishWorkout,
  useProfile,
} from '@/hooks/useData'
import { useRestTimer } from '@/hooks/useRestTimer'
import { displayToKg, formatWeight } from '@/lib/utils'
import type { SetType } from '@/types'
import { toast } from 'sonner'

export default function WorkoutSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: workouts } = useWorkouts()
  const { data: sets, isLoading } = useWorkoutSets(id)
  const { data: exercises } = useExercises()
  const { data: profile } = useProfile()
  const addSet = useAddWorkoutSet()
  const finishWorkout = useFinishWorkout()
  const { restSeconds, restRunning, startRest, stopRest } = useRestTimer()
  const unit = profile?.unit_preference ?? 'kg'

  const workout = workouts?.find((w) => w.id === id)
  const isActive = workout && !workout.ended_at

  const [search, setSearch] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [setType, setSetType] = useState<SetType>('working')
  const [restDuration, setRestDuration] = useState(90)

  const filteredExercises = (exercises ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const groupedSets = (sets ?? []).reduce<Record<string, typeof sets>>((acc, s) => {
    const key = s.exercise_id
    if (!acc[key]) acc[key] = []
    acc[key]!.push(s)
    return acc
  }, {})

  const handleAddSet = () => {
    if (!id || !selectedExercise || !reps) return
    const setNum = ((sets ?? []).filter((s) => s.exercise_id === selectedExercise).length ?? 0) + 1
    addSet.mutate(
      {
        workout_id: id,
        exercise_id: selectedExercise,
        set_number: setNum,
        set_type: setType,
        weight: displayToKg(parseFloat(weight) || 0, unit),
        reps: parseInt(reps, 10),
        rpe: rpe ? parseInt(rpe, 10) : null,
      },
      {
        onSuccess: () => {
          toast.success('Set logged')
          setReps('')
          setRpe('')
          if (setType !== 'warmup') startRest(restDuration)
        },
        onError: () => toast.error('Failed to log set'),
      }
    )
  }

  const handleFinish = () => {
    if (!id) return
    finishWorkout.mutate(id, {
      onSuccess: () => {
        toast.success('Workout complete!')
        navigate('/workouts')
      },
    })
  }

  if (isLoading) return <ListSkeleton count={4} />
  if (!workout) return <p className="text-muted-foreground">Workout not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-sm text-muted-foreground">{isActive ? 'In progress' : 'Completed'}</p>
        </div>
        {isActive && (
          <Button onClick={handleFinish} variant="secondary">
            <Check className="h-4 w-4" /> Finish
          </Button>
        )}
      </div>

      {/* Rest timer */}
      {restRunning && (
        <Card className="border-primary animate-pulse-ring">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="h-6 w-6 text-primary" />
              <span className="text-3xl font-mono font-bold">{restSeconds}s</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopRest}>Skip</Button>
          </CardContent>
        </Card>
      )}

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log Set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredExercises.map((ex) => (
                <Button
                  key={ex.id}
                  size="sm"
                  variant={selectedExercise === ex.id ? 'default' : 'outline'}
                  onClick={() => setSelectedExercise(ex.id)}
                >
                  {ex.name}
                  <span className="text-xs opacity-60 ml-1">{ex.muscle_group}</span>
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Weight ({unit})</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <Label>Reps</Label>
                <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
              </div>
              <div>
                <Label>RPE (1-10)</Label>
                <Input type="number" min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)} />
              </div>
              <div>
                <Label>Set Type</Label>
                <Select value={setType} onValueChange={(v) => setSetType(v as SetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warmup">Warm-up</SelectItem>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="drop">Drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Rest: {restDuration}s</Label>
              <Input
                type="range"
                min={30}
                max={300}
                step={15}
                value={restDuration}
                onChange={(e) => setRestDuration(parseInt(e.target.value))}
                className="flex-1"
              />
            </div>
            <Button onClick={handleAddSet} disabled={!selectedExercise} className="w-full">
              <Plus className="h-4 w-4" /> Add Set
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logged sets */}
      {Object.entries(groupedSets).map(([exId, exSets]) => {
        const exName = exSets?.[0]?.exercise?.name ?? exercises?.find((e) => e.id === exId)?.name ?? 'Exercise'
        return (
          <Card key={exId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{exName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {exSets?.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground">
                      Set {s.set_number}
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        s.set_type === 'warmup' ? 'bg-yellow-500/20 text-yellow-500' :
                        s.set_type === 'drop' ? 'bg-red-500/20 text-red-400' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {s.set_type}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatWeight(s.weight, unit)} × {s.reps}
                      {s.rpe ? ` @${s.rpe}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
