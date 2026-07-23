import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  BellRing,
  History,
  User,
  Settings,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/endpoints', label: 'API Endpoints', icon: Radio },
  { to: '/dashboard/alerts', label: 'Alerts', icon: BellRing },
  { to: '/dashboard/history', label: 'Monitoring History', icon: History },
];

const FOOTER_ITEMS = [
  { to: '/dashboard/settings', label: 'Profile', icon: User },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function navLinkClasses({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-primary/15 text-primary'
      : 'text-text-secondary hover:bg-surface-container-high hover:text-text-primary'
  }`;
}

export default function Sidebar({ isOpen = true, onNavigate }) {
  const { user } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface-container-low p-4 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-5 w-5 text-on-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary">API Health</h1>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Infrastructure</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClasses} onClick={onNavigate}>
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border pt-4">
        {FOOTER_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={label} to={to} className={navLinkClasses} onClick={onNavigate}>
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-surface-container-highest p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {initials || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
            <p className="truncate text-[11px] text-text-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
