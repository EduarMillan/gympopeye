import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Banknote,
  LogIn,
  Dumbbell,
  Receipt,
  Settings,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { to: string; label: string; Icon: LucideIcon; end?: boolean }

const nav: NavItem[] = [
  { to: '/', label: 'Inicio', Icon: LayoutDashboard, end: true },
  { to: '/socios', label: 'Socios', Icon: Users },
  { to: '/pagos', label: 'Pagos', Icon: Banknote },
  { to: '/asistencia', label: 'Entradas', Icon: LogIn },
  { to: '/rutinas', label: 'Rutinas', Icon: Dumbbell },
  { to: '/gastos', label: 'Gastos', Icon: Receipt },
]

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b-2 border-surface-variant bg-surface px-page py-3">
        <img
          src="/pwa-192x192.png"
          alt="Popeye's Gym"
          className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15"
        />
        <h1 className="flex-1 font-headline text-2xl uppercase tracking-wide text-primary">
          Popeye&apos;s Gym
        </h1>
        <button
          onClick={() => navigate('/ajustes')}
          aria-label="Ajustes"
          className="text-on-surface-variant transition-transform active:scale-90"
        >
          <Settings size={22} strokeWidth={2} />
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-page pb-28 pt-6">
        <Outlet />
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-1/2 z-50 flex h-20 w-full max-w-2xl -translate-x-1/2 items-stretch justify-around border-t-2 border-surface-variant bg-surface pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-90',
                isActive ? 'text-primary' : 'text-on-surface-variant',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-headline text-[11px] uppercase tracking-wide">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
