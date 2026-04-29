import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconMail, IconLock, IconEye, IconEyeOff, IconSun, IconMoon } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200)) // simulate API
    login(form.email, form.email.includes('admin') ? 'admin' : 'staff')
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      {/* Theme toggle */}
      <button className="btn-secondary" onClick={toggle} style={{
        position: 'fixed', top: '1rem', right: '1rem', padding: '0.5rem', border: 'none',
      }}>
        {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '14px',
            background: '#00C9A7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 0.875rem',
          }}>
            <span style={{ color: '#0D1117', fontWeight: 900, fontSize: '1.4rem' }}>W</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>WaitLess</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Barangay Health Center — Staff Portal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <IconMail size={15} style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  style={{ paddingLeft: '2.25rem' }}
                  type="email"
                  placeholder="staff@bhc.gov.ph"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <IconLock size={15} style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  className={`input-field ${errors.password ? 'error' : ''}`}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                }}>
                  {showPw ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#FF5F5F', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.625rem' }}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          For patient queue status,{' '}
          <a href="/" style={{ color: '#00C9A7', textDecoration: 'none' }}>visit the public portal →</a>
        </p>
      </div>
    </div>
  )
}
