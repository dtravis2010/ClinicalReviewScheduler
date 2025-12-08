import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import PropTypes from 'prop-types';
import { Save, Download, History, Edit2, ChevronLeft, ChevronRight, Settings, Eye, Upload, FileDown, Plus, Minus, Calendar, Info, Undo, Redo } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeHistoryModal from './EmployeeHistoryModal';
import DarInfoPanel from './DarInfoPanel';
import AutoSaveIndicator from './AutoSaveIndicator';
import ConflictBanner from './schedule/ConflictBanner';
import WorkloadIndicator from './schedule/WorkloadIndicator';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useConflictDetection } from '../hooks/useConflictDetection';
import { calculateWorkload } from '../utils/conflictDetection';
import { exportToExcel as exportScheduleToExcel } from '../utils/exportUtils';
import { formatEntityList, formatDateRange, getEntityShortCode, getActiveEmployees } from '../utils/scheduleUtils';
import { canAssignDAR, getAvailableEntitiesForDar, getAvailableEntitiesForAssignment } from '../utils/assignmentLogic';

export default function ScheduleGrid({
  schedule,
  employees = [],
  entities = [],
  onSave,
  readOnly = false,
  onCreateNewSchedule,
  schedules = []
}) {
  // Use undo/redo for assignments
  const {
    state: assignments,
    setState: setAssignments,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo({}, { limit: 50 });

  const [scheduleName, setScheduleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [darEntities, setDarEntities] = useState({});
  const [darCount, setDarCount] = useState(5); // Default to 5 DARs
  const [editingDar, setEditingDar] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDarInfoPanel, setShowDarInfoPanel] = useState(false);
  const [selectedDarIndex, setSelectedDarIndex] = useState(null);
  // State for editing assignment cells (New Incoming, Cross-Training)
  const [editingCell, setEditingCell] = useState(null); // { employeeId, field }

  // Auto-save functionality
  const scheduleData = {
    name: scheduleName,
    startDate,
    endDate,
    assignments,
    darEntities,
    darCount
  };

  const { isSaving, lastSaved, error: autoSaveError, hasUnsavedChanges: autoSaveHasChanges } = useAutoSave(
    scheduleData,
    onSave,
    { delay: 2000, enabled: !readOnly && !!schedule }
  );

  // Conflict detection
  const {
    conflicts,
    warnings,
    workloadImbalances,
    hasIssues,
    avgWorkload
  } = useConflictDetection(assignments, employees, darEntities);

  // Generate DAR columns dynamically based on count
  const darColumns = Array.from({ length: darCount }, (_, i) => `DAR ${i + 1}`);

  // Modern THR-inspired color palette for employee names
  const employeeColors = [
    'text-thr-blue-600 dark:text-thr-blue-400', 
    'text-thr-green-600 dark:text-thr-green-400', 
    'text-purple-600 dark:text-purple-400',
    'text-orange-600 dark:text-orange-400', 
    'text-pink-600 dark:text-pink-400', 
    'text-cyan-600 dark:text-cyan-400',
    'text-rose-600 dark:text-rose-400', 
    'text-indigo-600 dark:text-indigo-400',
    'text-teal-600 dark:text-teal-400', 
    'text-fuchsia-600 dark:text-fuchsia-400', 
    'text-lime-600 dark:text-lime-400',
    'text-amber-600 dark:text-amber-400',
  ];

  useEffect(() => {
    if (schedule) {
      // Initialize assignments without adding to undo history
      // We do this by directly setting the state, not through setState
      setAssignments(schedule.assignments || {});
      setScheduleName(schedule.name || '');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
      setDarEntities(schedule.darEntities || {});
      setDarCount(schedule.darCount || 5); // Load darCount from schedule
    } else {
      loadDefaultDarConfig();
    }
  }, [schedule, setAssignments]);

  async function loadDefaultDarConfig() {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setDarEntities(data.config || {});
        setDarCount(data.darCount || 5); // Load darCount from settings
      }
    } catch (error) {
      logger.error('Error loading DAR config:', error);
    }
  }

  function handleAssignmentChange(employeeId, field, value) {
    if (readOnly) return;
    setAssignments(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
    setHasChanges(true);
  }

  function handleDARToggle(employeeId, darIndex) {
    if (readOnly) return;
    if (!Array.isArray(employees)) return;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee?.skills?.includes('DAR') && !employee?.skills?.includes('Float')) {
      return;
    }

    setAssignments(prev => {
      const currentDars = prev[employeeId]?.dars || [];
      const newDars = currentDars.includes(darIndex)
        ? currentDars.filter(d => d !== darIndex)
        : [...currentDars, darIndex];

      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          dars: newDars
        }
      };
    });
    setHasChanges(true);
  }

  function handleDarEntityToggle(darIndex, entityName) {
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
  }

  function handleAssignmentEntityToggle(employeeId, field, entityName) {
    setAssignments(prev => {
      const current = prev[employeeId]?.[field] || [];
      const currentArray = Array.isArray(current) ? current : (current ? [current] : []);
      const newArray = currentArray.includes(entityName)
        ? currentArray.filter(e => e !== entityName)
        : [...currentArray, entityName];

      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: newArray
        }
      };
    });
    setHasChanges(true);
  }

  function handleDarCountChange(newCount) {
    // Limit between 3 and 8 DARs
    const count = Math.max(3, Math.min(8, newCount));
    setDarCount(count);
    setHasChanges(true);
  }

  function handleSave() {
    if (onSave) {
      onSave(scheduleData);
      setHasChanges(false);
    }
  }

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges || autoSaveHasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, autoSaveHasChanges]);

  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && !readOnly) {
          undo();
        }
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo && !readOnly) {
          redo();
        }
      }
    };

    if (!readOnly) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [canUndo, canRedo, undo, redo, readOnly]);

  function exportToExcel() {
    exportScheduleToExcel({
      scheduleName,
      startDate,
      employees,
      assignments,
      darColumns,
      darEntities,
      avgWorkload
    });
  }

  function showEmployeeHistory(employee) {
    setSelectedEmployee(employee);
    setShowHistoryModal(true);
  }

  // Use utility function for active employees
  const activeEmployees = getActiveEmployees(employees);

  return (
    <div className="space-y-0 flex flex-col animate-fade-in-up" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Header Section - Modern THR styling */}
      <div className="bg-white dark:bg-slate-800 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-h3 text-slate-900 dark:text-slate-100">Schedule Builder</h1>
            <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Click any cell to assign • Click DAR info icon for history</p>
            <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden">Tap to assign</p>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Auto-save indicator */}
              <AutoSaveIndicator 
                isSaving={isSaving}
                lastSaved={lastSaved}
                error={autoSaveError}
              />

              {/* Undo/Redo buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`btn-pill flex items-center gap-1.5 shadow-soft transition-all ${
                    canUndo
                      ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:shadow-soft-md'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  aria-label="Undo (Ctrl+Z)"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`btn-pill flex items-center gap-1.5 shadow-soft transition-all ${
                    canRedo
                      ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:shadow-soft-md'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  aria-label="Redo (Ctrl+Y)"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Redo</span>
                </button>
              </div>
              
              {onCreateNewSchedule && (
                <button
                  className="btn-pill bg-thr-green-500 hover:bg-thr-green-600 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
                  aria-label="Create new schedule"
                  onClick={onCreateNewSchedule}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New Schedule</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="btn-pill bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
                aria-label="Show history"
              >
                <History className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Show History</span>
              </button>
              <button
                className="btn-pill bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
                aria-label="Configuration"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Config</span>
              </button>

              <button
                onClick={exportToExcel}
                className="btn-pill bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
                aria-label="Export to Excel"
              >
                <FileDown className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Status indicators */}
              <div className={`btn-pill flex items-center gap-1.5 cursor-default ${
                schedule?.status === 'published'
                  ? 'bg-thr-green-500 text-white'
                  : 'bg-orange-500 text-white'
              }`}>
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>{schedule?.status === 'published' ? 'Published' : 'Unpublish (Draft)'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Header - THR Blue Gradient Banner with inline date editing */}
      <div className="header-gradient px-4 sm:px-6 py-3 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/50"
            aria-label="Previous schedule"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="text-center flex-1 px-2">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Calendar className="w-5 h-5 text-white/80" aria-hidden="true" />
              {!readOnly ? (
                <div className="inline-flex items-center gap-2 bg-thr-green-600/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white font-semibold">✓</span>
                  <input
                    type="text"
                    value={scheduleName}
                    onChange={(e) => {
                      setScheduleName(e.target.value);
                      setHasChanges(true);
                    }}
                    className="bg-transparent text-white font-semibold text-sm text-center focus:outline-none placeholder:text-white/60 w-auto min-w-[120px]"
                    placeholder="Schedule name"
                    style={{ width: `${Math.max(120, (scheduleName?.length || 12) * 8)}px` }}
                  />
                  <span className="text-white/90 text-sm">
                    ({startDate || 'start'} to {endDate || 'end'})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-thr-green-600/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white font-semibold">✓</span>
                  <span className="font-semibold text-sm text-white">
                    {scheduleName || 'Schedule'} ({formatDateRange(startDate, endDate) || 'No dates'})
                  </span>
                </div>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft ${schedule?.status === 'published' ? 'bg-thr-green-500' : 'bg-orange-500'}`}>
                {schedule?.status === 'published' ? 'LIVE' : 'DRAFT'}
              </span>
            </div>
            {!readOnly && (
              <div className="flex items-center justify-center gap-2 mt-2 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setHasChanges(true);
                    }}
                    className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-white text-xs font-medium focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-soft transition-all duration-200 cursor-pointer hover:bg-white/25 [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                  <span className="text-white/80 text-xs font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setHasChanges(true);
                    }}
                    className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-white text-xs font-medium focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-soft transition-all duration-200 cursor-pointer hover:bg-white/25 [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/50"
            aria-label="Next schedule"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Conflict Banner */}
      {!readOnly && hasIssues && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900">
          <ConflictBanner
            conflicts={conflicts}
            warnings={warnings}
            workloadImbalances={workloadImbalances}
          />
        </div>
      )}

      {/* Schedule Table - Modern styling with rounded corners and shadows */}
      <div className="bg-slate-50 dark:bg-slate-900 flex-1 overflow-auto p-3">
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-auto border border-slate-100 dark:border-slate-700">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-max" role="grid" aria-label="Schedule assignments">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gradient-to-r from-thr-blue-500 to-thr-blue-600 dark:from-thr-blue-600 dark:to-thr-blue-700 text-white">
                  <th scope="col" className="sticky left-0 bg-thr-blue-500 dark:bg-thr-blue-600 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider z-30 min-w-[140px]">
                    Team Member
                  </th>
                  {darColumns.map((dar, idx) => (
                    <th key={idx} scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px] relative">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-xs">{dar}</span>
                        {!readOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDarIndex(idx);
                              setShowDarInfoPanel(true);
                            }}
                            className="p-0.5 rounded hover:bg-white/20 transition-colors"
                            aria-label={`View ${dar} history and info`}
                            title="View DAR history"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] font-normal opacity-80">
                        {editingDar === idx && !readOnly ? (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 max-h-48 overflow-y-auto min-w-[200px] border border-slate-200 dark:border-slate-600" role="dialog" aria-label="Select entities for DAR">
                            <div className="space-y-1">
                              {getAvailableEntitiesForDar(idx, darEntities, entities).map(entity => {
                                const currentList = darEntities[idx] || [];
                                const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                              const isSelected = currentArray.includes(entity.name);

                              return (
                                <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleDarEntityToggle(idx, entity.name)}
                                    className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                    aria-label={`Assign ${entity.name} to ${dar}`}
                                  />
                                  <span className="text-sm">{entity.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setEditingDar(null)}
                            className="mt-3 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                            aria-label="Close entity selection"
                          >
                            Done
                          </button>
                      </div>
                    ) : (
                      <button
                        className="cursor-pointer hover:bg-white/10 rounded-lg px-2 py-1 truncate w-full focus:ring-2 focus:ring-white/50 transition-colors"
                        onClick={() => !readOnly && setEditingDar(idx)}
                        title={formatEntityList(darEntities[idx])}
                        aria-label={`Configure entities for ${dar}. Current: ${formatEntityList(darEntities[idx]) || 'None'}`}
                        disabled={readOnly}
                      >
                        {getEntityShortCode(darEntities[idx]) || 'Select'}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[70px]">CPOE</th>
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[90px]">New Incoming<br/>Items</th>
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[90px]">Cross-<br/>Training</th>
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px]">Special<br/>Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeEmployees.map((employee, empIdx) => {
              const assignment = assignments[employee.id] || {};
              const isDarTrained = canAssignDAR(employee);
              const colorClass = employeeColors[empIdx % employeeColors.length];

              return (
                <tr 
                  key={employee.id} 
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                    empIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  {/* Employee Name - Employee Chip Style */}
                  <th scope="row" className="sticky left-0 bg-inherit px-3 py-2 z-10">
                    <div className="flex items-center gap-2">
                      <div className="employee-chip inline-flex">
                        <span className={`font-semibold text-sm ${colorClass} truncate`} title={employee.name}>
                          {employee.name}
                        </span>
                      </div>
                      {!readOnly && (
                        <WorkloadIndicator
                          workload={calculateWorkload(assignment, darEntities)}
                          avgWorkload={avgWorkload}
                          employeeName={employee.name}
                          assignment={assignment}
                        />
                      )}
                    </div>
                  </th>

                  {/* DAR Columns - Clickable Cells with modern styling */}
                  {darColumns.map((darName, darIdx) => {
                    const isAssigned = assignment.dars?.includes(darIdx);
                    const entityCode = getEntityShortCode(darEntities[darIdx]);

                    return (
                      <td
                        key={darIdx}
                        className={`px-1 py-2 text-center transition-all duration-150 rounded-lg mx-0.5 ${
                          !isDarTrained
                            ? 'bg-slate-100 dark:bg-slate-700/50'
                            : isAssigned
                              ? 'bg-thr-green-100 dark:bg-thr-green-900/30 hover:bg-thr-green-200 dark:hover:bg-thr-green-900/50 cursor-pointer shadow-soft'
                              : 'hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 cursor-pointer'
                        }`}
                        onClick={() => isDarTrained && handleDARToggle(employee.id, darIdx)}
                        onKeyPress={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && isDarTrained) {
                            e.preventDefault();
                            handleDARToggle(employee.id, darIdx);
                          }
                        }}
                        tabIndex={isDarTrained && !readOnly ? 0 : -1}
                        role="gridcell"
                        aria-label={`${isAssigned ? 'Remove' : 'Assign'} ${employee.name} to ${darName}`}
                        aria-pressed={isAssigned}
                      >
                        {isDarTrained ? (
                          isAssigned ? (
                            <div className="text-xs font-semibold text-thr-green-700 dark:text-thr-green-300 leading-tight">
                              {entityCode || '✓'}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                          )
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* CPOE Column - Toggleable like DAR columns */}
                  <td
                    className={`px-1 py-2 text-center transition-all duration-150 rounded-lg mx-0.5 ${
                      !employee.skills?.includes('CPOE')
                        ? 'bg-slate-100 dark:bg-slate-700/50'
                        : assignment.cpoe
                          ? 'bg-thr-green-100 dark:bg-thr-green-900/30 hover:bg-thr-green-200 dark:hover:bg-thr-green-900/50 cursor-pointer shadow-soft'
                          : 'hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 cursor-pointer'
                    }`}
                    onClick={() => employee.skills?.includes('CPOE') && !readOnly && handleAssignmentChange(employee.id, 'cpoe', !assignment.cpoe)}
                    onKeyPress={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && employee.skills?.includes('CPOE') && !readOnly) {
                        e.preventDefault();
                        handleAssignmentChange(employee.id, 'cpoe', !assignment.cpoe);
                      }
                    }}
                    tabIndex={employee.skills?.includes('CPOE') && !readOnly ? 0 : -1}
                    role="gridcell"
                    aria-label={`${assignment.cpoe ? 'Remove' : 'Assign'} ${employee.name} to CPOE`}
                    aria-pressed={assignment.cpoe}
                  >
                    {employee.skills?.includes('CPOE') ? (
                      assignment.cpoe ? (
                        <div className="text-xs font-semibold text-thr-green-700 dark:text-thr-green-300 leading-tight">
                          CPOE
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                      )
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                    )}
                  </td>

                  {/* New Incoming Items - Clickable cell with popup */}
                  <td
                    className={`px-1 py-2 text-center relative transition-all duration-150 rounded-lg mx-0.5 ${
                      (Array.isArray(assignment.newIncoming) && assignment.newIncoming.length > 0)
                        ? 'bg-thr-green-100 dark:bg-thr-green-900/30 hover:bg-thr-green-200 dark:hover:bg-thr-green-900/50 cursor-pointer shadow-soft'
                        : 'hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 cursor-pointer'
                    }`}
                    onClick={() => !readOnly && setEditingCell({ employeeId: employee.id, field: 'newIncoming' })}
                    onKeyPress={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                        e.preventDefault();
                        setEditingCell({ employeeId: employee.id, field: 'newIncoming' });
                      }
                    }}
                    tabIndex={!readOnly ? 0 : -1}
                    role="gridcell"
                    aria-label={`New incoming items for ${employee.name}: ${formatEntityList(assignment.newIncoming) || 'None'}`}
                  >
                    {readOnly ? (
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{formatEntityList(assignment.newIncoming)}</span>
                    ) : (
                      <>
                        {(Array.isArray(assignment.newIncoming) && assignment.newIncoming.length > 0) ? (
                          <div className="text-xs font-semibold text-thr-green-700 dark:text-thr-green-300 leading-tight">
                            {getEntityShortCode(assignment.newIncoming)}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                        )}
                        {editingCell?.employeeId === employee.id && editingCell?.field === 'newIncoming' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 max-h-48 overflow-y-auto min-w-[200px] border border-slate-200 dark:border-slate-600" role="dialog" aria-label="Select entities for New Incoming">
                            <div className="space-y-1">
                              {getAvailableEntitiesForAssignment(employee.id, 'newIncoming', assignments, darEntities, entities).map(entity => {
                                const currentList = assignment.newIncoming || [];
                                const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                                const isSelected = currentArray.includes(entity.name);

                                return (
                                  <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleAssignmentEntityToggle(employee.id, 'newIncoming', entity.name)}
                                      className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                      aria-label={`Assign ${entity.name} to New Incoming`}
                                    />
                                    <span className="text-sm">{entity.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}
                              className="mt-3 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                              aria-label="Close entity selection"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* Cross-Training - Clickable cell with popup */}
                  <td 
                    className={`px-1 py-2 text-center relative transition-all duration-150 rounded-lg mx-0.5 ${
                      (Array.isArray(assignment.crossTraining) && assignment.crossTraining.length > 0)
                        ? 'bg-thr-green-100 dark:bg-thr-green-900/30 hover:bg-thr-green-200 dark:hover:bg-thr-green-900/50 cursor-pointer shadow-soft'
                        : 'hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 cursor-pointer'
                    }`}
                    onClick={() => !readOnly && setEditingCell({ employeeId: employee.id, field: 'crossTraining' })}
                    onKeyPress={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                        e.preventDefault();
                        setEditingCell({ employeeId: employee.id, field: 'crossTraining' });
                      }
                    }}
                    tabIndex={!readOnly ? 0 : -1}
                    role="gridcell"
                    aria-label={`Cross-training for ${employee.name}: ${formatEntityList(assignment.crossTraining) || 'None'}`}
                  >
                    {readOnly ? (
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{formatEntityList(assignment.crossTraining)}</span>
                    ) : (
                      <>
                        {(Array.isArray(assignment.crossTraining) && assignment.crossTraining.length > 0) ? (
                          <div className="text-xs font-semibold text-thr-green-700 dark:text-thr-green-300 leading-tight">
                            {getEntityShortCode(assignment.crossTraining)}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                        )}
                        {editingCell?.employeeId === employee.id && editingCell?.field === 'crossTraining' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 max-h-48 overflow-y-auto min-w-[200px] border border-slate-200 dark:border-slate-600" role="dialog" aria-label="Select entities for Cross-Training">
                            <div className="space-y-1">
                              {getAvailableEntitiesForAssignment(employee.id, 'crossTraining', assignments, darEntities, entities).map(entity => {
                                const currentList = assignment.crossTraining || [];
                                const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                                const isSelected = currentArray.includes(entity.name);

                                return (
                                  <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleAssignmentEntityToggle(employee.id, 'crossTraining', entity.name)}
                                      className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                      aria-label={`Assign ${entity.name} to Cross-Training`}
                                    />
                                    <span className="text-sm">{entity.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}
                              className="mt-3 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                              aria-label="Close entity selection"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* Special Projects/Assignments */}
                  <td className="px-2 py-2 text-center" role="gridcell">
                    {readOnly ? (
                      <span className="text-slate-600 dark:text-slate-400 text-sm">{formatEntityList(assignment.specialProjects)}</span>
                    ) : (
                      <input
                        type="text"
                        value={formatEntityList(assignment.specialProjects)}
                        onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 focus:border-thr-blue-500 text-center bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                        placeholder=""
                        aria-label={`Special projects for ${employee.name}`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

          {activeEmployees.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1">Add employees first to create a schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button - Modern floating style */}
      {!readOnly && hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-thr-blue-500 hover:bg-thr-blue-600 text-white rounded-2xl font-semibold text-sm shadow-soft-lg hover:shadow-glow flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-slate-900 transform hover:-translate-y-0.5 transition-all duration-200"
            aria-label="Save schedule changes"
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            Save Changes
          </button>
        </div>
      )}

      {/* Employee History Modal */}
      {showHistoryModal && selectedEmployee && (
        <EmployeeHistoryModal
          employee={selectedEmployee}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* DAR Info Panel - Shows historical data about DAR assignments */}
      {showDarInfoPanel && selectedDarIndex !== null && (
        <DarInfoPanel
          darIndex={selectedDarIndex}
          darName={darColumns[selectedDarIndex]}
          darEntities={darEntities[selectedDarIndex]}
          employees={employees}
          currentAssignments={assignments}
          schedules={schedules}
          isOpen={showDarInfoPanel}
          onClose={() => {
            setShowDarInfoPanel(false);
            setSelectedDarIndex(null);
          }}
        />
      )}
    </div>
  );
}

ScheduleGrid.propTypes = {
  schedule: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    assignments: PropTypes.object,
    darEntities: PropTypes.object,
    darCount: PropTypes.number
  }),
  employees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string),
    archived: PropTypes.bool
  })),
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })),
  onSave: PropTypes.func,
  readOnly: PropTypes.bool,
  onCreateNewSchedule: PropTypes.func,
  schedules: PropTypes.array
};
