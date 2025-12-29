import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Bell, X, CheckCircle, AlertCircle, Info, Calendar, Users, Trash2, Check } from 'lucide-react';
import Button from './atoms/Button';

/**
 * Enhanced Notification Center
 * Actionable, persistent notifications with priority levels and categories
 *
 * Features:
 * - Multiple notification types (success, warning, error, info)
 * - Priority levels (high, medium, low)
 * - Categories (conflicts, assignments, schedules, system)
 * - Inline actions (approve, dismiss, view details)
 * - Filtering by type, priority, read/unread
 * - Persistence to localStorage
 * - Badge count for unread notifications
 */

const NotificationCenter = ({
  isOpen,
  onClose,
  onAction,
  maxNotifications = 50,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, conflicts, assignments
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (e) {
        console.error('Failed to parse stored notifications:', e);
      }
    }

    // Subscribe to notification events
    const handleNewNotification = (event) => {
      addNotification(event.detail);
    };

    window.addEventListener('notification', handleNewNotification);
    return () => window.removeEventListener('notification', handleNewNotification);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, maxNotifications)));
    }
  }, [notifications, maxNotifications]);

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: Date.now(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, maxNotifications));
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  // Handle notification action
  const handleAction = (notification, actionId) => {
    const action = notification.actions?.find(a => a.id === actionId);
    if (action?.callback) {
      action.callback(notification);
    }

    if (onAction) {
      onAction(notification, actionId);
    }

    // Mark as read after action
    markAsRead(notification.id);
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.category === filter);
    }

    // Apply sort
    if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => {
        const aPriority = priorityOrder[a.priority || 'low'];
        const bPriority = priorityOrder[b.priority || 'low'];
        return aPriority - bPriority;
      });
    } else {
      // newest (default)
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    return filtered;
  }, [notifications, filter, sortBy]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Get icon for notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'users':
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  // Get background color for notification type
  const getTypeBgColor = (type, read) => {
    const opacity = read ? '20' : '50';
    switch (type) {
      case 'success':
        return `bg-green-${opacity} dark:bg-green-900/${opacity}`;
      case 'warning':
        return `bg-yellow-${opacity} dark:bg-yellow-900/${opacity}`;
      case 'error':
        return `bg-red-${opacity} dark:bg-red-900/${opacity}`;
      default:
        return `bg-slate-${opacity} dark:bg-slate-900/${opacity}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 w-96 max-h-[80vh] bg-white dark:bg-slate-800 rounded-xl shadow-soft-xl border border-slate-200 dark:border-slate-700 flex flex-col animate-slideInRight z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-thr-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-thr-blue-600 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="text-xs text-thr-blue-600 hover:text-thr-blue-700 font-medium"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-slate-500 hover:text-red-600 font-medium"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-thr-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-thr-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('conflicts')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'conflicts'
                ? 'bg-thr-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Conflicts
          </button>
          <button
            onClick={() => setFilter('assignments')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'assignments'
                ? 'bg-thr-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Assignments
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-thr-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 transition-colors ${
                  notification.read ? '' : 'bg-thr-blue-50/30 dark:bg-thr-blue-900/10'
                } hover:bg-slate-50 dark:hover:bg-slate-700/50`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getTypeBgColor(notification.type, notification.read)}`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {notification.title}
                      </h4>
                      {notification.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                          High
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Actions */}
                        {notification.actions?.map((action) => (
                          <button
                            key={action.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(notification, action.id);
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                              action.primary
                                ? 'bg-thr-blue-600 text-white hover:bg-thr-blue-700'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

NotificationCenter.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAction: PropTypes.func,
  maxNotifications: PropTypes.number,
};

export default NotificationCenter;

/**
 * Utility function to dispatch notification events
 * Usage: dispatchNotification({ type, title, message, category, priority, actions })
 */
export const dispatchNotification = (notification) => {
  window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
};
