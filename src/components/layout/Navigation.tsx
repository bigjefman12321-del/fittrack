import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell,
  Footprints,
  HeartPulse,
  BookOpen,
  Settings,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/runs', icon: Footprints, label: 'Runs' },
  { to: '/health', icon: HeartPulse, label: 'Health' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Activity className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">FitTrack</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            location.pathname === '/settings'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
