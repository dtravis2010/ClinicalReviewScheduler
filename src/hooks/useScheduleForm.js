import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logger } from '../utils/logger';

/**
 * Hook to manage schedule form state
 * Handles schedule metadata: name, dates, DAR configuration
 * Tracks dirty state for unsaved changes
 * 
 * @param {Object} schedule - The schedule object from props
 * @param {Function} resetAssignments - Function to reset assignments state
 * @returns {Object} Form state, setters, and metadata
 */
export function useScheduleForm(schedule, resetAssignments) {
  const [scheduleName, setScheduleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [darEntities, setDarEntities] = useState({});
  const [darCount, setDarCount] = useState(5);
  const [incomingEntities, setIncomingEntities] = useState({});
  const [incomingCount, setIncomingCount] = useState(1);
  const [headerTexts, setHeaderTexts] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form from schedule or load defaults
  useEffect(() => {
    if (schedule) {
      resetAssignments?.(schedule.assignments || {});
      setScheduleName(schedule.name || '');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
      setDarEntities(schedule.darEntities || {});
      setDarCount(schedule.darCount || 5);
      setIncomingEntities(schedule.incomingEntities || {});
      setIncomingCount(schedule.incomingCount || 1);
      setHeaderTexts(schedule.headerTexts || {});
      setHasChanges(false);
    } else {
      loadDefaultConfigs();
    }
  }, [schedule, resetAssignments]);

  async function loadDefaultConfigs() {
    try {
      const [darDoc, incDoc] = await Promise.all([
        getDoc(doc(db, 'settings', 'darConfig')),
        getDoc(doc(db, 'settings', 'incomingConfig'))
      ]);

      if (darDoc.exists()) {
        const data = darDoc.data();
        setDarEntities(data.config || {});
        setDarCount(data.darCount || 5);
      }

      if (incDoc.exists()) {
        const data = incDoc.data();
        setIncomingEntities(data.config || {});
        setIncomingCount(data.incomingCount || 1);
      }
    } catch (error) {
      logger.error('Error loading configs:', error);
    }
  }

  // Tracked setters that mark form as dirty
  const updateScheduleName = useCallback((value) => {
    setScheduleName(value);
    setHasChanges(true);
  }, []);

  const updateStartDate = useCallback((value) => {
    setStartDate(value);
    setHasChanges(true);
  }, []);

  const updateEndDate = useCallback((value) => {
    setEndDate(value);
    setHasChanges(true);
  }, []);

  const updateDarEntities = useCallback((updater) => {
    setDarEntities(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setHasChanges(true);
  }, []);

  const updateDarCount = useCallback((newCount) => {
    // Limit between 3 and 8 DARs
    const count = Math.max(3, Math.min(8, newCount));
    setDarCount(count);
    setHasChanges(true);
  }, []);

  const updateIncomingCount = useCallback((newCount) => {
    // Limit between 1 and 5 Incoming
    const count = Math.max(1, Math.min(5, newCount));
    setIncomingCount(count);
    setHasChanges(true);
  }, []);

  const setHeaderText = useCallback((key, text) => {
    setHeaderTexts(prev => ({ ...prev, [key]: text }));
    setHasChanges(true);
  }, []);

  const handleDarEntityToggle = useCallback((darIndex, entityName) => {
    setDarEntities(prev => {
      const current = prev[darIndex] || [];
      const currentArray = Array.isArray(current) ? current : (current ? [current] : []);
      const newArray = currentArray.includes(entityName)
        ? currentArray.filter(e => e !== entityName)
        : [...currentArray, entityName];

      return {
        ...prev,
        [darIndex]: newArray
      };
    });
    setHasChanges(true);
  }, []);

  const handleIncomingEntityToggle = useCallback((index, entityName) => {
    setIncomingEntities(prev => {
      const current = prev[index] || [];
      const currentArray = Array.isArray(current) ? current : (current ? [current] : []);
      const newArray = currentArray.includes(entityName)
        ? currentArray.filter(e => e !== entityName)
        : [...currentArray, entityName];

      return {
        ...prev,
        [index]: newArray
      };
    });
    setHasChanges(true);
  }, []);

  const markClean = useCallback(() => {
    setHasChanges(false);
  }, []);

  const markDirty = useCallback(() => {
    setHasChanges(true);
  }, []);

  // Generate DAR columns dynamically based on count
  const darColumns = useMemo(() => 
    Array.from({ length: darCount }, (_, i) => `DAR ${i + 1}`), 
    [darCount]
  );

  // Generate Incoming columns dynamically based on count
  const incomingColumns = useMemo(() =>
    Array.from({ length: incomingCount }, (_, i) => `Incoming ${i + 1}`),
    [incomingCount]
  );

  // Aggregated schedule data for saving
  const scheduleData = useMemo(() => ({
    name: scheduleName,
    startDate,
    endDate,
    darEntities,
    darCount,
    incomingEntities,
    incomingCount,
    headerTexts
  }), [scheduleName, startDate, endDate, darEntities, darCount, incomingEntities, incomingCount, headerTexts]);

  return {
    // State values
    scheduleName,
    startDate,
    endDate,
    darEntities,
    darCount,
    darColumns,
    incomingEntities,
    incomingCount,
    incomingColumns,
    headerTexts,
    hasChanges,
    scheduleData,
    
    // Direct setters (for controlled inputs)
    setScheduleName: updateScheduleName,
    setStartDate: updateStartDate,
    setEndDate: updateEndDate,
    setDarEntities: updateDarEntities,
    setDarCount: updateDarCount,
    setIncomingCount: updateIncomingCount,
    setHeaderText,
    
    // Handlers
    handleDarEntityToggle,
    handleIncomingEntityToggle,
    markClean,
    markDirty,
  };
}

export default useScheduleForm;
