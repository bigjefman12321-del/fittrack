import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeStravaCode } from '@/lib/strava'
import { isDemoMode } from '@/lib/utils'
import { toast } from 'sonner'
import { CardSkeleton } from '@/components/shared/Loaders'

export default function StravaCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = params.get('code')
    if (isDemoMode()) {
      toast.success('Strava connected (demo)')
      navigate('/settings')
      return
    }
    if (!code) {
      toast.error('No authorization code received')
      navigate('/settings')
      return
    }
    exchangeStravaCode(code)
      .then((res) => {
        toast.success(`Strava connected! Synced ${(res as { synced?: number }).synced ?? 0} runs.`)
        navigate('/settings')
      })
      .catch(() => {
        toast.error('Failed to connect Strava')
        navigate('/settings')
      })
  }, [params, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <CardSkeleton />
        <p className="text-muted-foreground">Connecting Strava...</p>
      </div>
    </div>
  )
}
