import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Tooltip from './Tooltip';

/**
 * Theme Toggle - Enhanced with smooth transition animations
 * THR Dark Theme: Navy blue backgrounds, Emerald accents, slight neon glow on hover
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const tooltipContent = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Tooltip content={tooltipContent} shortcut="Ctrl+T" position="bottom">
      <button
        onClick={toggleTheme}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-250 shadow-soft hover:shadow-soft-md group touch-target focus-visible:ring-2 focus-visible:ring-thr-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
        aria-label={tooltipContent}
      >
        {/* Light mode icon */}
        <Sun
          className={`w-5 h-5 text-yellow-500 transition-all duration-300 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0 absolute'
          }`}
          aria-hidden="true"
        />
        {/* Dark mode icon with neon glow effect */}
        <Moon
          className={`w-5 h-5 text-thr-blue-400 transition-all duration-300 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100 drop-shadow-[0_0_8px_rgba(0,118,189,0.5)]'
              : 'opacity-0 -rotate-90 scale-0 absolute'
          }`}
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
}
