import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1],
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-8"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
