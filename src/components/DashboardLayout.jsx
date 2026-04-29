import { useState } from 'react'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import LiveTickerBar from './LiveTickerBar'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppHeader onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <LiveTickerBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar open={sidebarOpen} />
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          background: 'var(--bg)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
