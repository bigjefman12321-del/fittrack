import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeGarminCode } from '@/lib/garmin'
import { isDemoMode } from '@/lib/utils'
import { toast } from 'sonner'
import { CardSkeleton } from '@/components/shared/Loaders'

export default function GarminCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = params.get('code') ?? params.get('oauth_token')
    if (isDemoMode()) {
      toast.success('Garmin connected (demo)')
      navigate('/settings')
      return
    }
    if (!code) {
      toast.error('No authorization code received')
      navigate('/settings')
      return
    }
    exchangeGarminCode(code)
      .then(() => {
        toast.success('Garmin connected!')
        navigate('/settings')
      })
      .catch(() => {
        toast.error('Failed to connect Garmin. Ensure Health API access is approved.')
        navigate('/settings')
      })
  }, [params, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <CardSkeleton />
        <p className="text-muted-foreground">Connecting Garmin...</p>
      </div>
    </div>
  )
}
