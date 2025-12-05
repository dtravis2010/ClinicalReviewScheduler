import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  History,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/**
 * App Shell Layout with THR-blue gradient header and side navigation
 * Following Phase 1 design principles:
 * - THR-blue gradient bar with drop shadow
 * - Vertical navigation with icons + text
 * - Light THR green highlight for selected item
 * - Smooth slides and transitions
 */
export default function Layout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/supervisor', group: 'main' },
    { id: 'employees', label: 'Employees', icon: Users, path: '/supervisor?tab=employees', group: 'main' },
    { id: 'entities', label: 'Entities', icon: Building2, path: '/supervisor?tab=entities', group: 'main' },
    { id: 'history', label: 'History', icon: History, path: '/supervisor?tab=history', group: 'secondary' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/supervisor?tab=settings', group: 'secondary' },
  ];

  const isActive = (item) => {
    if (item.path.includes('?tab=')) {
      const tab = item.path.split('?tab=')[1];
      return location.search.includes(`tab=${tab}`);
    }
    return location.pathname === item.path && !location.search;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">CRS</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter(item => item.group === 'main').map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path.split('?')[0] + (item.path.includes('?') ? `?${item.path.split('?')[1]}` : ''))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-thr-green-50 dark:bg-thr-green-900/20 text-thr-green-600 dark:text-thr-green-400 border-l-4 border-thr-green-500 ml-[-4px] pl-[calc(1rem+4px)]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen ? 'mx-auto' : ''}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}

          {sidebarOpen && (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Other
              </p>
            </div>
          )}

          {navItems.filter(item => item.group === 'secondary').map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path.split('?')[0] + (item.path.includes('?') ? `?${item.path.split('?')[1]}` : ''))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-thr-green-50 dark:bg-thr-green-900/20 text-thr-green-600 dark:text-thr-green-400 border-l-4 border-thr-green-500 ml-[-4px] pl-[calc(1rem+4px)]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen ? 'mx-auto' : ''}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">CRS</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path.split('?')[0] + (item.path.includes('?') ? `?${item.path.split('?')[1]}` : ''));
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-thr-green-50 dark:bg-thr-green-900/20 text-thr-green-600 dark:text-thr-green-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header Bar - THR-blue gradient */}
        <header className="header-gradient sticky top-0 z-20 h-16 flex items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile menu button + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="text-white">
              <h1 className="text-lg font-semibold">{title || 'Clinical Review Scheduler'}</h1>
              {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
            </div>
          </div>

          {/* Center: Month Selector Placeholder */}
          <div className="hidden md:flex items-center gap-2">
            {/* Future: Month selector component */}
          </div>

          {/* Right: Theme toggle + Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
