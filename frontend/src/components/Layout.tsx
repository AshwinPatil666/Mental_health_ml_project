import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Activity } from 'lucide-react'
import { useApiStatus } from '../hooks/useApiStatus'
import { API_BASE_URL } from '../services/api'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/assessment', label: 'Assessment' },
  { to: '/about', label: 'About' },
]

function StatusPill() {
  const { status, refresh } = useApiStatus()
  const dot = status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-red-500' : 'bg-amber-400'
  const text = status === 'online' ? 'Backend online' : status === 'offline' ? 'Backend offline' : 'Checking backend'
  return (
    <button
      type="button"
      onClick={() => void refresh()}
      title={`${API_BASE_URL} (click to re-check)`}
      className="flex min-h-[36px] items-center gap-2 rounded-full border border-line bg-white px-3 text-xs font-medium text-muted hover:border-lav-300"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      <span role="status">{text}</span>
    </button>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-lav-300/30 blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-[420px] w-[420px] animate-drift-slow rounded-full bg-sky-100/80 blur-3xl" />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Mindmetrics home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lav-500 to-sky-500 text-white shadow-card">
              <Activity size={18} aria-hidden />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Mindmetrics</span>
          </NavLink>

          <nav aria-label="Main" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex min-h-[40px] flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium transition sm:flex-none ${
                    isActive ? 'bg-lav-50 text-lav-700' : 'text-muted hover:bg-mist hover:text-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <StatusPill />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white/70">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          Educational machine learning project. Not a clinical tool.
        </p>
      </footer>
    </div>
  )
}
