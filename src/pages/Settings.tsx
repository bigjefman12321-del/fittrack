import { useState } from 'react'
import { LogOut, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useData'
import {
  getStravaAuthUrl,
  syncStravaActivities,
  disconnectStrava,
  isStravaConfigured,
} from '@/lib/strava'
import {
  getGarminAuthUrl,
  syncGarminHealth,
  disconnectGarmin,
  isGarminConfigured,
} from '@/lib/garmin'
import { isDemoMode } from '@/lib/utils'
import { toast } from 'sonner'

export default function Settings() {
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [name, setName] = useState(profile?.display_name ?? '')
  const [waterGoal, setWaterGoal] = useState(profile?.water_goal_ml ?? 2500)
  const [unit, setUnit] = useState(profile?.unit_preference ?? 'kg')
  const [distanceUnit, setDistanceUnit] = useState(profile?.distance_unit ?? 'km')

  const handleSave = () => {
    updateProfile.mutate(
      {
        display_name: name,
        water_goal_ml: waterGoal,
        unit_preference: unit as 'kg' | 'lbs',
        distance_unit: distanceUnit as 'km' | 'miles',
      },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: () => toast.error('Failed to update profile'),
      }
    )
  }

  const handleStravaConnect = () => {
    if (isDemoMode()) {
      toast.success('Strava connected (demo)')
      return
    }
    if (!isStravaConfigured()) {
      toast.error('Set VITE_STRAVA_CLIENT_ID in .env')
      return
    }
    window.location.href = getStravaAuthUrl()
  }

  const handleGarminConnect = () => {
    if (isDemoMode()) {
      toast.success('Garmin connected (demo)')
      return
    }
    if (!isGarminConfigured()) {
      toast.error('Set VITE_GARMIN_CLIENT_ID in .env')
      return
    }
    window.location.href = getGarminAuthUrl()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, units, and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{profile?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Daily Water Goal (ml)</Label>
            <Input type="number" value={waterGoal} onChange={(e) => setWaterGoal(parseInt(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Weight Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distance Unit</Label>
              <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers (km)</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave}>Save Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect third-party services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium">Strava</p>
              <p className="text-xs text-muted-foreground">
                {profile?.strava_connected ? 'Connected' : 'Not connected'} — sync runs automatically
              </p>
            </div>
            <div className="flex gap-2">
              {profile?.strava_connected && !isDemoMode() && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => syncStravaActivities().then((r) => toast.success(`Synced ${r.synced} runs`))}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => disconnectStrava().then(() => toast.success('Disconnected'))}>
                    Disconnect
                  </Button>
                </>
              )}
              {!profile?.strava_connected && (
                <Button size="sm" onClick={handleStravaConnect}>Connect Strava</Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium">Garmin Connect</p>
              <p className="text-xs text-muted-foreground">
                {profile?.garmin_connected ? 'Connected' : 'Not connected'} — sleep, HRV, VO2 Max, steps
              </p>
            </div>
            <div className="flex gap-2">
              {profile?.garmin_connected && !isDemoMode() && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => syncGarminHealth().then(() => toast.success('Sync started'))}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => disconnectGarmin().then(() => toast.success('Disconnected'))}>
                    Disconnect
                  </Button>
                </>
              )}
              {!profile?.garmin_connected && (
                <Button size="sm" onClick={handleGarminConnect}>Connect Garmin</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" className="w-full" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
