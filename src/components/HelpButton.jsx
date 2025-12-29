import { useState } from 'react';
import { HelpCircle, Keyboard, BookOpen, MessageCircle } from 'lucide-react';
import Tooltip from './Tooltip';
import KeyboardShortcuts from './KeyboardShortcuts';
import OnboardingModal from './OnboardingModal';

/**
 * Help button with dropdown menu for accessing help resources
 * Provides quick access to keyboard shortcuts, tour, and documentation
 */
export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const menuItems = [
    {
      icon: Keyboard,
      label: 'Keyboard Shortcuts',
      shortcut: '?',
      onClick: () => {
        setIsOpen(false);
        setShowShortcuts(true);
      },
    },
    {
      icon: BookOpen,
      label: 'Take a Tour',
      onClick: () => {
        setIsOpen(false);
        setShowTour(true);
      },
    },
  ];

  return (
    <>
      <div className="relative">
        <Tooltip content="Help" shortcut="?" position="bottom">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-thr-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            aria-label="Help menu"
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </Tooltip>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in"
              role="menu"
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}

              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

              <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                Version 1.0.0
              </div>
            </div>
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingModal forceShow={true} />
      )}
    </>
  );
}
