import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: { value: number }[]
  color?: string
  className?: string
}

export function Sparkline({ data, color = '#3b82f6', className }: SparklineProps) {
  return (
    <div className={cn('h-10 w-24', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
