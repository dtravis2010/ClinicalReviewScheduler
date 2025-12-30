import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import PropTypes from 'prop-types';
import { Save, Calendar } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeHistoryModal from './EmployeeHistoryModal';
import DarInfoPanel from './DarInfoPanel';
import CpoeInfoPanel from './schedule/CpoeInfoPanel';
import EntityInfoPanel from './schedule/EntityInfoPanel';
import SpecialProjectsInfoPanel from './schedule/SpecialProjectsInfoPanel';
import ConflictBanner from './schedule/ConflictBanner';
import WorkloadIndicator from './schedule/WorkloadIndicator';
import ScheduleHeader from './schedule/ScheduleHeader';
import ScheduleDateBanner from './schedule/ScheduleDateBanner';
import ScheduleTable from './schedule/ScheduleTable';
import ScheduleTableHeader from './schedule/ScheduleTableHeader';
import BulkAssignmentModal from './schedule/BulkAssignmentModal';
import EntityAssignmentCell from './schedule/EntityAssignmentCell';
import ScheduleSummary from './schedule/ScheduleSummary';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useConflictDetection } from '../hooks/useConflictDetection';
import { useScheduleForm } from '../hooks/useScheduleForm';
import { useInfoPanels } from '../hooks/useInfoPanels';
import { calculateWorkload } from '../utils/conflictDetection';
import { AriaLiveRegion } from './AriaLiveRegion';
import { exportToExcel as exportScheduleToExcel } from '../utils/exportUtils';
import { formatEntityList, formatDateRange, getEntityShortCode, getActiveEmployees, getEmployeeInitials } from '../utils/scheduleUtils';
import { canAssignDAR, getAvailableEntitiesForDar, getAvailableEntitiesForAssignment } from '../utils/assignmentLogic';
import { getLastEntityAssignments, formatHistoryDate } from '../utils/entityHistory';

