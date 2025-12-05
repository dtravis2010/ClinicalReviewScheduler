import { useState, useEffect } from 'react';
import { Save, Download, History, Edit2, ChevronLeft, ChevronRight, Settings, Eye, Upload, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeHistoryModal from './EmployeeHistoryModal';

export default function ScheduleGrid({ schedule, employees = [], entities = [], onSave, readOnly = false }) {
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

  // Color palette for employee names
  const employeeColors = [
    'text-blue-600',
    'text-pink-600',
    'text-green-600',
    'text-purple-600',
    'text-orange-600',
    'text-cyan-600',
    'text-red-600',
    'text-indigo-600',
    'text-teal-600',
    'text-fuchsia-600',
    'text-lime-600',
    'text-rose-600',
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
        const isDarTrained = employee.skills?.includes('DAR') || employee.skills?.includes('Float');
        const entityList = darEntities[idx] || [];
        const entityNames = Array.isArray(entityList) ? entityList.join('/') : (entityList || '');
        const columnName = entityNames ? `${dar}\n${entityNames}` : dar;

        if (isDarTrained) {
          row[columnName] = assignment.dars?.includes(idx) ? '✓' : '';
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

  const activeEmployees = employees.filter(e => !e.archived);

  return (
    <div className="space-y-0">
      {/* Header Section */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Builder</h1>
            <p className="text-sm text-gray-600 mt-1">Click any cell to assign or modify</p>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                <span className="text-lg">+</span> New Schedule
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                <History className="w-4 h-4" /> Show History
              </button>
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" /> Config
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                <FileDown className="w-4 h-4" /> Export
              </button>
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                <Eye className="w-4 h-4" /> Published
              </button>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4" /> Unpublish (Draft)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Header - Green Banner */}
      <div className="bg-emerald-600 px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <button className="p-2 hover:bg-emerald-700 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center gap-2 bg-emerald-700 px-4 py-2 rounded-lg">
                <span className="text-xl">✓</span>
                <span className="font-semibold text-lg">
                  {scheduleName || 'DEC'} ({formatDateRange() || '2025-12-03 to 2025-12-16'})
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-700 rounded-full text-sm font-semibold">LIVE</span>
            </div>
            <p className="text-emerald-100 text-sm">{formatDateRange() || '2025-12-03 to 2025-12-16'}</p>
          </div>

          <button className="p-2 hover:bg-emerald-700 rounded-lg transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-teal-600 text-white">
                <th className="sticky left-0 bg-teal-600 px-6 py-4 text-left text-sm font-bold uppercase z-10 min-w-[200px]">
                  TEAM MEMBER
                </th>
                {darColumns.map((dar, idx) => (
                  <th key={idx} className="px-4 py-4 text-center text-sm font-bold uppercase min-w-[140px] relative">
                    <div className="mb-1">{dar}</div>
                    <div className="text-xs font-normal opacity-90">
                      {editingDar === idx && !readOnly ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-white rounded shadow-lg p-3 z-50 max-h-64 overflow-y-auto">
                          <div className="space-y-2">
                            {getAvailableEntitiesForDar(idx).map(entity => {
                              const currentList = darEntities[idx] || [];
                              const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                              const isSelected = currentArray.includes(entity.name);

                              return (
                                <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded text-gray-900">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleDarEntityToggle(idx, entity.name)}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                  />
                                  <span className="text-sm">{entity.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setEditingDar(null)}
                            className="mt-3 w-full px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-teal-700 rounded px-2 py-1"
                          onClick={() => !readOnly && setEditingDar(idx)}
                        >
                          {formatEntityList(darEntities[idx]) || 'Click to assign'}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-bold uppercase min-w-[120px]">CPOE</th>
                <th className="px-4 py-4 text-center text-sm font-bold uppercase min-w-[140px]">New Incoming<br/>Items</th>
                <th className="px-4 py-4 text-center text-sm font-bold uppercase min-w-[140px]">Cross-<br/>Training</th>
                <th className="px-4 py-4 text-center text-sm font-bold uppercase min-w-[180px]">Special<br/>Projects/Assignments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeEmployees.map((employee, empIdx) => {
                const assignment = assignments[employee.id] || {};
                const isDarTrained = canAssignDAR(employee);
                const colorClass = employeeColors[empIdx % employeeColors.length];

                return (
                  <tr key={employee.id} className={empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Employee Name */}
                    <td className="sticky left-0 bg-inherit px-6 py-4 z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-base ${colorClass}`}>
                          {employee.name}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => showEmployeeHistory(employee)}
                            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* DAR Columns */}
                    {darColumns.map((_, darIdx) => (
                      <td key={darIdx} className={`px-4 py-4 text-center ${!isDarTrained ? 'bg-gray-100' : ''}`}>
                        {isDarTrained ? (
                          readOnly ? (
                            assignment.dars?.includes(darIdx) ? (
                              <span className="text-gray-400 text-lg">—</span>
                            ) : null
                          ) : (
                            <input
                              type="checkbox"
                              checked={assignment.dars?.includes(darIdx) || false}
                              onChange={() => handleDARToggle(employee.id, darIdx)}
                              className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                            />
                          )
                        ) : (
                          <span className="text-gray-300 text-lg">—</span>
                        )}
                      </td>
                    ))}

                    {/* CPOE */}
                    <td className="px-4 py-4 text-center">
                      {readOnly ? (
                        <span className="text-gray-600 text-sm">{formatEntityList(assignment.cpoe)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.cpoe) ? assignment.cpoe : (assignment.cpoe ? [assignment.cpoe] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'cpoe', selected);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'cpoe').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* New Incoming Items */}
                    <td className="px-4 py-4 text-center">
                      {readOnly ? (
                        <span className="text-gray-600 text-sm">{formatEntityList(assignment.newIncoming)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.newIncoming) ? assignment.newIncoming : (assignment.newIncoming ? [assignment.newIncoming] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'newIncoming', selected);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'newIncoming').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Cross-Training */}
                    <td className="px-4 py-4 text-center">
                      {readOnly ? (
                        <span className="text-gray-600 text-sm">{formatEntityList(assignment.crossTraining)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.crossTraining) ? assignment.crossTraining : (assignment.crossTraining ? [assignment.crossTraining] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'crossTraining', selected);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'crossTraining').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Special Projects/Assignments */}
                    <td className="px-4 py-4 text-center">
                      {readOnly ? (
                        <span className="text-gray-600 text-sm">{formatEntityList(assignment.specialProjects)}</span>
                      ) : (
                        <input
                          type="text"
                          value={formatEntityList(assignment.specialProjects)}
                          onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-center bg-white"
                          placeholder=""
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {activeEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No employees found. Add employees first to create a schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button (floating or at bottom) */}
      {!readOnly && hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-base shadow-lg flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
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
