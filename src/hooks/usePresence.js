import { useState, useEffect, useRef } from 'react';
import { ref, onDisconnect, set, onValue, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase';

/**
 * usePresence Hook
 * Tracks user presence in real-time using Firebase Realtime Database
 *
 * Features:
 * - Automatic presence tracking (online/offline)
 * - Context tracking (current page, schedule, cell being edited)
 * - Automatic cleanup on disconnect
 * - Returns list of active users in current context
 *
 * @param {Object} user - Current user object { id, name, email }
 * @param {Object} context - Current context { page, scheduleId, cellId }
 * @returns {Object} { activeUsers, updateContext }
 */
export const usePresence = (user, context = {}) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const presenceRef = useRef(null);
  const contextRef = useRef(context);

  useEffect(() => {
    if (!user?.id || !rtdb) return;

    // Create presence reference
    const userPresenceRef = ref(rtdb, `presence/${user.id}`);
    presenceRef.current = userPresenceRef;

    // Set user as online with context
    const presenceData = {
      userId: user.id,
      userName: user.name || 'Unknown User',
      userEmail: user.email || '',
      status: 'online',
      lastSeen: serverTimestamp(),
      context: {
        page: context.page || 'unknown',
        scheduleId: context.scheduleId || null,
        cellId: context.cellId || null,
        editingCell: context.editingCell || false,
      },
    };

    set(userPresenceRef, presenceData);

    // Set up disconnect handler
    const disconnectRef = onDisconnect(userPresenceRef);
    disconnectRef.set({
      ...presenceData,
      status: 'offline',
      lastSeen: serverTimestamp(),
    });

    // Listen to all presence updates
    const allPresenceRef = ref(rtdb, 'presence');
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};

      const users = Object.values(presenceData)
        .filter(p => {
          // Filter out current user and offline users
          if (p.userId === user.id) return false;
          if (p.status !== 'online') return false;

          // If we're on a specific schedule, only show users on same schedule
          if (contextRef.current.scheduleId) {
            return p.context?.scheduleId === contextRef.current.scheduleId;
          }

          // Otherwise show all online users on the same page
          return p.context?.page === contextRef.current.page;
        })
        .sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));

      setActiveUsers(users);
    });

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(() => {
      set(userPresenceRef, {
        ...presenceData,
        context: contextRef.current,
        lastSeen: serverTimestamp(),
      });
    }, 30000); // Every 30 seconds

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
      set(userPresenceRef, {
        ...presenceData,
        status: 'offline',
        lastSeen: serverTimestamp(),
      });
    };
  }, [user?.id, user?.name, user?.email]);

  // Update context without recreating the effect
  const updateContext = (newContext) => {
    contextRef.current = { ...contextRef.current, ...newContext };

    if (presenceRef.current && user?.id) {
      set(presenceRef.current, {
        userId: user.id,
        userName: user.name || 'Unknown User',
        userEmail: user.email || '',
        status: 'online',
        lastSeen: serverTimestamp(),
        context: {
          page: contextRef.current.page || 'unknown',
          scheduleId: contextRef.current.scheduleId || null,
          cellId: contextRef.current.cellId || null,
          editingCell: contextRef.current.editingCell || false,
        },
      });
    }
  };

  return {
    activeUsers,
    updateContext,
  };
};

export default usePresence;
