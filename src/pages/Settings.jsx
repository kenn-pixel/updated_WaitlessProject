import { useEffect, useState } from 'react'
import {
  IconSettings,
  IconUser,
  IconShieldCheck,
  IconLock,
  IconDownload,
  IconTrash,
  IconMail,
  IconBuildingStore,
  IconClock,
} from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const defaultProfile = {
  displayName: '',
  clinic: '',
  phone: '',
  receiveEmails: true,
}

const defaultSecurity = {
  sessionTimeout: '15',
  autoLock: true,
  hideSensitiveDetails: false,
  saveActivityLog: false,
}

const defaultClinicHours = {
  openTime: '08:00',
  closeTime: '17:00',
  operatingDays: '1,2,3,4,5',
}

export default function Settings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(defaultProfile)
  const [security, setSecurity] = useState(defaultSecurity)
  const [clinicHours, setClinicHours] = useState(defaultClinicHours)
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [status, setStatus] = useState({ profile: '', security: '', clinic: '', password: '' })

  useEffect(() => {
    const saved = window.localStorage.getItem('wl-settings')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.profile) setProfile(prev => ({ ...prev, ...parsed.profile }))
      if (parsed.security) setSecurity(prev => ({ ...prev, ...parsed.security }))
    } catch {
      // ignore invalid saved settings
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('wl-settings', JSON.stringify({ profile, security }))
  }, [profile, security])

  useEffect(() => {
    const loadClinicHours = async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('key', 'operating_hours')
        .single()

      if (error) {
        // no saved clinic hours yet, keep defaults
        return
      }

      setClinicHours(prev => ({
        ...prev,
        openTime: data.open_time || prev.openTime,
        closeTime: data.close_time || prev.closeTime,
        operatingDays: data.operating_days || prev.operatingDays,
      }))
    }

    loadClinicHours()
  }, [])

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setStatus(prev => ({ ...prev, profile: '' }))
  }

  const handleSecurityChange = (field, value) => {
    setSecurity(prev => ({ ...prev, [field]: value }))
    setStatus(prev => ({ ...prev, security: '' }))
  }

  const handleSaveProfile = event => {
    event.preventDefault()
    setStatus(prev => ({ ...prev, profile: 'Profile settings saved.' }))
  }

  const handleSaveSecurity = event => {
    event.preventDefault()
    setStatus(prev => ({ ...prev, security: 'Security settings saved.' }))
  }

  const handleSaveClinicHours = async event => {
    event.preventDefault()
    const { openTime, closeTime, operatingDays } = clinicHours
    const { error } = await supabase
      .from('clinic_settings')
      .upsert({
        key: 'operating_hours',
        open_time: openTime,
        close_time: closeTime,
        operating_days: operatingDays,
      }, { onConflict: 'key' })

    if (error) {
      setStatus(prev => ({ ...prev, clinic: error.message || 'Unable to save clinic hours.' }))
      return
    }

    setStatus(prev => ({ ...prev, clinic: 'Clinic operating hours updated.' }))
  }

  const handleExportSettings = () => {
    const payload = {
      account: {
        email: user?.email,
        role: user?.role,
        ...profile,
      },
      privacy: security,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'waitless-settings.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleResetPreferences = () => {
    setProfile(defaultProfile)
    setSecurity(defaultSecurity)
    window.localStorage.removeItem('wl-settings')
    setStatus({ profile: 'Preferences reset to defaults.', security: 'Preferences reset to defaults.', password: '' })
  }

  const handleUpdatePassword = async event => {
    event.preventDefault()
    setStatus(prev => ({ ...prev, password: '' }))

    if (passwords.newPassword.length < 8) {
      setStatus(prev => ({ ...prev, password: 'Password must be at least 8 characters.' }))
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus(prev => ({ ...prev, password: 'Passwords do not match.' }))
      return
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
    if (error) {
      setStatus(prev => ({ ...prev, password: error.message || 'Unable to update password.' }))
      return
    }

    setPasswords({ newPassword: '', confirmPassword: '' })
    setStatus(prev => ({ ...prev, password: 'Password updated successfully.' }))
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Settings</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Manage account details, privacy controls, and security preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <IconUser size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Account profile</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Update your personal details and clinic settings.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Email address
              </label>
              <input className="input-field" type="email" value={user?.email || ''} disabled />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Display name
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter a display name"
                value={profile.displayName}
                onChange={e => handleProfileChange('displayName', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Clinic / department
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g. Main clinic"
                  value={profile.clinic}
                  onChange={e => handleProfileChange('clinic', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Phone number
                </label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={profile.phone}
                  onChange={e => handleProfileChange('phone', e.target.value)}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profile.receiveEmails}
                onChange={e => handleProfileChange('receiveEmails', e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                Receive account and queue email alerts
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button className="btn-primary" type="submit">Save profile</button>
              <button className="btn-secondary" type="button" onClick={() => setProfile(defaultProfile)}>
                Reset fields
              </button>
            </div>

            {status.profile && (
              <p style={{ margin: 0, color: '#00C9A7', fontSize: '0.9rem' }}>{status.profile}</p>
            )}
          </form>
        </section>

        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <IconClock size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Clinic operating hours</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Update the clinic opening and closing times shown to patients.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveClinicHours} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Open time
                </label>
                <input
                  className="input-field"
                  type="time"
                  value={clinicHours.openTime}
                  onChange={e => setClinicHours(prev => ({ ...prev, openTime: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Close time
                </label>
                <input
                  className="input-field"
                  type="time"
                  value={clinicHours.closeTime}
                  onChange={e => setClinicHours(prev => ({ ...prev, closeTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Operating days
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. 1,2,3,4,5"
                value={clinicHours.operatingDays}
                onChange={e => setClinicHours(prev => ({ ...prev, operatingDays: e.target.value }))}
              />
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Use day numbers 0-6 (Sunday=0). Default is 1,2,3,4,5.
              </p>
            </div>

            <button className="btn-primary" type="submit">Save clinic hours</button>
            {status.clinic && (
              <p style={{ margin: 0, color: '#00C9A7', fontSize: '0.9rem' }}>{status.clinic}</p>
            )}
          </form>
        </section>

        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <IconShieldCheck size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Privacy & security</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Control session behavior, local preferences, and export options.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSecurity} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Session timeout
              </label>
              <select
                className="input-field"
                value={security.sessionTimeout}
                onChange={e => handleSecurityChange('sessionTimeout', e.target.value)}
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={security.autoLock}
                onChange={e => handleSecurityChange('autoLock', e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                Automatically lock after inactivity
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={security.hideSensitiveDetails}
                onChange={e => handleSecurityChange('hideSensitiveDetails', e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                Blur sensitive data on the dashboard
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={security.saveActivityLog}
                onChange={e => handleSecurityChange('saveActivityLog', e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                Save local activity history for audit
              </span>
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button className="btn-primary" type="submit">Save privacy</button>
              <button className="btn-secondary" type="button" onClick={handleExportSettings}>
                <IconDownload size={16} /> Export data
              </button>
              <button className="btn-danger" type="button" onClick={handleResetPreferences}>
                <IconTrash size={16} /> Reset to defaults
              </button>
            </div>

            {status.security && (
              <p style={{ margin: 0, color: '#00C9A7', fontSize: '0.9rem' }}>{status.security}</p>
            )}
          </form>
        </section>
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <IconLock size={24} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Password & security</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Update your password and keep your account secure.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'grid', gap: '1rem', maxWidth: '560px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              New password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Enter new password"
              value={passwords.newPassword}
              onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Confirm password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Re-enter new password"
              value={passwords.confirmPassword}
              onChange={e => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn-primary" type="submit">Update password</button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Passwords must be at least 8 characters.
            </span>
          </div>

          {status.password && (
            <p style={{ margin: 0, color: status.password.includes('success') ? '#00C9A7' : '#FF5F5F', fontSize: '0.9rem' }}>
              {status.password}
            </p>
          )}
        </form>
      </section>
    </DashboardLayout>
  )
}
