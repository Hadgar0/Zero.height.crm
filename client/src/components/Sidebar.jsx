import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, CheckSquare } from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/clients', label: 'Клиенты', icon: Users },
  { to: '/deals', label: 'Сделки', icon: Briefcase },
  { to: '/tasks', label: 'Задачи', icon: CheckSquare },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-tight">CRM система</h1>
        <p className="text-xs text-slate-400 mt-0.5">Управление клиентами</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-500">
        v1.0.0
      </div>
    </aside>
  )
}
