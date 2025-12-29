import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';

/**
 * Notification Badge
 * Simple badge button to trigger notification center with unread count
 *
 * @param {Object} props
 * @param {Function} onClick - Callback when badge is clicked
 */
const NotificationBadge = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Update unread count from localStorage
    const updateCount = () => {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        try {
          const notifications = JSON.parse(stored);
          const unread = notifications.filter(n => !n.read).length;
          setUnreadCount(unread);
        } catch (e) {
          console.error('Failed to parse stored notifications:', e);
        }
      }
    };

    // Initial count
    updateCount();

    // Listen for new notifications
    const handleNewNotification = () => {
      updateCount();
    };

    window.addEventListener('notification', handleNewNotification);
    window.addEventListener('storage', updateCount);

    // Poll for updates every 10 seconds (in case of manual storage changes)
    const interval = setInterval(updateCount, 10000);

    return () => {
      window.removeEventListener('notification', handleNewNotification);
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

NotificationBadge.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default NotificationBadge;
