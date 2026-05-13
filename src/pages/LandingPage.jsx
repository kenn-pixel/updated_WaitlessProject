import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import {
  IconSun, IconMoon, IconClock, IconUsers, IconArrowRight, IconCalendarPlus,
  IconDeviceDesktop, IconDeviceMobile, IconShield, IconChevronRight,
} from '@tabler/icons-react'

export default function LandingPage() {
  const { theme, toggle } = useTheme()

  const features = [
    {
      icon: IconClock,
      title: 'Real-time Queue',
      description: 'Live queue tracking and status updates for patients and staff',
      color: '#00C9A7',
    },
    {
      icon: IconUsers,
      title: 'Priority Management',
      description: 'Intelligent prioritization for urgent, senior, and PWD patients',
      color: '#F5A623',
    },
    {
      icon: IconCalendarPlus,
      title: 'Appointment Booking',
      description: 'Easy online appointment scheduling with daily token generation',
      color: '#00C9A7',
    },
    {
      icon: IconDeviceDesktop,
      title: 'Staff Dashboard',
      description: 'Comprehensive queue management and analytics for healthcare staff',
      color: '#3DD68C',
    },
    {
      icon: IconDeviceMobile,
      title: 'Mobile Optimized',
      description: 'Fully responsive design works on phones, tablets, and desktops',
      color: '#F5A623',
    },
    {
      icon: IconShield,
      title: 'Secure & Reliable',
      description: 'Built with enterprise-grade security and real-time synchronization',
      color: '#FF5F5F',
    },
  ]

  const steps = [
    {
      number: '1',
      title: 'Patient Arrives',
      description: 'Patient registers via portal or walks in to the health center',
    },
    {
      number: '2',
      title: 'Gets Token',
      description: 'System assigns unique token with priority level',
    },
    {
      number: '3',
      title: 'Wait Notification',
      description: 'Real-time updates show estimated wait time and position in queue',
    },
    {
      number: '4',
      title: 'Called to Service',
      description: 'Staff calls patient via display screen and mobile notification',
    },
  ]

  const stats = [
    { value: '50%', label: 'Less Wait Time' },
    { value: '98%', label: 'Patient Satisfaction' },
    { value: '24/7', label: 'Available Access' },
    { value: '100+', label: 'Health Centers' },
  ]

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">W</div>
          <span>WaitLess</span>
        </div>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <Link to="/portal">Patient Portal</Link>
          <Link to="/login">Staff Login</Link>
        </div>

        <button className="landing-theme-toggle" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">Smart Queue Management for Healthcare</h1>
          <p className="landing-hero-copy">
            Reduce wait times, improve patient experience, and empower your healthcare staff with WaitLess—the modern queue management solution designed for barangay health centers.
          </p>

          <div className="landing-buttons">
            <Link to="/portal" className="landing-button-primary">
              Book Appointment <IconArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing-button-secondary">
              Staff Login <IconChevronRight size={18} />
            </Link>
          </div>

          <div className="landing-stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="landing-stat">
                <div className="landing-stat-value">{stat.value}</div>
                <div className="landing-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Powerful Features</h2>
          <p className="landing-section-copy">
            Everything you need to manage healthcare queues efficiently.
          </p>

          <div className="landing-features-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="landing-feature-card">
                  <div className="landing-feature-icon" style={{ background: `color-mix(in srgb, ${feature.color} 15%, transparent)` }}>
                    <Icon size={32} color={feature.color} />
                  </div>
                  <h3 className="landing-feature-title">{feature.title}</h3>
                  <p className="landing-feature-description">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-section--surface">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">How It Works</h2>
          <p className="landing-section-copy">
            Simple process, exceptional results.
          </p>

          <div className="landing-steps-grid">
            {steps.map((step) => (
              <div key={step.number} className="landing-step-card">
                <div className="landing-step-number">{step.number}</div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-copy">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-section-inner">
          <h2 className="landing-section-title landing-cta-title">Ready to Improve Your Queue Management?</h2>
          <p className="landing-section-copy landing-cta-copy">
            Start managing your healthcare queue more efficiently today.
          </p>

          <div className="landing-buttons">
            <Link to="/portal" className="landing-button-primary landing-cta-button">
              Book Now <IconArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing-button-secondary landing-cta-button">
              Staff Access <IconChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div>
            <h4>WaitLess</h4>
            <p>Smart queue management system for healthcare centers.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="landing-footer-links">
              <li><Link to="/portal">Patient Portal</Link></li>
              <li><Link to="/login">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <p>info@waitless.io</p>
            <p>+63 (2) 8000-0000</p>
          </div>
        </div>
        <div className="landing-footer-copy">&copy; 2026 WaitLess. All rights reserved.</div>
      </footer>
    </div>
  )
}
