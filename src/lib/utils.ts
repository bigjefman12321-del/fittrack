import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, startOfDay, subDays } from 'date-fns'
import type { TimeRange, UnitPreference, DistanceUnit } from '@/types'
import { TIME_RANGE_DAYS } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatPace(paceSPerKm: number, unit: DistanceUnit = 'km'): string {
  const pace = unit === 'miles' ? paceSPerKm * 1.60934 : paceSPerKm
  const m = Math.floor(pace / 60)
  const s = Math.round(pace % 60)
  return `${m}:${s.toString().padStart(2, '0')}/${unit === 'miles' ? 'mi' : 'km'}`
}

export function formatDistance(meters: number, unit: DistanceUnit = 'km'): string {
  if (unit === 'miles') return `${(meters / 1609.34).toFixed(2)} mi`
  return `${(meters / 1000).toFixed(2)} km`
}

export function formatWeight(kg: number, unit: UnitPreference = 'kg'): string {
  if (unit === 'lbs') return `${Math.round(kg * 2.20462)} lbs`
  return `${kg} kg`
}

export function kgToDisplay(kg: number, unit: UnitPreference): number {
  return unit === 'lbs' ? Math.round(kg * 2.20462 * 10) / 10 : kg
}

export function displayToKg(value: number, unit: UnitPreference): number {
  return unit === 'lbs' ? Math.round((value / 2.20462) * 10) / 10 : value
}

export function calculateVolume(sets: { weight: number; reps: number; set_type: string }[]): number {
  return sets
    .filter((s) => s.set_type === 'working' || s.set_type === 'drop')
    .reduce((acc, s) => acc + s.weight * s.reps, 0)
}

export function filterByTimeRange<T extends { date?: string; started_at?: string; logged_at?: string }>(
  items: T[],
  range: TimeRange,
  dateKey: 'date' | 'started_at' | 'logged_at' = 'date'
): T[] {
  const days = TIME_RANGE_DAYS[range]
  if (days === null) return items
  const cutoff = subDays(startOfDay(new Date()), days)
  return items.filter((item) => {
    const raw = item[dateKey]
    if (!raw) return false
    return parseISO(raw.split('T')[0] ?? raw) >= cutoff
  })
}

export function formatChartDate(dateStr: string, range: TimeRange): string {
  const d = parseISO(dateStr)
  if (range === '1W' || range === '1M') return format(d, 'MMM d')
  if (range === '3M' || range === '6M') return format(d, 'MMM d')
  return format(d, 'MMM yy')
}

export function getTodayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true'
}

export function playRestTimerSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

export function groupByWeek(dates: string[]): Map<string, number> {
  const map = new Map<string, number>()
  dates.forEach((d) => {
    const week = format(parseISO(d), 'yyyy-ww')
    map.set(week, (map.get(week) ?? 0) + 1)
  })
  return map
}
