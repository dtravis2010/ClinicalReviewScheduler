import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Users, Settings2, BarChart3, Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ThemeToggle';

const NAV = [
  { to: '/rotation/overview', label: 'Overview', icon: Sparkles },
  { to: '/rotation/team', label: 'Team', icon: Users },
  { to: '/rotation/rules', label: 'Rules', icon: Settings2 },
  { to: '/rotation/fairness', label: 'Fairness', icon: BarChart3 },
  { to: '/rotation/my-rotation', label: 'My rotation', icon: Eye },
];

export default function RotationShell({ children, title, actions }) {
  const { isSupervisor, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          <Link to="/rotation/overview" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-thr-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Rotation Intelligence
            </span>
          </Link>
          <nav className="flex items-center gap-1 ml-4">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
                    isActive
                      ? 'bg-thr-blue-50 text-thr-blue-700 dark:bg-thr-blue-900 dark:text-thr-blue-100'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            {isSupervisor && (
              <button
                type="button"
                onClick={async () => { await logout(); navigate('/login'); }}
                className="flex items-center gap-1.5 text-body-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
        {(title || actions) && (
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 border-t border-slate-100 dark:border-slate-700/60">
            {title && <h1 className="text-h2 text-slate-800 dark:text-slate-100">{title}</h1>}
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
