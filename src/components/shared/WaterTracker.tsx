import { useMemo } from 'react'
import { format, parseISO, subDays, startOfDay } from 'date-fns'
import { Droplets, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { WaterProgressRing } from '@/components/charts/Heatmap'
import { useWaterLogs, useAddWaterLog, useProfile } from '@/hooks/useData'
import { useWaterStore } from '@/stores'
import { getTodayKey } from '@/lib/utils'
import { toast } from 'sonner'

export function WaterTracker() {
  const { data: logs } = useWaterLogs()
  const { data: profile } = useProfile()
  const addWater = useAddWaterLog()
  const { customAmount, setCustomAmount } = useWaterStore()

  const today = getTodayKey()
  const goal = profile?.water_goal_ml ?? 2500

  const todayTotal = useMemo(
    () => (logs ?? []).filter((l) => l.logged_at.startsWith(today)).reduce((s, l) => s + l.amount_ml, 0),
    [logs, today]
  )

  const percent = Math.min(Math.round((todayTotal / goal) * 100), 100)

  const dailyData30 = useMemo(() => {
    const days: { date: string; intake: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const total = (logs ?? [])
        .filter((l) => l.logged_at.startsWith(d))
        .reduce((s, l) => s + l.amount_ml, 0)
      days.push({ date: format(parseISO(d), 'MMM d'), intake: total })
    }
    return days
  }, [logs])

  const rollingAvg = useMemo(() => {
    return dailyData30.map((_, i) => {
      const slice = dailyData30.slice(Math.max(0, i - 6), i + 1)
      const avg = slice.reduce((s, d) => s + d.intake, 0) / slice.length
      return { date: dailyData30[i]!.date, avg: Math.round(avg) }
    })
  }, [dailyData30])

  const streak = useMemo(() => {
    let count = 0
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(startOfDay(new Date()), i), 'yyyy-MM-dd')
      const total = (logs ?? [])
        .filter((l) => l.logged_at.startsWith(d))
        .reduce((s, l) => s + l.amount_ml, 0)
      if (total >= goal) count++
      else break
    }
    return count
  }, [logs, goal])

  const handleAdd = (ml: number) => {
    addWater.mutate(ml, {
      onSuccess: () => toast.success(`+${ml}ml logged`),
      onError: () => toast.error('Failed to log water'),
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" /> Water Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center">
              <WaterProgressRing percent={percent} size={100} />
              <div className="absolute text-center">
                <p className="text-xl font-bold">{percent}%</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {todayTotal}ml / {goal}ml today
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleAdd(250)}>+250ml</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAdd(500)}>+500ml</Button>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    className="w-20 h-8"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                  />
                  <Button size="sm" onClick={() => handleAdd(customAmount)}>Add</Button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-orange-400">
                <Flame className="h-4 w-4" />
                {streak} day streak hitting goal
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <BarChartCard title="Daily Intake (30 days)" data={dailyData30} dataKey="intake" formatter={(v) => `${v}ml`} />
        <LineChartCard title="7-Day Rolling Average" data={rollingAvg} dataKey="avg" formatter={(v) => `${v}ml`} color="#06b6d4" />
      </div>
    </div>
  )
}
