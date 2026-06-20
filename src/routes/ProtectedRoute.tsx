import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CardSkeleton } from '@/components/shared/Loaders'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