const EMPLOYEE_COLORS = [
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

export default function ScheduleGrid({
  schedule,
  employees = [],
  entities = [],
  onSave,
  readOnly = false,
  onCreateNewSchedule,
  schedules = [],
  onScheduleChange
}) {
  // Use undo/redo for assignments
  const {
    state: assignments,
    setState: setAssignments,
    resetState: resetAssignments,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo({}, { limit: 50 });

  const navigate = useNavigate();

  // Use schedule form hook for metadata management
  const {
    scheduleName,
    startDate,
    endDate,
    darEntities,
    darCount,
    darColumns,
    hasChanges,
    scheduleData: formData,
    setScheduleName,
    setStartDate,
    setEndDate,
    handleDarEntityToggle,
    setDarCount,
    markClean,
    markDirty
  } = useScheduleForm(schedule, resetAssignments);

  // Use info panels hook for consolidated panel state
  const {
    openPanel,
    closePanel,
    showDarInfoPanel,
    showCpoeInfoPanel,
    showNewIncomingInfoPanel,
    showCrossTrainingInfoPanel,
    showSpecialProjectsInfoPanel,
    selectedDarIndex
  } = useInfoPanels();

  // Remaining local state
  const [editingDar, setEditingDar] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { employeeId, field }
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');

  const getActiveExclusiveFields = useCallback((assignment = {}) => {
    const activeFields = [];

    const hasEntries = (value) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    };

    if (hasEntries(assignment.dars)) activeFields.push('dars');
    if (hasEntries(assignment.newIncoming)) activeFields.push('newIncoming');
    if (assignment.cpoe) activeFields.push('cpoe');

    return activeFields;
  }, []);

  const formatExclusiveLabel = useCallback((fields = []) => {
    const labels = {
      dars: 'DAR',
      newIncoming: 'New Incoming',
      cpoe: 'CPOE'
    };

    if (!fields.length) return '';
    const mapped = fields.map((field) => labels[field] || field);
    if (mapped.length === 1) return mapped[0];
    return `${mapped.slice(0, -1).join(', ')} and ${mapped[mapped.length - 1]}`;
  }, []);

  const isFieldBlockedByExclusiveAssignment = useCallback((employeeId, targetField) => {
    const activeFields = getActiveExclusiveFields(assignments[employeeId] || {});
    return activeFields.length > 0 && !activeFields.includes(targetField);
  }, [assignments, getActiveExclusiveFields]);

  const getExclusiveBlockMessage = useCallback((employeeId, targetField) => {
    const activeFields = getActiveExclusiveFields(assignments[employeeId] || {});
    if (activeFields.length === 0 || activeFields.includes(targetField)) return '';
    return `Assignment locked by ${formatExclusiveLabel(activeFields)}`;
  }, [assignments, getActiveExclusiveFields, formatExclusiveLabel]);

  // Auto-save functionality - combine form data with assignments
  const scheduleData = useMemo(() => ({
    ...formData,
    assignments
  }), [formData, assignments]);

  const { isSaving, lastSaved, error: autoSaveError, hasUnsavedChanges: autoSaveHasChanges } = useAutoSave(
    scheduleData,
    onSave,
    { delay: 2000, enabled: !readOnly && !!schedule, resetKey: schedule?.id }
  );

  // Conflict detection
  const {
    conflicts,
    warnings,
    workloadImbalances,
    hasIssues,
    avgWorkload
  } = useConflictDetection(assignments, employees, darEntities);

  // Use utility function for active employees (memoized)
  const activeEmployees = useMemo(() => getActiveEmployees(employees), [employees]);

  // Keyboard navigation across interactive grid cells
  const navColCount = useMemo(() => (darColumns?.length || 0) + 4, [darColumns]);
  const {
    gridRef,
    focusedCell,
    getCellId,
    isCellFocused,
  } = useKeyboardNavigation({
    rowCount: activeEmployees.length || 0,
    colCount: navColCount,
    enabled: !readOnly,
    onActivate: (row, col) => {
      const emp = activeEmployees[row];
      if (!emp) return;
      const empAssign = assignments[emp.id] || {};

      // DAR columns
      if (col < (darColumns?.length || 0)) {
        const darIdx = col;
        const darBlocked = isFieldBlockedByExclusiveAssignment(emp.id, 'dars');
        const isDarTrained = canAssignDAR(emp);
        if (isDarTrained && !darBlocked) {
          handleDARToggle(emp.id, darIdx);
        }
        return;
      }

      const cpoeColIndex = (darColumns?.length || 0);
      const newIncomingColIndex = cpoeColIndex + 1;
      const crossTrainingColIndex = cpoeColIndex + 2;
      const specialProjectsColIndex = cpoeColIndex + 3;

      // CPOE
      if (col === cpoeColIndex) {
        const cpoeBlocked = isFieldBlockedByExclusiveAssignment(emp.id, 'cpoe');
        if (emp.skills?.includes('CPOE') && !cpoeBlocked) {
          handleAssignmentChange(emp.id, 'cpoe', !empAssign.cpoe);
        }
        return;
      }

      // New Incoming
      if (col === newIncomingColIndex) {
        if (!readOnly) setEditingCell({ employeeId: emp.id, field: 'newIncoming' });
        return;
      }

      // Cross-Training
      if (col === crossTrainingColIndex) {
        if (!readOnly) setEditingCell({ employeeId: emp.id, field: 'crossTraining' });
        return;
      }

      // Special Projects
      if (col === specialProjectsColIndex) {
        if (!readOnly) setEditingCell({ employeeId: emp.id, field: 'specialProjects' });
        return;
      }
    }
  });

  // Focus the schedule table to enable arrow-key navigation when not read-only
  useEffect(() => {
    if (!readOnly && gridRef?.current) {
      gridRef.current.focus();
    }
  }, [readOnly]);

  // Reset selected employees when schedule changes
  useEffect(() => {
    if (schedule) {
      setSelectedEmployees(new Set());
    }
  }, [schedule?.id]);

  const handleAssignmentChange = useCallback((employeeId, field, value) => {
    if (readOnly) return;
    const isCurrentlyAssigned = Boolean(assignments[employeeId]?.[field]);
    const blocked = !isCurrentlyAssigned && isFieldBlockedByExclusiveAssignment(employeeId, field);
    if (blocked) return;

    setAssignments(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
    markDirty();
  }, [readOnly, setAssignments, assignments, isFieldBlockedByExclusiveAssignment, markDirty]);

  const handleDARToggle = useCallback((employeeId, darIndex) => {
    if (readOnly) return;
    if (!Array.isArray(employees)) return;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee?.skills?.includes('DAR') && !employee?.skills?.includes('Float')) {
      return;
    }

    const isAssigned = assignments[employeeId]?.dars?.includes(darIndex);
    const blocked = !isAssigned && isFieldBlockedByExclusiveAssignment(employeeId, 'dars');
    if (blocked) return;

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
    markDirty();
  }, [readOnly, employees, setAssignments, assignments, isFieldBlockedByExclusiveAssignment, markDirty]);

  const handleAssignmentEntityToggle = useCallback((employeeId, field, entityName) => {
    const blocked = isFieldBlockedByExclusiveAssignment(employeeId, field);
    if (blocked) return;
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
    markDirty();
  }, [setAssignments, isFieldBlockedByExclusiveAssignment, markDirty]);

  const handleSpecialProjectToggle = useCallback((employeeId, field) => {
    setAssignments(prev => {
      const current = prev[employeeId]?.specialProjects || {};
      // Normalize to object format
      const currentObj = typeof current === 'object' && !Array.isArray(current) 
        ? current 
        : { threePEmail: false, threePBackupEmail: false, float: false, other: '' };

      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          specialProjects: {
            ...currentObj,
            [field]: !currentObj[field]
          }
        }
      };
    });
    markDirty();
  }, [setAssignments, markDirty]);

  const handleSpecialProjectOtherChange = useCallback((employeeId, value) => {
    setAssignments(prev => {
      const current = prev[employeeId]?.specialProjects || {};
      // Normalize to object format
      const currentObj = typeof current === 'object' && !Array.isArray(current) 
        ? current 
        : { threePEmail: false, threePBackupEmail: false, float: false, other: '' };

      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          specialProjects: {
            ...currentObj,
            other: value
          }
        }
      };
    });
    markDirty();
  }, [setAssignments, markDirty]);

  // Bulk assignment handlers
  const handleEmployeeSelect = useCallback((employeeId) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedEmployees.size === activeEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(activeEmployees.map(emp => emp.id)));
    }
  }, [selectedEmployees.size, activeEmployees]);

  const handleBulkAssign = useCallback(() => {
    if (selectedEmployees.size > 0) {
      setShowBulkAssignmentModal(true);
    }
  }, [selectedEmployees.size]);

  const handleApplyBulkAssignment = useCallback((successfulAssignments) => {
    // Apply all successful assignments
    setAssignments(prev => {
      const newAssignments = { ...prev };

      successfulAssignments.forEach(assignment => {
        const { employeeId, type, darIndex, entities } = assignment;
        
        if (!newAssignments[employeeId]) {
          newAssignments[employeeId] = {};
        }

        switch (type) {
          case 'dar':
            // Add DAR assignment
            const currentDars = newAssignments[employeeId].dars || [];
            if (!currentDars.includes(darIndex)) {
              newAssignments[employeeId].dars = [...currentDars, darIndex];
            }
            break;
          case 'cpoe':
            newAssignments[employeeId].cpoe = true;
            break;
          case 'newIncoming':
          case 'crossTraining':
          case 'specialProjects':
            // Set entities for these assignment types
            newAssignments[employeeId][type] = entities;
            break;
        }
      });

      return newAssignments;
    });

    markDirty();
    setShowBulkAssignmentModal(false);
    setSelectedEmployees(new Set()); // Clear selection after bulk assign
    // Announce bulk assign for screen readers
    if (successfulAssignments && successfulAssignments.length > 0) {
      setAnnouncementMessage(`Bulk assignment applied: ${successfulAssignments.length} update${successfulAssignments.length > 1 ? 's' : ''} completed.`);
      // Clear announcement after short delay to allow re-announcement later
      setTimeout(() => setAnnouncementMessage(''), 1500);
    }
  }, [setAssignments, markDirty]);

  function handleSave() {
    if (onSave) {
      onSave(scheduleData);
      markClean();
    }
  }

  // Schedule navigation handlers
  const currentScheduleIndex = useMemo(() => {
    if (!schedules || schedules.length === 0 || !schedule) return -1;
    return schedules.findIndex(s => s.id === schedule.id);
  }, [schedules, schedule]);

  const handlePreviousSchedule = useCallback(() => {
    if (currentScheduleIndex === -1 || currentScheduleIndex >= schedules.length - 1 || !onScheduleChange) return;
    
    const previousSchedule = schedules[currentScheduleIndex + 1];
    onScheduleChange(previousSchedule);
  }, [currentScheduleIndex, schedules, onScheduleChange]);

  const handleNextSchedule = useCallback(() => {
    if (currentScheduleIndex <= 0 || !onScheduleChange) return;
    
    const nextSchedule = schedules[currentScheduleIndex - 1];
    onScheduleChange(nextSchedule);
  }, [currentScheduleIndex, schedules, onScheduleChange]);

  // Check if navigation is possible
  const canGoPrevious = currentScheduleIndex !== -1 && currentScheduleIndex < schedules.length - 1;
  const canGoNext = currentScheduleIndex > 0;

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
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!readOnly && onSave) {
          onSave(scheduleData);
        }
      }
      // ESC to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    if (!readOnly) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [canUndo, canRedo, undo, redo, readOnly, onSave, scheduleData, isFullscreen]);

  const exportToExcel = useCallback(() => {
    exportScheduleToExcel({
      scheduleName,
      startDate,
      employees,
      assignments,
      darColumns,
      darEntities,
      avgWorkload
    });
  }, [scheduleName, startDate, employees, assignments, darColumns, darEntities, avgWorkload]);

  const showEmployeeHistory = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowHistoryModal(true);
  }, []);

  // Calculate entity history for showing who last had each entity (memoized)
  const entityHistory = useMemo(() => 
    getLastEntityAssignments(schedules || [], employees || [], entities || []),
    [schedules, employees, entities]
  );

  return (
    <div className={`space-y-0 flex flex-col animate-fade-in-up w-full ${
      isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-auto' : ''
    }`}>
      {/* Accessibility live announcements */}
      <AriaLiveRegion message={announcementMessage} mode="polite" />
      {/* Header Section */}
      <ScheduleHeader
        readOnly={readOnly}
        isSaving={isSaving}
        lastSaved={lastSaved}
        autoSaveError={autoSaveError}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onCreateNewSchedule={onCreateNewSchedule}
        onShowHistory={() => setShowHistoryModal(true)}
        onExport={exportToExcel}
        scheduleStatus={schedule?.status}
        selectedCount={selectedEmployees.size}
        onBulkAssign={handleBulkAssign}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onViewProductivity={() => navigate('/productivity-dashboard')}
      />

      {/* Date Banner */}
      <ScheduleDateBanner
        scheduleName={scheduleName}
        startDate={startDate}
        endDate={endDate}
        scheduleStatus={schedule?.status}
        readOnly={readOnly}
        onScheduleNameChange={setScheduleName}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPreviousSchedule={handlePreviousSchedule}
        onNextSchedule={handleNextSchedule}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />

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

      {/* Schedule Summary */}
      <ScheduleSummary
        totalEmployees={activeEmployees.length}
        assignedEmployees={Object.keys(assignments).filter(empId => {
          const assign = assignments[empId];
          return assign && (
            (assign.dars && assign.dars.length > 0) ||
            assign.cpoe ||
            (assign.newIncoming && assign.newIncoming.length > 0) ||
            (assign.crossTraining && assign.crossTraining.length > 0) ||
            (assign.specialProjects && (
              assign.specialProjects.threePEmail ||
              assign.specialProjects.threePBackupEmail ||
              assign.specialProjects.float ||
              (assign.specialProjects.other && assign.specialProjects.other.trim())
            ))
          );
        }).length}
        totalEntities={entities.length}
        assignedEntities={(() => {
          const assignedEntitySet = new Set();
          Object.values(assignments).forEach(assign => {
            if (assign.dars) assign.dars.forEach(darIdx => {
              const entityList = darEntities[darIdx];
              if (Array.isArray(entityList)) {
                entityList.forEach(e => assignedEntitySet.add(e));
              } else if (entityList) {
                assignedEntitySet.add(entityList);
              }
            });
            if (assign.newIncoming && Array.isArray(assign.newIncoming)) {
              assign.newIncoming.forEach(e => assignedEntitySet.add(e));
            }
            if (assign.crossTraining && Array.isArray(assign.crossTraining)) {
              assign.crossTraining.forEach(e => assignedEntitySet.add(e));
            }
          });
          return assignedEntitySet.size;
        })()}
        totalAssignments={Object.values(assignments).reduce((total, assign) => {
          let count = 0;
          if (assign.dars) count += assign.dars.length;
          if (assign.cpoe) count += 1;
          if (assign.newIncoming) count += assign.newIncoming.length;
          if (assign.crossTraining) count += assign.crossTraining.length;
          if (assign.specialProjects) {
            if (assign.specialProjects.threePEmail) count += 1;
            if (assign.specialProjects.threePBackupEmail) count += 1;
            if (assign.specialProjects.float) count += 1;
            if (assign.specialProjects.other && assign.specialProjects.other.trim()) count += 1;
          }
          return total + count;
        }, 0)}
        conflicts={conflicts.length}
      />

      {/* Schedule Table */}
      <ScheduleTable
        tableRef={gridRef}
        ariaActivedescendant={getCellId(focusedCell.row, focusedCell.col)}
        ariaRowCount={activeEmployees.length}
        ariaColCount={navColCount}
      >
        <ScheduleTableHeader
          darColumns={darColumns}
          darEntities={darEntities}
          entities={entities}
          editingDar={editingDar}
          readOnly={readOnly}
          onDarClick={(idx) => setEditingDar(idx)}
          onDarEntityToggle={handleDarEntityToggle}
          onDarInfoClick={(idx) => openPanel('dar', idx)}
          onCpoeInfoClick={() => openPanel('cpoe')}
          onNewIncomingInfoClick={() => openPanel('newIncoming')}
          onCrossTrainingInfoClick={() => openPanel('crossTraining')}
          onSpecialProjectsInfoClick={() => openPanel('specialProjects')}
          onEditingDarClose={() => setEditingDar(null)}
          showBulkSelect={!readOnly}
          allSelected={selectedEmployees.size === activeEmployees.length && activeEmployees.length > 0}
          onSelectAll={handleSelectAll}
        />
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeEmployees.map((employee, empIdx) => {
              const assignment = assignments[employee.id] || {};
              const isDarTrained = canAssignDAR(employee);
              const colorClass = EMPLOYEE_COLORS[empIdx % EMPLOYEE_COLORS.length];
              const darBlocked = isFieldBlockedByExclusiveAssignment(employee.id, 'dars');
              const darBlockMessage = getExclusiveBlockMessage(employee.id, 'dars');
              const cpoeBlocked = isFieldBlockedByExclusiveAssignment(employee.id, 'cpoe');
              const cpoeBlockMessage = getExclusiveBlockMessage(employee.id, 'cpoe');

              return (
                <tr
                  key={employee.id}
                  className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50 hover:via-white hover:to-slate-50 dark:hover:from-slate-700/40 dark:hover:via-slate-700/20 dark:hover:to-slate-700/40 border-b border-slate-100 dark:border-slate-700/50 ${
                    empIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/30 dark:bg-slate-800/30'
                  }`}
                >
                  {/* Checkbox for bulk selection */}
                  {!readOnly && (
                    <td className="sticky left-0 bg-inherit px-3 py-3 z-10 text-center border-r border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.id)}
                        onChange={() => handleEmployeeSelect(employee.id)}
                        className="w-4 h-4 text-thr-blue-500 rounded focus:ring-2 focus:ring-thr-blue-500 cursor-pointer"
                        aria-label={`Select ${employee.name}`}
                      />
                    </td>
                  )}
                  {/* Employee Name - Employee Chip Style */}
                  <th scope="row" className="sticky left-0 bg-inherit px-4 py-3 z-10 border-r-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="employee-chip inline-flex bg-white dark:bg-slate-700/50 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
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
                    // P0-7: Show full entity names instead of abbreviations
                    const entityNames = darEntities[darIdx];
                    const entityDisplay = Array.isArray(entityNames) ? entityNames.join(', ') : (entityNames || '');

                    return (
                      <td
                        id={getCellId(empIdx, darIdx)}
                        key={darIdx}
                        title={entityDisplay || `${darName} - No entities assigned`}
                        className={`px-2 py-3 text-center transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
                          !isDarTrained
                            ? 'bg-slate-100/50 dark:bg-slate-700/30 cursor-not-allowed'
                            : isAssigned
                              ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 hover:from-thr-green-200 hover:to-thr-green-100 dark:hover:from-thr-green-900/60 dark:hover:to-thr-green-900/40 cursor-pointer shadow-sm hover:shadow-md active:scale-95'
                              : darBlocked
                                ? 'bg-slate-100/50 dark:bg-slate-800/40 cursor-not-allowed opacity-60'
                                : 'bg-white dark:bg-slate-800/20 hover:bg-gradient-to-br hover:from-thr-blue-50 hover:to-white dark:hover:from-thr-blue-900/20 dark:hover:to-slate-800/40 cursor-pointer hover:shadow-sm active:scale-95'
                        } ${isCellFocused(empIdx, darIdx) ? 'ring-2 ring-thr-blue-500 dark:ring-thr-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}
                        onClick={() => isDarTrained && !darBlocked && handleDARToggle(employee.id, darIdx)}
                        onKeyPress={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && isDarTrained && !darBlocked) {
                            e.preventDefault();
                            handleDARToggle(employee.id, darIdx);
                          }
                        }}
                        tabIndex={(!readOnly && isDarTrained) ? -1 : -1}
                        role="gridcell"
                        aria-label={`${isAssigned ? 'Remove' : 'Assign'} ${employee.name} to ${darName}${darBlocked ? `. ${darBlockMessage}` : ''}`}
                        aria-pressed={isAssigned}
                      >
                        {isDarTrained ? (
                          isAssigned ? (
                            <div className="flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-thr-green-500 dark:bg-thr-green-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>
                        )}
                      </td>
                    );
                  })}

                  {/* CPOE Column - Modern toggle design matching DAR columns */}
                  <td
                    id={getCellId(empIdx, (darColumns?.length || 0))}
                    className={`px-2 py-3 text-center transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
                      !employee.skills?.includes('CPOE')
                        ? 'bg-slate-100/50 dark:bg-slate-700/30 cursor-not-allowed'
                        : assignment.cpoe
                          ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 hover:from-thr-green-200 hover:to-thr-green-100 dark:hover:from-thr-green-900/60 dark:hover:to-thr-green-900/40 cursor-pointer shadow-sm hover:shadow-md active:scale-95'
                          : cpoeBlocked
                            ? 'bg-slate-100/50 dark:bg-slate-800/40 cursor-not-allowed opacity-60'
                            : 'bg-white dark:bg-slate-800/20 hover:bg-gradient-to-br hover:from-thr-blue-50 hover:to-white dark:hover:from-thr-blue-900/20 dark:hover:to-slate-800/40 cursor-pointer hover:shadow-sm active:scale-95'
                    } ${isCellFocused(empIdx, (darColumns?.length || 0)) ? 'ring-2 ring-thr-blue-500 dark:ring-thr-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}
                    onClick={() => employee.skills?.includes('CPOE') && !readOnly && !cpoeBlocked && handleAssignmentChange(employee.id, 'cpoe', !assignment.cpoe)}
                    onKeyPress={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && employee.skills?.includes('CPOE') && !readOnly && !cpoeBlocked) {
                        e.preventDefault();
                        handleAssignmentChange(employee.id, 'cpoe', !assignment.cpoe);
                      }
                    }}
                    tabIndex={employee.skills?.includes('CPOE') && !readOnly ? -1 : -1}
                    role="gridcell"
                    aria-label={`${assignment.cpoe ? 'Remove' : 'Assign'} ${employee.name} to CPOE${cpoeBlocked ? `. ${cpoeBlockMessage}` : ''}`}
                    aria-pressed={assignment.cpoe}
                  >
                    {employee.skills?.includes('CPOE') ? (
                      assignment.cpoe ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-thr-green-500 dark:bg-thr-green-600 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                        </div>
                      )
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>
                    )}
                  </td>

                  {/* New Incoming Items */}
                  <EntityAssignmentCell
                    employee={employee}
                    field="newIncoming"
                    assignment={assignment}
                    availableEntities={getAvailableEntitiesForAssignment(employee.id, 'newIncoming', assignments, darEntities, entities)}
                    entityHistory={entityHistory}
                    readOnly={readOnly}
                    blocked={isFieldBlockedByExclusiveAssignment(employee.id, 'newIncoming')}
                    blockMessage={getExclusiveBlockMessage(employee.id, 'newIncoming')}
                    isEditing={editingCell?.employeeId === employee.id && editingCell?.field === 'newIncoming'}
                    onStartEdit={() => setEditingCell({ employeeId: employee.id, field: 'newIncoming' })}
                    onEndEdit={() => { setEditingCell(null); gridRef?.current?.focus(); }}
                    onToggle={handleAssignmentEntityToggle}
                    cellId={getCellId(empIdx, (darColumns?.length || 0) + 1)}
                    useKeyboardNav={!readOnly}
                    isFocused={isCellFocused(empIdx, (darColumns?.length || 0) + 1)}
                  />

                  {/* Cross-Training */}
                  <EntityAssignmentCell
                    employee={employee}
                    field="crossTraining"
                    assignment={assignment}
                    availableEntities={getAvailableEntitiesForAssignment(employee.id, 'crossTraining', assignments, darEntities, entities)}
                    entityHistory={entityHistory}
                    readOnly={readOnly}
                    blocked={false}
                    blockMessage=""
                    isEditing={editingCell?.employeeId === employee.id && editingCell?.field === 'crossTraining'}
                    onStartEdit={() => setEditingCell({ employeeId: employee.id, field: 'crossTraining' })}
                    onEndEdit={() => { setEditingCell(null); gridRef?.current?.focus(); }}
                    onToggle={handleAssignmentEntityToggle}
                    cellId={getCellId(empIdx, (darColumns?.length || 0) + 2)}
                    useKeyboardNav={!readOnly}
                    isFocused={isCellFocused(empIdx, (darColumns?.length || 0) + 2)}
                  />

                  {/* Special Projects/Assignments - Modern design */}
                  <td
                    id={getCellId(empIdx, (darColumns?.length || 0) + 3)}
                    className={`px-2 py-3 text-center relative transition-all duration-200 ${
                      (() => {
                        const sp = assignment.specialProjects;
                        const hasProjects = sp && (
                          (typeof sp === 'object' && !Array.isArray(sp) && (sp.threePEmail || sp.threePBackupEmail || sp.float || sp.other)) ||
                          (Array.isArray(sp) && sp.length > 0) ||
                          (typeof sp === 'string' && sp)
                        );
                        return hasProjects
                          ? 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 hover:from-purple-200 hover:to-purple-100 dark:hover:from-purple-900/60 dark:hover:to-purple-900/40 shadow-sm hover:shadow-md active:scale-95'
                          : 'bg-white dark:bg-slate-800/20 hover:bg-gradient-to-br hover:from-thr-blue-50 hover:to-white dark:hover:from-thr-blue-900/20 dark:hover:to-slate-800/40 hover:shadow-sm active:scale-95';
                      })()
                    } ${readOnly ? '' : 'cursor-pointer'} ${isCellFocused(empIdx, (darColumns?.length || 0) + 3) ? 'ring-2 ring-thr-blue-500 dark:ring-thr-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}
                    onClick={() => !readOnly && setEditingCell({ employeeId: employee.id, field: 'specialProjects' })}
                    onKeyPress={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
                        e.preventDefault();
                        setEditingCell({ employeeId: employee.id, field: 'specialProjects' });
                      }
                    }}
                    tabIndex={!readOnly ? -1 : -1}
                    role="gridcell"
                    aria-label={`Special projects for ${employee.name}`}
                  >
                    {readOnly ? (
                      (() => {
                        const sp = assignment.specialProjects;
                        // Handle old format (array or string) - P0-7: Show full names
                        if (Array.isArray(sp) && sp.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {sp.map((item, idx) => (
                                <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-200 text-purple-700 dark:bg-purple-800/40 dark:text-purple-300 shadow-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          );
                        }
                        if (typeof sp === 'string' && sp) {
                          return (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-200 text-purple-700 dark:bg-purple-800/40 dark:text-purple-300 shadow-sm">
                              {sp}
                            </span>
                          );
                        }
                        // Handle new format (object)
                        if (sp && typeof sp === 'object' && !Array.isArray(sp)) {
                          const badges = [];
                          if (sp.threePEmail) badges.push('3P');
                          if (sp.threePBackupEmail) badges.push('3P-B');
                          if (sp.float) badges.push('Float');
                          if (sp.other) badges.push(sp.other);

                          if (badges.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {badges.map((badge, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-200 text-purple-700 dark:bg-purple-800/40 dark:text-purple-300 shadow-sm">
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                        }
                        return <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>;
                      })()
                    ) : (
                      <>
                        {(() => {
                          const sp = assignment.specialProjects;
                          // Normalize to object format for display
                          const spObj = (sp && typeof sp === 'object' && !Array.isArray(sp))
                            ? sp
                            : { threePEmail: false, threePBackupEmail: false, float: false, other: '' };

                          const badges = [];
                          if (spObj.threePEmail) badges.push('3P');
                          if (spObj.threePBackupEmail) badges.push('3P-B');
                          if (spObj.float) badges.push('Float');
                          if (spObj.other) badges.push(spObj.other);

                          if (badges.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {badges.map((badge, idx) => (
                                  <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-200 text-purple-700 dark:bg-purple-800/40 dark:text-purple-300 shadow-sm">
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                            </div>
                          );
                        })()}
                        {editingCell?.employeeId === employee.id && editingCell?.field === 'specialProjects' && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 min-w-[220px] border border-slate-200 dark:border-slate-600" role="dialog" aria-label="Select special projects">
                            <div className="space-y-3">
                              {(() => {
                                const sp = assignment.specialProjects;
                                const spObj = (sp && typeof sp === 'object' && !Array.isArray(sp)) 
                                  ? sp 
                                  : { threePEmail: false, threePBackupEmail: false, float: false, other: '' };
                                
                                return (
                                  <>
                                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={spObj.threePEmail || false}
                                        onChange={() => handleSpecialProjectToggle(employee.id, 'threePEmail')}
                                        className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        aria-label="3P Email"
                                      />
                                      <span className="text-sm">3P Email</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={spObj.threePBackupEmail || false}
                                        onChange={() => handleSpecialProjectToggle(employee.id, 'threePBackupEmail')}
                                        className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        aria-label="3P Backup Email"
                                      />
                                      <span className="text-sm">3P Backup Email</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={spObj.float || false}
                                        onChange={() => handleSpecialProjectToggle(employee.id, 'float')}
                                        className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        aria-label="Float"
                                      />
                                      <span className="text-sm">Float</span>
                                    </label>
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Other
                                      </label>
                                      <input
                                        type="text"
                                        value={spObj.other || ''}
                                        onChange={(e) => handleSpecialProjectOtherChange(employee.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 focus:border-thr-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                                        placeholder="Enter other project..."
                                        aria-label="Other special project"
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCell(null); gridRef?.current?.focus(); }}
                              className="mt-3 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                              aria-label="Close special projects selection"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        {activeEmployees.length === 0 && (
          <tbody>
            <tr>
              <td colSpan="100" className="text-center py-16 text-slate-500 dark:text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-lg font-medium">No employees found</p>
                <p className="text-sm mt-1">Add employees first to create a schedule.</p>
              </td>
            </tr>
          </tbody>
        )}
      </ScheduleTable>

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
          onClose={closePanel}
        />
      )}

      {/* CPOE Info Panel */}
      <CpoeInfoPanel
        isOpen={showCpoeInfoPanel}
        onClose={closePanel}
        employees={employees}
        currentAssignments={assignments}
        schedules={schedules}
      />

      {/* New Incoming Info Panel */}
      <EntityInfoPanel
        isOpen={showNewIncomingInfoPanel}
        onClose={closePanel}
        assignmentType="newIncoming"
        entities={entities}
        employees={employees}
        currentAssignments={assignments}
        schedules={schedules}
      />

      {/* Cross-Training Info Panel */}
      <EntityInfoPanel
        isOpen={showCrossTrainingInfoPanel}
        onClose={closePanel}
        assignmentType="crossTraining"
        entities={entities}
        employees={employees}
        currentAssignments={assignments}
        schedules={schedules}
      />

      {/* Special Projects Info Panel */}
      <SpecialProjectsInfoPanel
        isOpen={showSpecialProjectsInfoPanel}
        onClose={closePanel}
        employees={employees}
        currentAssignments={assignments}
        schedules={schedules}
      />

      {/* Bulk Assignment Modal */}
      <BulkAssignmentModal
        isOpen={showBulkAssignmentModal}
        onClose={() => setShowBulkAssignmentModal(false)}
        selectedEmployees={selectedEmployees}
        employees={activeEmployees}
        entities={entities}
        darColumns={darColumns}
        assignments={assignments}
        darEntities={darEntities}
        onApply={handleApplyBulkAssignment}
      />
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
  schedules: PropTypes.array,
  onScheduleChange: PropTypes.func
};
