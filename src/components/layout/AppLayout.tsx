import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar, BottomNav } from './Navigation'
import { Toaster } from 'sonner'
import { isDemoMode } from '@/lib/utils'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        {isDemoMode() && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center text-xs text-primary">
            Demo mode — sample data loaded. Set VITE_DEMO_MODE=false and configure Supabase for production.
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  )
}
