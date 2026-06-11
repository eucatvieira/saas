import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, Bot, CreditCard, MessageSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agendamentos', icon: CalendarDays,     label: 'Agendamentos' },
  { to: '/conversas',    icon: MessageSquare,    label: 'Conversas' },
  { to: '/clientes',     icon: Users,            label: 'Clientes' },
  { to: '/configuracoes',icon: Settings,         label: 'Configurações' },
  { to: '/planos',       icon: CreditCard,       label: 'Planos' },
]

export function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(83,0,183,0.06)] flex flex-col">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/40">
        <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div>
          <span className="font-semibold text-on-surface text-base leading-tight block">SecretárIA</span>
          <span className="text-[10px] text-outline leading-none">powered by Avora</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-100 text-primary-700 shadow-sm'
                  : 'text-on-surface-variant hover:bg-primary-50 hover:text-on-surface',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-700' : 'text-outline')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/40">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 text-outline" />
          Sair
        </button>
      </div>
    </aside>
  )
}
