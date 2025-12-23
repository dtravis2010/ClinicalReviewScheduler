/**
 * Notification Panel Component
 * Displays in-app notifications with actions
 */

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PropTypes from 'prop-types';
import { notificationService } from '../services/notificationService';

const ICON_MAP = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  schedule: Bell,
  assignment: Check,
  conflict: AlertCircle,
};

const COLOR_MAP = {
  success: 'text-thr-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-thr-blue-500',
  schedule: 'text-purple-500',
  assignment: 'text-thr-blue-500',
  conflict: 'text-yellow-500',
};

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClear = (id) => {
    notificationService.clearNotification(id);
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:relative lg:inset-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl lg:absolute lg:top-full lg:right-0 lg:bottom-auto lg:mt-2 lg:rounded-xl overflow-hidden animate-slide-in-right lg:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
              <Bell className="w-4 h-4 text-thr-blue-500" aria-hidden="true" />
            </div>
            <div>
              <h2 id="notifications-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-sm text-thr-blue-600 dark:text-thr-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
            <button
              onClick={handleClearAll}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] lg:max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-center">
                No notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((notification) => {
                const Icon = ICON_MAP[notification.type] || Info;
                const iconColor = COLOR_MAP[notification.type] || 'text-slate-500';

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !notification.read ? 'bg-thr-blue-50/50 dark:bg-thr-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 mt-1 ${iconColor}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                aria-label="Mark as read"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-thr-green-500" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={() => handleClear(notification.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              aria-label="Clear notification"
                              title="Clear notification"
                            >
                              <X className="w-4 h-4 text-slate-400" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

NotificationPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
