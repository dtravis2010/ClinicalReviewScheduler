/**
 * Global UX Enhancements Component
 * Wraps keyboard shortcuts, notifications, and other global UX features
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import PropTypes from 'prop-types';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import KeyboardShortcuts from './KeyboardShortcuts';
import NotificationPanel from './NotificationPanel';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';

export default function GlobalUXEnhancements({ onSave, onNew, onExport, onUndo, onRedo }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme } = useTheme();

  // Update unread count
  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(notificationService.getUnreadCount());
    };

    updateCount();
    const unsubscribe = notificationService.subscribe(updateCount);
    return unsubscribe;
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true),
    onSave,
    onNew,
    onExport,
    onUndo,
    onRedo,
    onSearch: () => {
      // Could implement search functionality here
      console.log('Search shortcut pressed');
    },
    onToggleTheme: toggleTheme,
    onToggleFilter: () => {
      // Could implement filter toggle here
      console.log('Filter toggle shortcut pressed');
    },
    enabled: !showShortcuts && !showNotifications, // Disable when modals are open
  });

  // Handle Escape key for closing panels
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showNotifications) {
          setShowNotifications(false);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showNotifications, showShortcuts]);

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-14 h-14 rounded-full bg-thr-blue-500 text-white shadow-lg hover:bg-thr-blue-600 transition-all hover:shadow-xl btn-hover-lift focus-ring"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={showNotifications}
        >
          <Bell className="w-6 h-6 mx-auto" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {location.pathname && `Navigated to ${location.pathname}`}
      </div>
    </>
  );
}

GlobalUXEnhancements.propTypes = {
  onSave: PropTypes.func,
  onNew: PropTypes.func,
  onExport: PropTypes.func,
  onUndo: PropTypes.func,
  onRedo: PropTypes.func,
};
