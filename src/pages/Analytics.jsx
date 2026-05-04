import { useState, useEffect } from 'react'
import {
  IconUsers, IconClock, IconCircleCheck, IconTrendingUp,
  IconCalendarEvent, IconChartBar, IconArrowUpRight, IconArrowDownRight,
} from '@tabler/icons-react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { QUEUE_TABLE, APPOINTMENTS_TABLE } from '../supabaseTables'

export default function Analytics() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const [metrics, setMetrics] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [serviceData, setServiceData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      // Fetch today's queue data
      const { data: queueData, error: queueError } = await supabase
        .from(QUEUE_TABLE)
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())

      if (queueError) {
        console.error('Error fetching queue data:', queueError)
        throw queueError
      }

      // Fetch today's appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from(APPOINTMENTS_TABLE)
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())

      if (appointmentsError) {
        console.error('Error fetching appointments data:', appointmentsError)
        throw appointmentsError
      }

      // Calculate metrics
      const totalServed = queueData.filter(item => item.status === 'served').length
      const totalQueue = queueData.length
      const avgWaitTime = queueData.length > 0
        ? Math.round(queueData.reduce((sum, item) => sum + (item.wait_min || 0), 0) / queueData.length)
        : 0
      const completionRate = totalQueue > 0 ? Math.round((totalServed / totalQueue) * 100) : 0
      const totalAppointments = appointmentsData.length
      const confirmedAppointments = appointmentsData.filter(app => app.status === 'confirmed').length
      const noShowRate = totalAppointments > 0 ? Math.round(((totalAppointments - confirmedAppointments) / totalAppointments) * 100) : 0

      // Set metrics
      setMetrics([
        { icon: IconUsers, label: 'Total Served Today', value: totalServed.toString(), sub: 'Patients served', up: null, color: '#00C9A7' },
        { icon: IconClock, label: 'Avg Wait Time', value: `${avgWaitTime} min`, sub: 'Average wait time', up: null, color: '#3DD68C' },
        { icon: IconChartBar, label: 'Queue Volume', value: totalQueue.toString(), sub: 'Total tokens issued', up: null, color: '#F5A623' },
        { icon: IconCircleCheck, label: 'Completion Rate', value: `${completionRate}%`, sub: 'Of queue completed', up: null, color: '#3DD68C' },
        { icon: IconCalendarEvent, label: 'Appointments Today', value: totalAppointments.toString(), sub: `${confirmedAppointments} confirmed`, up: null, color: '#00C9A7' },
        { icon: IconTrendingUp, label: 'No-Show Rate', value: `${noShowRate}%`, sub: 'Appointment no-shows', up: null, color: '#FF5F5F' },
      ])

      // Calculate hourly data
      const hourlyCounts = {}
      for (let hour = 8; hour <= 16; hour++) {
        let hourStr = hour <= 12 ? `${hour}AM` : `${hour - 12}PM`
        if (hour === 12) hourStr = '12PM'
        hourlyCounts[hourStr] = 0
      }

      queueData.forEach(item => {
        const createdAt = new Date(item.created_at)
        const hour = createdAt.getHours()
        if (hour >= 8 && hour <= 16) {
          let hourStr = hour <= 12 ? `${hour}AM` : `${hour - 12}PM`
          if (hour === 12) hourStr = '12PM'
          hourlyCounts[hourStr]++
        }
      })

      const hourlyArray = Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count }))
      setHourlyData(hourlyArray)

      // Calculate service distribution
      const serviceCounts = {}
      queueData.forEach(item => {
        serviceCounts[item.service] = (serviceCounts[item.service] || 0) + 1
      })

      const serviceColors = ['#00C9A7', '#3DD68C', '#F5A623', '#FF5F5F', '#8B949E']
      const serviceArray = Object.entries(serviceCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([service, count], index) => ({
          service,
          count,
          color: serviceColors[index % serviceColors.length]
        }))

      setServiceData(serviceArray)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      // Set default empty data on error
      setMetrics([
        { icon: IconUsers, label: 'Total Served Today', value: '0', sub: 'No data available', up: null, color: '#00C9A7' },
        { icon: IconClock, label: 'Avg Wait Time', value: '0 min', sub: 'No data available', up: null, color: '#3DD68C' },
        { icon: IconChartBar, label: 'Queue Volume', value: '0', sub: 'No data available', up: null, color: '#F5A623' },
        { icon: IconCircleCheck, label: 'Completion Rate', value: '0%', sub: 'No data available', up: null, color: '#3DD68C' },
        { icon: IconCalendarEvent, label: 'Appointments Today', value: '0', sub: 'No data available', up: null, color: '#00C9A7' },
        { icon: IconTrendingUp, label: 'No-Show Rate', value: '0%', sub: 'No data available', up: null, color: '#FF5F5F' },
      ])
      setHourlyData([])
      setServiceData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div>Loading analytics...</div>
        </div>
      </DashboardLayout>
    )
  }

  const maxHourlyCount = Math.max(...hourlyData.map(h => h.count), 1)
  const totalServiceCount = serviceData.reduce((sum, item) => sum + item.count, 0)

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Today's performance overview — {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {metrics.map(({ icon: Icon, label, value, sub, up, color }) => (
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
            {hourlyData.map(({ hour, count }) => (
              <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${(count / maxHourlyCount) * 100}%`,
                  background: 'linear-gradient(to top, #00C9A7, color-mix(in srgb, #00C9A7 60%, transparent))',
                  minHeight: count > 0 ? '4px' : '0px', transition: 'height 0.3s ease',
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
            {serviceData.map(({ service, count, color }) => (
              <div key={service}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{service}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${totalServiceCount > 0 ? (count / totalServiceCount) * 100 : 0}%`,
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
