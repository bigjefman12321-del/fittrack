import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isDemoMode } from '@/lib/utils'
import { toast } from 'sonner'

export default function Login() {
  const { isAuthenticated, signIn, signUp, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSignIn = async () => {
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) toast.error(error.message)
    else toast.success('Welcome back!')
  }

  const handleSignUp = async () => {
    setSubmitting(true)
    const { error } = await signUp(email, password, name)
    setSubmitting(false)
    if (error) toast.error(error.message)
    else toast.success('Account created! Check your email to confirm.')
  }

  const handleDemoLogin = async () => {
    await signIn('demo@fittrack.app', 'demo')
    toast.success('Demo mode activated')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">FitTrack</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to track your fitness journey</CardDescription>
          </CardHeader>
          <CardContent>
            {isDemoMode() && (
              <Button className="w-full mb-4" variant="secondary" onClick={handleDemoLogin}>
                Continue in Demo Mode
              </Button>
            )}

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSignIn} disabled={submitting}>
                  Sign In
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSignUp} disabled={submitting}>
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
