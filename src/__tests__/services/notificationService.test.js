/**
 * Tests for NotificationService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../../services/notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear notifications before each test
    notificationService.clearAll();
    notificationService.listeners.clear();
  });

  describe('addNotification', () => {
    it('should add notification and return id', () => {
      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(id).toBeGreaterThan(0);
      expect(notificationService.getNotifications().length).toBe(1);
    });

    it('should add notification with default read state as false', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      const notifications = notificationService.getNotifications();
      expect(notifications[0].read).toBe(false);
    });

    it('should add notification with timestamp', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      const notifications = notificationService.getNotifications();
      expect(notifications[0].timestamp).toBeInstanceOf(Date);
    });

    it('should prepend new notifications (newest first)', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'First',
        message: 'First message',
      });

      notificationService.addNotification({
        type: 'info',
        title: 'Second',
        message: 'Second message',
      });

      const notifications = notificationService.getNotifications();
      expect(notifications[0].title).toBe('Second');
      expect(notifications[1].title).toBe('First');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      notificationService.markAsRead(id);

      const notifications = notificationService.getNotifications();
      expect(notifications[0].read).toBe(true);
    });

    it('should not throw error for non-existent id', () => {
      expect(() => {
        notificationService.markAsRead(999);
      }).not.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationService.addNotification({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
      });

      notificationService.markAllAsRead();

      const notifications = notificationService.getNotifications();
      expect(notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('clearNotification', () => {
    it('should remove specific notification', () => {
      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      notificationService.clearNotification(id);

      expect(notificationService.getNotifications().length).toBe(0);
    });

    it('should not affect other notifications', () => {
      const id1 = notificationService.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
      });

      const id2 = notificationService.addNotification({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
      });

      notificationService.clearNotification(id1);

      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].id).toBe(id2);
    });
  });

  describe('clearAll', () => {
    it('should remove all notifications', () => {
      notificationService.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationService.addNotification({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
      });

      notificationService.clearAll();

      expect(notificationService.getNotifications().length).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 when no notifications', () => {
      expect(notificationService.getUnreadCount()).toBe(0);
    });

    it('should return correct unread count', () => {
      const id1 = notificationService.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationService.addNotification({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
      });

      notificationService.markAsRead(id1);

      expect(notificationService.getUnreadCount()).toBe(1);
    });
  });

  describe('subscribe/notify', () => {
    it('should notify listeners when notification added', () => {
      const listener = vi.fn();
      notificationService.subscribe(listener);

      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners when notification marked as read', () => {
      const listener = vi.fn();
      
      const id = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      listener.mockClear();
      notificationService.subscribe(listener);

      notificationService.markAsRead(id);

      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = notificationService.subscribe(listener);

      unsubscribe();

      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      // Should have been called once during subscription (initial state)
      // but not again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('notification helper methods', () => {
    it('notifySuccess should add success notification', () => {
      notificationService.notifySuccess('Success message');

      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Success message');
    });

    it('notifyError should add error notification', () => {
      notificationService.notifyError('Error message');

      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toBe('Error message');
    });

    it('notifyInfo should add info notification', () => {
      notificationService.notifyInfo('Info message');

      const notifications = notificationService.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Info message');
    });
  });
});
