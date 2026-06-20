import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Workouts from '@/pages/Workouts'
import WorkoutSession from '@/pages/WorkoutSession'
import Runs from '@/pages/Runs'
import Health from '@/pages/Health'
import Journal from '@/pages/Journal'
import Settings from '@/pages/Settings'
import StravaCallback from '@/pages/auth/StravaCallback'
import GarminCallback from '@/pages/auth/GarminCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/strava/callback" element={<StravaCallback />} />
      <Route path="/auth/garmin/callback" element={<GarminCallback />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/:id" element={<WorkoutSession />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/health" element={<Health />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
