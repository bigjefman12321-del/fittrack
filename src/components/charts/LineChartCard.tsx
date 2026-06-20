import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  data: Record<string, unknown>[]
  dataKey: string
  xKey?: string
  color?: string
  height?: number
  className?: string
  formatter?: (value: number) => string
}

export function LineChartCard({
  title,
  data,
  dataKey,
  xKey = 'date',
  color = '#3b82f6',
  height = 250,
  className,
  formatter,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
            <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#161922', border: '1px solid #2a3142', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => [formatter ? formatter(value) : value, title]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
