import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BarChartCardProps {
  title: string
  data: Record<string, unknown>[]
  dataKey: string
  xKey?: string
  color?: string
  height?: number
  className?: string
  stacked?: boolean
  stackKeys?: { key: string; color: string; name: string }[]
  formatter?: (value: number) => string
}

export function BarChartCard({
  title,
  data,
  dataKey,
  xKey = 'date',
  color = '#3b82f6',
  height = 250,
  className,
  stacked,
  stackKeys,
  formatter,
}: BarChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#161922', border: '1px solid #2a3142', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: number) => [formatter ? formatter(value) : value]}
            />
            {stacked && stackKeys ? (
              stackKeys.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} name={s.name} radius={[0, 0, 0, 0]} />
              ))
            ) : (
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
