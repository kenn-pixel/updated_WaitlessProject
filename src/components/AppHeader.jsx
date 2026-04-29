import { IconSun, IconMoon, IconBell, IconLogout, IconMenu2 } from '@tabler/icons-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AppHeader({ onToggleSidebar }) {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header style={{
      height: '56px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      gap: '0.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <button className="btn-secondary" style={{ padding: '0.375rem', border: 'none' }} onClick={onToggleSidebar}>
        <IconMenu2 size={18} />
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '6px',
          background: '#00C9A7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#0D1117', fontWeight: 900, fontSize: '0.75rem' }}>W</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>WaitLess</span>
        <span style={{
          fontSize: '0.65rem', color: 'var(--text-muted)',
          borderLeft: '1px solid var(--border)', paddingLeft: '0.5rem', marginLeft: '0.25rem',
        }}>
          BHC Queue System
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn-secondary" style={{ padding: '0.375rem', border: 'none', position: 'relative' }}>
          <IconBell size={17} />
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 7, height: 7, borderRadius: '50%',
            background: '#FF5F5F', border: '1.5px solid var(--surface)',
          }} />
        </button>

        <button className="btn-secondary" style={{ padding: '0.375rem', border: 'none' }} onClick={toggle}>
          {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'color-mix(in srgb, #00C9A7 20%, var(--surface-2))',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#00C9A7',
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user.email.split('@')[0]}</div>
              <div style={{ fontSize: '0.65rem', color: '#00C9A7', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <button className="btn-secondary" style={{ padding: '0.375rem', border: 'none', color: '#FF5F5F' }} onClick={handleLogout}>
              <IconLogout size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
