import { useState, useEffect } from 'react';
import { Save, Download, History, Edit2, ChevronLeft, ChevronRight, Settings, Eye, Upload, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeHistoryModal from './EmployeeHistoryModal';

export default function ScheduleGrid({
  schedule,
  employees = [],
  entities = [],
  onSave,
  readOnly = false,
  onCreateNewSchedule
}) {
  const [assignments, setAssignments] = useState({});
  const [scheduleName, setScheduleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [darEntities, setDarEntities] = useState({});
  const [editingDar, setEditingDar] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const darColumns = ['DAR 1', 'DAR 2', 'DAR 3', 'DAR 4', 'DAR 5', 'DAR 6'];

  const employeeColors = [
    'text-blue-600', 'text-pink-600', 'text-green-600', 'text-purple-600',
    'text-orange-600', 'text-cyan-600', 'text-red-600', 'text-indigo-600',
    'text-teal-600', 'text-fuchsia-600', 'text-lime-600', 'text-rose-600',
  ];

  useEffect(() => {
    if (schedule) {
      setAssignments(schedule.assignments || {});
      setScheduleName(schedule.name || '');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
      setDarEntities(schedule.darEntities || {});
    } else {
      loadDefaultDarConfig();
    }
  }, [schedule]);

  async function loadDefaultDarConfig() {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'darConfig'));
      if (configDoc.exists()) {
        setDarEntities(configDoc.data().config || {});
      }
    } catch (error) {
      console.error('Error loading DAR config:', error);
    }
  }

  function getAvailableEntitiesForDar(darIndex) {
    const assignedToDars = new Set();
    Object.entries(darEntities).forEach(([idx, entityList]) => {
      if (parseInt(idx) !== darIndex) {
        if (Array.isArray(entityList)) {
          entityList.forEach(e => assignedToDars.add(e));
        } else if (entityList) {
          assignedToDars.add(entityList);
        }
      }
    });
    return entities.filter(e => !assignedToDars.has(e.name));
  }

  function getAvailableEntitiesForAssignment(employeeId, field) {
    const assignedEntities = new Set();
    Object.values(darEntities).forEach(entityList => {
      if (Array.isArray(entityList)) {
        entityList.forEach(e => assignedEntities.add(e));
      } else if (entityList) {
        assignedEntities.add(entityList);
      }
    });

    Object.entries(assignments).forEach(([empId, assignment]) => {
      if (empId !== employeeId) {
        ['cpoe', 'newIncoming', 'crossTraining'].forEach(f => {
          if (assignment[f]) {
            if (Array.isArray(assignment[f])) {
              assignment[f].forEach(e => assignedEntities.add(e));
            } else {
              assignedEntities.add(assignment[f]);
            }
          }
        });
      } else {
        ['cpoe', 'newIncoming', 'crossTraining'].forEach(f => {
          if (f !== field && assignment[f]) {
            if (Array.isArray(assignment[f])) {
              assignment[f].forEach(e => assignedEntities.add(e));
            } else {
              assignedEntities.add(assignment[f]);
            }
          }
        });
      }
    });

    return entities.filter(e => !assignedEntities.has(e.name));
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

  function handleSave() {
    if (onSave) {
      onSave({
        name: scheduleName,
        startDate,
        endDate,
        assignments,
        darEntities
      });
      setHasChanges(false);
    }
  }

  function exportToExcel() {
    const data = employees.filter(e => !e.archived).map(employee => {
      const assignment = assignments[employee.id] || {};
      const row = { 'TEAM MEMBER': employee.name };

      darColumns.forEach((dar, idx) => {
        const isDarTrained = canAssignDAR(employee);
        const entityList = darEntities[idx] || [];
        const entityNames = Array.isArray(entityList) ? entityList.join('/') : (entityList || '');
        const columnName = entityNames ? `${dar}\n${entityNames}` : dar;

        if (isDarTrained && assignment.dars?.includes(idx)) {
          row[columnName] = entityNames;
        } else {
          row[columnName] = '';
        }
      });

      const formatField = (val) => Array.isArray(val) ? val.join(', ') : (val || '');
      row['CPOE'] = formatField(assignment.cpoe);
      row['New Incoming Items'] = formatField(assignment.newIncoming);
      row['Cross-Training'] = formatField(assignment.crossTraining);
      row['Special Projects/Assignments'] = formatField(assignment.specialProjects);

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    const fileName = `${scheduleName || 'Schedule'}_${startDate || 'export'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function showEmployeeHistory(employee) {
    setSelectedEmployee(employee);
    setShowHistoryModal(true);
  }

  function canAssignDAR(employee) {
    return employee.skills?.includes('DAR') || employee.skills?.includes('Float');
  }

  function formatEntityList(entityList) {
    if (Array.isArray(entityList)) {
      return entityList.join('/');
    }
    return entityList || '';
  }

  function formatDateRange() {
    if (!startDate || !endDate) return '';
    return `${startDate} to ${endDate}`;
  }

  // Get short entity code for display in cells
  function getEntityShortCode(entityList) {
    if (!entityList) return '';
    if (Array.isArray(entityList)) {
      return entityList.map(e => {
        const parts = e.split('/');
        return parts[0];
      }).join('/');
    }
    const parts = entityList.split('/');
    return parts[0];
  }

  const activeEmployees = employees.filter(e => !e.archived);

  return (
    <div className="space-y-0 h-screen flex flex-col">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Schedule Builder</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">Click any cell to assign or modify</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:hidden">Tap to assign</p>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {onCreateNewSchedule && (
                <button
                  className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-800 touch-manipulation"
                  aria-label="Create new schedule"
                  onClick={onCreateNewSchedule}
                >
                  <span className="text-base" aria-hidden="true">+</span> <span className="hidden sm:inline">New Schedule</span><span className="sm:hidden">New</span>
                </button>
              )}
              <button onClick={() => setShowHistoryModal(true)} className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 touch-manipulation" aria-label="Show history">
                <History className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Show History</span><span className="sm:hidden">History</span>
              </button>
              <button className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 touch-manipulation" aria-label="Configuration">
                <Settings className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Config</span>
              </button>
              <button onClick={exportToExcel} className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 touch-manipulation" aria-label="Export to Excel">
                <FileDown className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Export</span>
              </button>
              <button className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-800 touch-manipulation hidden sm:flex" aria-label="View published schedules">
                <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Published
              </button>
              <button className="px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 touch-manipulation hidden sm:flex" aria-label="Unpublish schedule">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" /> Unpublish (Draft)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Header - Green Banner */}
      <div className="bg-emerald-600 dark:bg-emerald-700 px-3 sm:px-4 py-3 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <button className="p-2 min-h-[44px] min-w-[44px] sm:p-1.5 sm:min-h-0 sm:min-w-0 hover:bg-emerald-700 dark:hover:bg-emerald-800 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 touch-manipulation" aria-label="Previous schedule">
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="text-center flex-1 px-2">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-2 bg-emerald-700 dark:bg-emerald-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                <span className="text-base" aria-hidden="true">✓</span>
                <span className="font-semibold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
                  {scheduleName || 'DEC'} <span className="hidden sm:inline">({formatDateRange() || '2025-12-03 to 2025-12-16'})</span>
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-700 dark:bg-emerald-800 rounded-full text-xs font-semibold">LIVE</span>
            </div>
            <p className="text-emerald-100 dark:text-emerald-200 text-xs sm:hidden">{formatDateRange() || '2025-12-03 to 2025-12-16'}</p>
            <p className="text-emerald-100 dark:text-emerald-200 text-xs hidden sm:block">{formatDateRange() || '2025-12-03 to 2025-12-16'}</p>
          </div>

          <button className="p-2 min-h-[44px] min-w-[44px] sm:p-1.5 sm:min-h-0 sm:min-w-0 hover:bg-emerald-700 dark:hover:bg-emerald-800 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 touch-manipulation" aria-label="Next schedule">
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Schedule Table - Fills remaining space */}
      <div className="bg-white dark:bg-gray-900 flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <table className="w-full border-collapse table-fixed flex-1" role="grid" aria-label="Schedule assignments">
            <thead className="sticky top-0 z-20">
              <tr className="bg-teal-600 dark:bg-teal-700 text-white">
                <th scope="col" className="sticky left-0 bg-teal-600 dark:bg-teal-700 px-2 py-1.5 text-left text-[10px] font-bold uppercase z-30 w-28">
                  TEAM MEMBER
                </th>
                {darColumns.map((dar, idx) => (
                  <th key={idx} scope="col" className="px-1 py-1.5 text-center text-[10px] font-bold uppercase w-20 relative">
                    <div className="mb-0.5 text-[9px]">{dar}</div>
                    <div className="text-[8px] font-normal opacity-90">
                      {editingDar === idx && !readOnly ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700 rounded shadow-lg p-2 z-50 max-h-48 overflow-y-auto min-w-[200px]" role="dialog" aria-label="Select entities for DAR">
                          <div className="space-y-1">
                            {getAvailableEntitiesForDar(idx).map(entity => {
                              const currentList = darEntities[idx] || [];
                              const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                              const isSelected = currentArray.includes(entity.name);

                              return (
                                <label key={entity.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded text-gray-900 dark:text-gray-100">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleDarEntityToggle(idx, entity.name)}
                                    className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 rounded focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                                    aria-label={`Assign ${entity.name} to ${dar}`}
                                  />
                                  <span className="text-xs">{entity.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setEditingDar(null)}
                            className="mt-2 w-full px-2 py-1 bg-teal-600 dark:bg-teal-700 text-white rounded text-xs hover:bg-teal-700 dark:hover:bg-teal-600 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            aria-label="Close entity selection"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <button
                          className="cursor-pointer hover:bg-teal-700 dark:hover:bg-teal-800 rounded px-1 py-0.5 truncate w-full focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600"
                          onClick={() => !readOnly && setEditingDar(idx)}
                          title={formatEntityList(darEntities[idx])}
                          aria-label={`Configure entities for ${dar}. Current: ${formatEntityList(darEntities[idx]) || 'None'}`}
                          disabled={readOnly}
                        >
                          {getEntityShortCode(darEntities[idx]) || 'Click'}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-1 py-1.5 text-center text-[10px] font-bold uppercase w-16">CPOE</th>
                <th scope="col" className="px-1 py-1.5 text-center text-[10px] font-bold uppercase w-20">New<br/>Incoming</th>
                <th scope="col" className="px-1 py-1.5 text-center text-[10px] font-bold uppercase w-20">Cross-<br/>Training</th>
                <th scope="col" className="px-1 py-1.5 text-center text-[10px] font-bold uppercase w-24">Special<br/>Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeEmployees.map((employee, empIdx) => {
                const assignment = assignments[employee.id] || {};
                const isDarTrained = canAssignDAR(employee);
                const colorClass = employeeColors[empIdx % employeeColors.length];

                return (
                  <tr key={employee.id} className={empIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    {/* Employee Name */}
                    <th scope="row" className="sticky left-0 bg-inherit px-2 py-1 z-10">
                      <span className={`font-semibold text-[10px] ${colorClass} dark:brightness-125 truncate block`} title={employee.name}>
                        {employee.name}
                      </span>
                    </th>

                    {/* DAR Columns - Clickable Cells */}
                    {darColumns.map((darName, darIdx) => {
                      const isAssigned = assignment.dars?.includes(darIdx);
                      const entityCode = getEntityShortCode(darEntities[darIdx]);

                      return (
                        <td
                          key={darIdx}
                          className={`px-0.5 py-1 text-center transition-colors ${
                            !isDarTrained
                              ? 'bg-gray-200 dark:bg-gray-700'
                              : isAssigned
                                ? 'bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60 cursor-pointer'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
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
                              <div className="text-[9px] font-medium text-teal-800 dark:text-teal-300 leading-tight">
                                {entityCode || '✓'}
                              </div>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-[9px]">—</span>
                            )
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-[9px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* CPOE */}
                    <td className="px-1 py-2 text-center" role="gridcell">
                      {readOnly ? (
                        <span className="text-gray-600 dark:text-gray-400 text-[10px]">{formatEntityList(assignment.cpoe)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.cpoe) ? assignment.cpoe : (assignment.cpoe ? [assignment.cpoe] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'cpoe', selected);
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          size="1"
                          aria-label={`CPOE assignment for ${employee.name}`}
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'cpoe').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* New Incoming Items */}
                    <td className="px-1 py-2 text-center" role="gridcell">
                      {readOnly ? (
                        <span className="text-gray-600 dark:text-gray-400 text-[10px]">{formatEntityList(assignment.newIncoming)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.newIncoming) ? assignment.newIncoming : (assignment.newIncoming ? [assignment.newIncoming] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'newIncoming', selected);
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          size="1"
                          aria-label={`New incoming items assignment for ${employee.name}`}
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'newIncoming').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Cross-Training */}
                    <td className="px-1 py-2 text-center" role="gridcell">
                      {readOnly ? (
                        <span className="text-gray-600 dark:text-gray-400 text-[10px]">{formatEntityList(assignment.crossTraining)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.crossTraining) ? assignment.crossTraining : (assignment.crossTraining ? [assignment.crossTraining] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'crossTraining', selected);
                          }}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          size="1"
                          aria-label={`Cross-training assignment for ${employee.name}`}
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'crossTraining').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Special Projects/Assignments */}
                    <td className="px-1 py-2 text-center" role="gridcell">
                      {readOnly ? (
                        <span className="text-gray-600 dark:text-gray-400 text-[10px]">{formatEntityList(assignment.specialProjects)}</span>
                      ) : (
                        <input
                          type="text"
                          value={formatEntityList(assignment.specialProjects)}
                          onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                          className="w-full px-1 py-0.5 text-[10px] border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 text-center bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
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

          {activeEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No employees found. Add employees first to create a schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {!readOnly && hasChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-lg font-semibold text-sm shadow-lg flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900"
            aria-label="Save schedule changes"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
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
    </div>
  );
}
