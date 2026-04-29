import { IconSettings } from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'

export default function Settings() {
  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Settings</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System configuration and preferences.</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <IconSettings size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.875rem' }}>Settings panel coming soon.</p>
      </div>
    </DashboardLayout>
  )
}
