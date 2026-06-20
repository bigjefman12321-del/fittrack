import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface HeatmapProps {
  dates: string[]
  weeks?: number
  className?: string
}

export function ContributionHeatmap({ dates, weeks = 12, className }: HeatmapProps) {
  const end = new Date()
  const start = subDays(end, weeks * 7)
  const days = eachDayOfInterval({ start, end })
  const countMap = new Map<string, number>()
  dates.forEach((d) => countMap.set(d.split('T')[0]!, (countMap.get(d.split('T')[0]!) ?? 0) + 1))

  const maxCount = Math.max(1, ...Array.from(countMap.values()))

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted'
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'bg-primary/25'
    if (ratio <= 0.5) return 'bg-primary/50'
    if (ratio <= 0.75) return 'bg-primary/75'
    return 'bg-primary'
  }

  const weekGroups: Date[][] = []
  let currentWeek: Date[] = []
  days.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weekGroups.push(currentWeek)
      currentWeek = []
    }
  })
  if (currentWeek.length) weekGroups.push(currentWeek)

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex gap-1 min-w-max">
        {weekGroups.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const count = countMap.get(key) ?? 0
              return (
                <div
                  key={key}
                  title={`${format(day, 'MMM d')}: ${count} workout${count !== 1 ? 's' : ''}`}
                  className={cn('h-3 w-3 rounded-sm', getIntensity(count))}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CalendarHeatmapProps {
  dates: string[]
  getColor?: (date: string) => string
  months?: number
}

export function CalendarHeatmap({ dates, getColor, months = 3 }: CalendarHeatmapProps) {
  const end = new Date()
  const start = subDays(end, months * 30)
  const days = eachDayOfInterval({ start, end })
  const dateSet = new Set(dates.map((d) => d.split('T')[0]))

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const active = dateSet.has(key)
        return (
          <div
            key={key}
            title={format(day, 'MMM d')}
            className={cn(
              'aspect-square rounded-sm text-[10px] flex items-center justify-center',
              active ? (getColor?.(key) ?? 'bg-primary/60') : 'bg-muted/50'
            )}
          />
        )
      })}
    </div>
  )
}

export function WaterProgressRing({ percent, size = 120 }: { percent: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1f2e" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}
