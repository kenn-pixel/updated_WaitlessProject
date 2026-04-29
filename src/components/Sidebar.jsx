import { IconLayoutDashboard, IconCalendarEvent, IconChartBar, IconSettings, IconChevronRight } from '@tabler/icons-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: IconLayoutDashboard, label: 'Queue' },
  { to: '/appointments', icon: IconCalendarEvent, label: 'Appointments' },
  { to: '/analytics', icon: IconChartBar, label: 'Analytics', adminOnly: true },
  { to: '/settings', icon: IconSettings, label: 'Settings' },
]

export default function Sidebar({ open }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`} style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '0.75rem',
      flexShrink: 0,
      height: '100%',
    }}>
      {NAV.filter(n => !n.adminOnly || user?.role === 'admin').map(({ to, icon: Icon, label }) => {
        const active = pathname === to
        return (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              margin: '0.125rem 0.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              background: active ? 'color-mix(in srgb, #00C9A7 12%, transparent)' : 'transparent',
              color: active ? '#00C9A7' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: '0.875rem',
              transition: 'background 0.15s ease, color 0.15s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {open && <span>{label}</span>}
              {open && active && <IconChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </div>
          </NavLink>
        )
      })}
    </aside>
  )
}
