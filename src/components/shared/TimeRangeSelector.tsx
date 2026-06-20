import type { TimeRange } from '@/types'
import { cn } from '@/lib/utils'

const RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'All']

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn('inline-flex rounded-lg bg-muted p-1 gap-0.5', className)}>
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
            value === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  )
}
