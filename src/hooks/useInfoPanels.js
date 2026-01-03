import { useState, useCallback } from 'react';

/**
 * Hook to manage info panel visibility state
 * Consolidates multiple boolean states into a single state object
 * Only one panel can be open at a time
 * 
 * @returns {Object} Panel state and controls
 */
export function useInfoPanels() {
  // Single state for active panel: { type: string, data?: any } | null
  const [activePanel, setActivePanel] = useState(null);

  const openPanel = useCallback((type, data = null) => {
    setActivePanel({ type, data });
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((type, data = null) => {
    setActivePanel(current => {
      if (current?.type === type) {
        return null;
      }
      return { type, data };
    });
  }, []);

  // Derived booleans for component consumption
  const isOpen = useCallback((type) => {
    return activePanel?.type === type;
  }, [activePanel]);

  const getPanelData = useCallback(() => {
    return activePanel?.data ?? null;
  }, [activePanel]);

  return {
    activePanel,
    openPanel,
    closePanel,
    togglePanel,
    isOpen,
    getPanelData,
    // Convenience getters for specific panels
    showDarInfoPanel: activePanel?.type === 'dar',
    showCpoeInfoPanel: activePanel?.type === 'cpoe',
    showNewIncomingInfoPanel: activePanel?.type === 'newIncoming',
    showCrossTrainingInfoPanel: activePanel?.type === 'crossTraining',
    showSpecialProjectsInfoPanel: activePanel?.type === 'specialProjects',
    selectedDarIndex: activePanel?.type === 'dar' ? activePanel.data : null,
  };
}

export default useInfoPanels;
