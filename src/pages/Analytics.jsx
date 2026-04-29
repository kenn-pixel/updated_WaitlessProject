import {
  IconUsers, IconClock, IconCircleCheck, IconTrendingUp,
  IconCalendarEvent, IconChartBar, IconArrowUpRight, IconArrowDownRight,
} from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const METRICS = [
  { icon: IconUsers,        label: 'Total Served Today', value: '47',    sub: '+12% vs yesterday', up: true,  color: '#00C9A7' },
  { icon: IconClock,        label: 'Avg Wait Time',      value: '18 min', sub: '-3 min vs yesterday', up: true, color: '#3DD68C' },
  { icon: IconChartBar,     label: 'Queue Volume',       value: '63',    sub: 'Total tokens issued', up: null, color: '#F5A623' },
  { icon: IconCircleCheck,  label: 'Completion Rate',    value: '87%',   sub: '+2% vs last week',  up: true,  color: '#3DD68C' },
  { icon: IconCalendarEvent,label: 'Appointments Today', value: '24',    sub: '18 confirmed',       up: null, color: '#00C9A7' },
  { icon: IconTrendingUp,   label: 'No-Show Rate',       value: '8%',    sub: '-1% vs last week',  up: true,  color: '#FF5F5F' },
]

const HOURLY = [
  { hour: '8AM', count: 12 }, { hour: '9AM', count: 18 }, { hour: '10AM', count: 15 },
  { hour: '11AM', count: 9  }, { hour: '12PM', count: 4  }, { hour: '1PM',  count: 11 },
  { hour: '2PM',  count: 14 }, { hour: '3PM',  count: 10 }, { hour: '4PM',  count: 6  },
]
const MAX_COUNT = Math.max(...HOURLY.map(h => h.count))

const SERVICE_DIST = [
  { service: 'Consultation', count: 22, color: '#00C9A7' },
  { service: 'Vaccination',  count: 14, color: '#3DD68C' },
  { service: 'Prenatal',     count: 10, color: '#F5A623' },
  { service: 'Lab Request',  count: 9,  color: '#FF5F5F' },
  { service: 'Dental',       count: 8,  color: '#8B949E' },
]
const TOTAL_DIST = SERVICE_DIST.reduce((s, d) => s + d.count, 0)

export default function Analytics() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Today's performance overview — {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {METRICS.map(({ icon: Icon, label, value, sub, up, color }) => (
          <div key={label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              {up !== null && (
                up
                  ? <IconArrowUpRight size={16} style={{ color: '#3DD68C' }} />
                  : <IconArrowDownRight size={16} style={{ color: '#FF5F5F' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.125rem' }}>{label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Hourly bar chart */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>Hourly Queue Volume</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px' }}>
            {HOURLY.map(({ hour, count }) => (
              <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${(count / MAX_COUNT) * 100}%`,
                  background: 'linear-gradient(to top, #00C9A7, color-mix(in srgb, #00C9A7 60%, transparent))',
                  minHeight: '4px', transition: 'height 0.3s ease',
                }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service distribution */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>Service Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {SERVICE_DIST.map(({ service, count, color }) => (
              <div key={service}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{service}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${(count / TOTAL_DIST) * 100}%`,
                    background: color, transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
