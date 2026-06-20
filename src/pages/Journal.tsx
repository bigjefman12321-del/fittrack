import { useMemo, useState, useEffect } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { useJournalEntries, useSaveJournalEntry } from '@/hooks/useData'
import { getTodayKey } from '@/lib/utils'
import { MOOD_EMOJIS, MOOD_LABELS, DEFAULT_TAGS, type MoodLevel } from '@/types'
import { toast } from 'sonner'

export default function Journal() {
  const { data: entries } = useJournalEntries()
  const saveEntry = useSaveJournalEntry()
  const today = getTodayKey()

  const todayEntry = entries?.find((e) => e.date === today)
  const [content, setContent] = useState(todayEntry?.content_html ?? '')
  const [mood, setMood] = useState<MoodLevel>((todayEntry?.mood as MoodLevel) ?? 3)
  const [tags, setTags] = useState<string[]>(todayEntry?.tags ?? [])
  const [customTag, setCustomTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'edit' | 'calendar' | 'timeline'>('edit')

  useEffect(() => {
    if (todayEntry) {
      setContent(todayEntry.content_html)
      setMood(todayEntry.mood as MoodLevel)
      setTags(todayEntry.tags)
    }
  }, [todayEntry?.id])

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries ?? []
    const q = searchQuery.toLowerCase()
    return (entries ?? []).filter(
      (e) =>
        e.content_html.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [entries, searchQuery])

  const tagFrequency = useMemo(() => {
    const freq = new Map<string, number>()
    ;(entries ?? []).forEach((e) => {
      e.tags.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1))
    })
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }))
  }, [entries])

  const handleSave = () => {
    saveEntry.mutate(
      { date: today, content_html: content, mood, tags },
      {
        onSuccess: () => toast.success('Journal saved'),
        onError: () => toast.error('Failed to save'),
      }
    )
  }

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const addCustomTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag])
      setCustomTag('')
    }
  }

  // Calendar dots for last 30 days
  const calendarDays = useMemo(() => {
    const days: { date: string; mood: MoodLevel | null }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const entry = entries?.find((e) => e.date === d)
      days.push({ date: d, mood: entry?.mood as MoodLevel ?? null })
    }
    return days
  }, [entries])

  const moodColors: Record<MoodLevel, string> = {
    1: 'bg-slate-500',
    2: 'bg-blue-400',
    3: 'bg-green-400',
    4: 'bg-yellow-400',
    5: 'bg-orange-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground">Reflect on your training & recovery</p>
        </div>
        <div className="flex gap-2">
          {(['edit', 'calendar', 'timeline'] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {view === 'edit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{format(new Date(), 'EEEE, MMMM d')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">How are you feeling?</p>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      mood === m ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'hover:bg-secondary'
                    }`}
                    title={MOOD_LABELS[m]}
                  >
                    {MOOD_EMOJIS[m]}
                  </button>
                ))}
              </div>
            </div>

            <ReactQuill theme="snow" value={content} onChange={setContent} />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_TAGS.map((tag) => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={tags.includes(tag) ? 'default' : 'outline'}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                />
                <Button variant="secondary" onClick={addCustomTag}>Add</Button>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">Save Entry</Button>
          </CardContent>
        </Card>
      )}

      {view === 'calendar' && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Mood Calendar (30 days)</h3>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, mood: m }) => (
                <div
                  key={date}
                  title={`${format(parseISO(date), 'MMM d')}${m ? ` — ${MOOD_LABELS[m]}` : ''}`}
                  className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                    m ? moodColors[m] : 'bg-muted/30'
                  }`}
                >
                  {m ? MOOD_EMOJIS[m] : ''}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'timeline' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {filteredEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No entries found</p>
          ) : (
            filteredEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
                    <span className="text-xl">{MOOD_EMOJIS[entry.mood as MoodLevel]}</span>
                  </div>
                  <div
                    className="text-sm text-muted-foreground prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: entry.content_html }}
                  />
                  <div className="flex gap-1 mt-2">
                    {entry.tags.map((t) => (
                      <span key={t} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tagFrequency.length > 0 && (
        <BarChartCard
          title="Tag Frequency"
          data={tagFrequency}
          dataKey="count"
          xKey="tag"
          color="#8b5cf6"
        />
      )}
    </div>
  )
}
