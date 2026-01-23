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
import { calculateEmployeeRotation } from '../utils/rotationAnalysis';
import RotationStatusBadge from './schedule/RotationStatusBadge';

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
    incomingEntities,
    incomingCount,
    incomingColumns,
    headerTexts,
    hasChanges,
    scheduleData: formData,
    setScheduleName,
    setStartDate,
    setEndDate,
    handleDarEntityToggle,
    handleIncomingEntityToggle,
    setDarCount,
    setIncomingCount,
    setHeaderText,
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
  const [editingIncoming, setEditingIncoming] = useState(null); // New for incoming
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { employeeId, field }
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');

  // Exclusive fields logic (DAR, Incoming, CPOE)
  const getActiveExclusiveFields = useCallback((assignment = {}) => {
    const activeFields = [];

    const hasEntries = (value) => {
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    };

    if (hasEntries(assignment.dars)) activeFields.push('dars');
    if (hasEntries(assignment.incoming)) activeFields.push('incoming');
    if (assignment.cpoe) activeFields.push('cpoe');

    return activeFields;
  }, []);

  const formatExclusiveLabel = useCallback((fields = []) => {
    const labels = {
      dars: 'DAR',
      incoming: 'Incoming',
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
  const navColCount = useMemo(() =>
    (darColumns?.length || 0) + (incomingColumns?.length || 0) + 6, // DARs + Incomings + CPOE + Cross + Special + 3P-P + 3P-B + Float
    [darColumns, incomingColumns]
  );
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
      if (readOnly) return;
      const employee = activeEmployees[row];
      if (!employee) return;

      // 0: Checkbox
      if (col === 0) {
        handleEmployeeSelect(employee.id);
        return;
      }

      // 1: Name
      if (col === 1) return;

      let currentCol = 2;

      // DAR Columns
      const darIndex = col - currentCol;
      if (darIndex >= 0 && darIndex < darColumns.length) {
        if (canAssignDAR(employee)) {
          handleDARToggle(employee.id, darIndex);
        }
        return;
      }
      currentCol += darColumns.length;

      // Incoming Columns
      const incIndex = col - currentCol;
      const incCount = incomingColumns?.length || 0;
      if (incIndex >= 0 && incIndex < incCount) {
        const currentInc = assignments[employee.id]?.incoming || [];
        const newInc = currentInc.includes(incIndex)
          ? currentInc.filter(i => i !== incIndex)
          : [...currentInc, incIndex];
        handleAssignmentChange(employee.id, 'incoming', newInc);
        return;
      }
      currentCol += incCount;

      // CPOE
      if (col === currentCol) {
        if (employee.skills?.includes('CPOE')) {
          handleAssignmentChange(employee.id, 'cpoe', !assignments[employee.id]?.cpoe);
        }
        return;
      }
      currentCol++;

      // Cross Training & Special Projects (Text fields - skip toggle)
      if (col === currentCol || col === currentCol + 1) return;
      currentCol += 2;

      // 3P Primary
      if (col === currentCol) {
        handleAssignmentChange(employee.id, 'threePPrimary', !assignments[employee.id]?.threePPrimary);
        return;
      }
      currentCol++;

      // 3P Backup
      if (col === currentCol) {
        handleAssignmentChange(employee.id, 'threePBackup', !assignments[employee.id]?.threePBackup);
        return;
      }
      currentCol++;

      // Float
      if (col === currentCol) {
        handleAssignmentChange(employee.id, 'float', !assignments[employee.id]?.float);
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

  // Calculate employee rotation data (memoized)
  const employeesWithRotation = useMemo(() =>
    calculateEmployeeRotation(employees || [], schedules || [], 10),
    [employees, schedules]
  );

  // Create a map for quick rotation data lookup
  const rotationDataMap = useMemo(() => {
    const map = new Map();
    employeesWithRotation.forEach(emp => {
      map.set(emp.id, emp.rotationData);
    });
    return map;
  }, [employeesWithRotation]);

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
          incomingColumns={incomingColumns || []}
          incomingEntities={incomingEntities || {}}
          headerTexts={headerTexts || {}}
          entities={entities}
          editingDar={editingDar}
          editingIncoming={editingIncoming}
          readOnly={readOnly}
          onDarClick={(idx) => setEditingDar(idx)}
          onDarEntityToggle={handleDarEntityToggle}
          onIncomingClick={(idx) => setEditingIncoming(idx)}
          onIncomingEntityToggle={handleIncomingEntityToggle}
          onHeaderRename={setHeaderText}
          onDarInfoClick={(idx) => openPanel('dar', idx)}
          onEditingDarClose={() => setEditingDar(null)}
          onEditingIncomingClose={() => setEditingIncoming(null)}
          onCpoeInfoClick={() => openPanel('cpoe')}
          onNewIncomingInfoClick={() => openPanel('newIncoming')}
          onCrossTrainingInfoClick={() => openPanel('crossTraining')}
          onSpecialProjectsInfoClick={() => openPanel('specialProjects')}
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

              // Helper to toggle array based assignment (for Incoming)
              const toggleIncoming = (incIdx) => {
                if (readOnly) return;
                setAssignments(prev => {
                  const currentInc = prev[employee.id]?.incoming || [];
                  const newInc = currentInc.includes(incIdx)
                    ? currentInc.filter(i => i !== incIdx)
                    : [...currentInc, incIdx];
                  return {
                    ...prev,
                    [employee.id]: {
                      ...prev[employee.id],
                      incoming: newInc
                    }
                  };
                });
                markDirty();
              };

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
                  {/* Employee Name */}
                  <th scope="row" className="sticky left-0 bg-inherit px-4 py-3 z-10 border-r-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="employee-chip inline-flex bg-white dark:bg-slate-700/50 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                        <span className={`font-semibold text-sm ${colorClass} truncate`} title={employee.name}>
                          {employee.name}
                        </span>
                      </div>
                      {!readOnly && rotationDataMap.get(employee.id) && (
                        <RotationStatusBadge
                          rotationStatus={rotationDataMap.get(employee.id).rotationStatus}
                          compact={true}
                        />
                      )}
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

                  {/* DAR Columns */}
                  {darColumns.map((darName, darIdx) => {
                    const isAssigned = assignment.dars?.includes(darIdx);
                    const entityNames = darEntities[darIdx];
                    const entityDisplay = Array.isArray(entityNames) ? entityNames.join(', ') : (entityNames || '');

                    return (
                      <td
                        key={`dar-${darIdx}`}
                        title={entityDisplay || `${darName} - No entities assigned`}
                        className={`px-2 py-3 text-center transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
                          !isDarTrained
                            ? 'bg-slate-100/50 dark:bg-slate-700/30 cursor-not-allowed'
                            : isAssigned
                              ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 hover:from-thr-green-200 hover:to-thr-green-100 cursor-pointer'
                              : darBlocked
                                ? 'bg-slate-100/50 dark:bg-slate-800/40 cursor-not-allowed opacity-60'
                                : 'bg-white dark:bg-slate-800/20 hover:bg-slate-50 cursor-pointer'
                        }`}
                        onClick={() => isDarTrained && !darBlocked && handleDARToggle(employee.id, darIdx)}
                      >
                        {isDarTrained ? (
                          isAssigned ? (
                            <div className="flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-thr-green-500 dark:bg-thr-green-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">X</span>
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

                  {/* Incoming Columns (Dynamic) */}
                  {incomingColumns?.map((incName, incIdx) => {
                    const isAssigned = assignment.incoming?.includes(incIdx);
                    const entityNames = incomingEntities[incIdx];
                    const entityDisplay = Array.isArray(entityNames) ? entityNames.join(', ') : (entityNames || '');
                    // Use the helper to get short codes for display
                    const shortCodes = getEntityShortCode(entityNames, entities);
                    // Use custom header text as fallback if no entities are configured
                    const headerText = headerTexts[`inc-${incIdx}`];
                    const displayText = shortCodes || headerText || 'Incoming';

                    return (
                       <td
                        key={`inc-${incIdx}`}
                        title={entityDisplay || headerText || `${incName} - No entities assigned`}
                        className={`px-2 py-3 text-center transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
                          isAssigned
                              ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 hover:from-thr-green-200 hover:to-thr-green-100 cursor-pointer'
                              : 'bg-white dark:bg-slate-800/20 hover:bg-slate-50 cursor-pointer'
                        }`}
                        onClick={() => toggleIncoming(incIdx)}
                      >
                        {isAssigned ? (
                           <div className="flex items-center justify-center">
                              <span className="text-thr-green-700 dark:text-thr-green-300 text-xs font-bold px-1 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                                {displayText}
                              </span>
                            </div>
                        ) : (
                           <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                            </div>
                        )}
                      </td>
                    );
                  })}

                  {/* CPOE Column */}
                  <td
                    className={`px-2 py-3 text-center transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
                      !employee.skills?.includes('CPOE')
                        ? 'bg-slate-100/50 dark:bg-slate-700/30 cursor-not-allowed'
                        : assignment.cpoe
                          ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 cursor-pointer'
                          : cpoeBlocked
                            ? 'bg-slate-100/50 dark:bg-slate-800/40 cursor-not-allowed opacity-60'
                            : 'bg-white dark:bg-slate-800/20 cursor-pointer'
                    }`}
                    onClick={() => employee.skills?.includes('CPOE') && !readOnly && !cpoeBlocked && handleAssignmentChange(employee.id, 'cpoe', !assignment.cpoe)}
                  >
                    {employee.skills?.includes('CPOE') ? (
                      assignment.cpoe ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-thr-green-500 dark:bg-thr-green-600 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">X</span>
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

                  {/* Cross-Training (Text) */}
                  <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-700/50 min-w-[150px]">
                    {readOnly ? (
                      <span className="text-sm text-slate-700 dark:text-slate-300 break-words line-clamp-2">{assignment.crossTraining || ''}</span>
                    ) : (
                       <input
                        type="text"
                        value={assignment.crossTraining || ''}
                        onChange={(e) => handleAssignmentChange(employee.id, 'crossTraining', e.target.value)}
                        className="w-full text-center text-sm bg-transparent border-b border-transparent focus:border-thr-blue-500 focus:ring-0 p-1"
                        placeholder="Type..."
                      />
                    )}
                  </td>

                  {/* Special Projects (Text) */}
                  <td className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-700/50 min-w-[150px]">
                    {readOnly ? (
                      <span className="text-sm text-slate-700 dark:text-slate-300 break-words line-clamp-2">{assignment.specialProjects || ''}</span>
                    ) : (
                       <input
                        type="text"
                        value={assignment.specialProjects || ''}
                        onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                        className="w-full text-center text-sm bg-transparent border-b border-transparent focus:border-thr-blue-500 focus:ring-0 p-1"
                        placeholder="Type..."
                      />
                    )}
                  </td>

                  {/* 3P Primary */}
                  <td
                    className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50"
                    onClick={() => !readOnly && handleAssignmentChange(employee.id, 'threePPrimary', !assignment.threePPrimary)}
                  >
                     {assignment.threePPrimary ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">P</span>
                          </div>
                        </div>
                      ) : (
                         <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                         </div>
                      )}
                  </td>

                  {/* 3P Backup */}
                  <td
                    className="px-2 py-3 text-center border-r border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50"
                    onClick={() => !readOnly && handleAssignmentChange(employee.id, 'threePBackup', !assignment.threePBackup)}
                  >
                     {assignment.threePBackup ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-purple-300 dark:bg-purple-800 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">B</span>
                          </div>
                        </div>
                      ) : (
                         <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                         </div>
                      )}
                  </td>

                  {/* Float */}
                  <td
                    className="px-2 py-3 text-center cursor-pointer hover:bg-slate-50"
                    onClick={() => !readOnly && handleAssignmentChange(employee.id, 'float', !assignment.float)}
                  >
                     {assignment.float ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-orange-400 dark:bg-orange-600 flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">F</span>
                          </div>
                        </div>
                      ) : (
                         <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                         </div>
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
