/**
 * Notification Service
 * Handles custom alerts, notifications, and browser notifications
 */

import { logger } from '../utils/logger';

class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.notificationId = 0;
  }

  /**
   * Request browser notification permission
   * @returns {Promise<boolean>} Permission granted
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      logger.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show browser notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   */
  async showBrowserNotification(title, options = {}) {
    try {
      const hasPermission = await this.requestPermission();
      
      if (!hasPermission) {
        logger.warn('Browser notification permission denied');
        return null;
      }

      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (error) {
      logger.error('Error showing browser notification:', error);
      return null;
    }
  }

  /**
   * Add in-app notification
   * @param {Object} notification - Notification object
   */
  addNotification(notification) {
    const id = ++this.notificationId;
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    return id;
  }

  /**
   * Show schedule change notification
   * @param {Object} params - Notification parameters
   */
  notifyScheduleChange({ scheduleName, type, message }) {
    this.addNotification({
      type: 'schedule',
      title: `Schedule ${type}`,
      message: `${scheduleName}: ${message}`,
      priority: 'normal',
    });

    this.showBrowserNotification(`Schedule ${type}`, {
      body: `${scheduleName}: ${message}`,
      tag: 'schedule-change',
    });
  }

  /**
   * Show assignment notification
   * @param {Object} params - Notification parameters
   */
  notifyAssignment({ employeeName, assignment, scheduleName }) {
    this.addNotification({
      type: 'assignment',
      title: 'New Assignment',
      message: `${employeeName} assigned to ${assignment} in ${scheduleName}`,
      priority: 'normal',
    });

    this.showBrowserNotification('New Assignment', {
      body: `${employeeName} assigned to ${assignment}`,
      tag: 'assignment',
    });
  }

  /**
   * Show conflict alert
   * @param {Object} params - Alert parameters
   */
  notifyConflict({ type, message, severity = 'warning' }) {
    this.addNotification({
      type: 'conflict',
      title: 'Conflict Detected',
      message: `${type}: ${message}`,
      priority: severity,
    });

    if (severity === 'high') {
      this.showBrowserNotification('⚠️ Conflict Detected', {
        body: message,
        tag: 'conflict',
        requireInteraction: true,
      });
    }
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  notifySuccess(message) {
    this.addNotification({
      type: 'success',
      title: 'Success',
      message,
      priority: 'low',
    });
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  notifyError(message) {
    this.addNotification({
      type: 'error',
      title: 'Error',
      message,
      priority: 'high',
    });

    this.showBrowserNotification('❌ Error', {
      body: message,
      tag: 'error',
    });
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   */
  notifyInfo(message) {
    this.addNotification({
      type: 'info',
      title: 'Information',
      message,
      priority: 'low',
    });
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  /**
   * Clear notification
   * @param {number} id - Notification ID
   */
  clearNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Get unread count
   * @returns {number} Unread notification count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get all notifications
   * @returns {Array} All notifications
   */
  getNotifications() {
    return this.notifications;
  }

  /**
   * Subscribe to notification changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.notifications);
      } catch (error) {
        logger.error('Error in notification listener:', error);
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
