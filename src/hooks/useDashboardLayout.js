/**
 * useDashboardLayout Hook
 * Manages dashboard widget layout and drag-and-drop
 */

import { useState, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';
import { userPreferencesService } from '../services/userPreferencesService';

export default function useDashboardLayout(userId, defaultWidgets = []) {
  const [widgets, setWidgets] = useState(defaultWidgets);
  const [draggedWidget, setDraggedWidget] = useState(null);

  // Load widget layout from preferences
  useEffect(() => {
    if (userId) {
      loadWidgetLayout(userId);
    }
  }, [userId]);

  const loadWidgetLayout = async (uid) => {
    try {
      const preferences = await userPreferencesService.loadPreferences(uid);
      if (preferences.dashboardWidgets) {
        // Convert preferences to widgets array and sort by order
        const widgetArray = Object.entries(preferences.dashboardWidgets)
          .filter(([_, config]) => config.visible)
          .map(([id, config]) => ({
            id,
            ...config,
          }))
          .sort((a, b) => a.order - b.order);

        if (widgetArray.length > 0) {
          setWidgets(widgetArray);
        }
      }
    } catch (error) {
      logger.error('Error loading widget layout:', error);
    }
  };

  const saveWidgetLayout = async () => {
    if (!userId) return;

    try {
      const dashboardWidgets = widgets.reduce((acc, widget, index) => {
        acc[widget.id] = {
          visible: true,
          order: index,
        };
        return acc;
      }, {});

      await userPreferencesService.updatePreference(
        userId,
        'dashboardWidgets',
        dashboardWidgets
      );

      logger.info('Widget layout saved successfully');
    } catch (error) {
      logger.error('Error saving widget layout:', error);
    }
  };

  const handleDragStart = useCallback((widgetId) => {
    setDraggedWidget(widgetId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e, targetWidgetId) => {
      e.preventDefault();

      if (!draggedWidget || draggedWidget === targetWidgetId) {
        return;
      }

      setWidgets((prevWidgets) => {
        const newWidgets = [...prevWidgets];
        const draggedIndex = newWidgets.findIndex((w) => w.id === draggedWidget);
        const targetIndex = newWidgets.findIndex((w) => w.id === targetWidgetId);

        if (draggedIndex === -1 || targetIndex === -1) {
          return prevWidgets;
        }

        // Swap widgets
        const [removed] = newWidgets.splice(draggedIndex, 1);
        newWidgets.splice(targetIndex, 0, removed);

        // Save layout after reorder
        setTimeout(() => saveWidgetLayout(), 100);

        return newWidgets;
      });
    },
    [draggedWidget, userId]
  );

  const toggleWidgetVisibility = useCallback(
    (widgetId) => {
      setWidgets((prevWidgets) => {
        const widget = prevWidgets.find((w) => w.id === widgetId);
        if (!widget) return prevWidgets;

        const newWidgets = prevWidgets.map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        );

        // Save layout after toggle
        setTimeout(() => saveWidgetLayout(), 100);

        return newWidgets;
      });
    },
    [userId]
  );

  const removeWidget = useCallback(
    (widgetId) => {
      setWidgets((prevWidgets) => {
        const newWidgets = prevWidgets.filter((w) => w.id !== widgetId);

        // Save layout after removal
        setTimeout(() => saveWidgetLayout(), 100);

        return newWidgets;
      });
    },
    [userId]
  );

  const addWidget = useCallback(
    (widget) => {
      setWidgets((prevWidgets) => {
        const newWidgets = [...prevWidgets, { ...widget, order: prevWidgets.length }];

        // Save layout after addition
        setTimeout(() => saveWidgetLayout(), 100);

        return newWidgets;
      });
    },
    [userId]
  );

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    saveWidgetLayout();
  }, [defaultWidgets, userId]);

  return {
    widgets,
    draggedWidget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    toggleWidgetVisibility,
    removeWidget,
    addWidget,
    resetLayout,
    saveLayout: saveWidgetLayout,
  };
}
