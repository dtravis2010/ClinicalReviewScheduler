import { useState, useEffect } from 'react';
import { Save, Download, History, Edit2, ChevronLeft, ChevronRight, Settings, Eye, Upload, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeHistoryModal from './EmployeeHistoryModal';

export default function ScheduleGrid({ schedule, employees = [], entities = [], onSave, onCreateSchedule, readOnly = false }) {
  const [assignments, setAssignments] = useState({});
  const [scheduleName, setScheduleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [darEntities, setDarEntities] = useState({});
  const [editingDar, setEditingDar] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);

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

  function handleMetaChange(field, value) {
    if (readOnly) return;
    if (field === 'name') setScheduleName(value);
    if (field === 'startDate') setStartDate(value);
    if (field === 'endDate') setEndDate(value);
    setHasChanges(true);
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
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Schedule Builder</h1>
            <p className="text-xs text-gray-600 mt-0.5">Click any cell to assign or modify</p>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => onCreateSchedule?.()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span className="text-base">+</span> New Schedule
              <button
                onClick={() => onCreateSchedule?.()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
              <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                <Settings className="w-3.5 h-3.5" /> Config
              </button>
              <button onClick={exportToExcel} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                <FileDown className="w-3.5 h-3.5" /> Export
              </button>
              <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Published
              </button>
              <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Unpublish (Draft)
              </button>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="mt-3 grid gap-3 md:grid-cols-4 lg:grid-cols-6 items-end">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Schedule Name</label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => handleMetaChange('name', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                placeholder="e.g., Week of Dec 10"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleMetaChange('startDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleMetaChange('endDate', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
              <div className="flex-1 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">Status</div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mt-1">
                  {schedule?.status ? schedule.status.toUpperCase() : 'DRAFT'}
                </div>
              </div>
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm"
              >
                <Save className="w-4 h-4 inline mr-1" /> Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date Header - Green Banner */}
      <div className="bg-emerald-600 px-4 py-3 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <button className="p-1.5 hover:bg-emerald-700 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="flex items-center gap-2 bg-emerald-700 px-3 py-1.5 rounded-lg">
                <span className="text-base">✓</span>
                <span className="font-semibold text-sm">
                  {scheduleName || 'DEC'} ({formatDateRange() || '2025-12-03 to 2025-12-16'})
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-700 rounded-full text-xs font-semibold">LIVE</span>
            </div>
            <p className="text-emerald-100 text-xs">{formatDateRange() || '2025-12-03 to 2025-12-16'}</p>
          </div>

          <button className="p-1.5 hover:bg-emerald-700 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Schedule Table - Spreadsheet-like view */}
      <div className="bg-gradient-to-b from-white to-gray-50 flex-1 overflow-hidden border-t border-gray-200 shadow-inner">
        <div className="h-full flex flex-col rounded-xl overflow-hidden border border-gray-300 shadow">
          <table className="w-full table-fixed flex-1 border-collapse text-[12px]">
            <thead className="sticky top-0 z-20 shadow">
              <tr className="bg-slate-900 text-white uppercase text-[12px] tracking-[0.05em]">
                <th className="sticky left-0 bg-slate-900 px-3 py-2.5 text-left font-bold z-30 w-36 border-r border-slate-700/70">
                  Team Member
                </th>
                {darColumns.map((dar, idx) => (
                  <th
                    key={idx}
                    className={`px-2.5 py-2.5 text-center font-bold border-r border-slate-700/70 relative ${hoveredCol === idx ? 'bg-slate-700/70' : ''}`}
                    onMouseEnter={() => setHoveredCol(idx)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    <div className="mb-0.5 text-[11px]">{dar}</div>
                    <div className="text-[10px] font-normal opacity-90">
                      {editingDar === idx && !readOnly ? (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg p-2 z-50 max-h-48 overflow-y-auto min-w-[220px]">
                          <div className="space-y-1">
                            {getAvailableEntitiesForDar(idx).map(entity => {
                              const currentList = darEntities[idx] || [];
                              const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                              const isSelected = currentArray.includes(entity.name);

                              return (
                                <label key={entity.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 p-1.5 rounded text-gray-900">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleDarEntityToggle(idx, entity.name)}
                                    className="w-3.5 h-3.5 text-teal-600 rounded focus:ring-teal-500"
                                  />
                                  <span className="text-xs">{entity.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setEditingDar(null)}
                            className="mt-2 w-full px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-slate-700/60 rounded px-1 py-0.5 truncate"
                          onClick={() => !readOnly && setEditingDar(idx)}
                          title={formatEntityList(darEntities[idx])}
                        >
                          {getEntityShortCode(darEntities[idx]) || 'Click'}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th
                  className={`px-2.5 py-2.5 text-center font-bold border-r border-slate-700/70 ${hoveredCol === 6 ? 'bg-slate-700/70' : ''}`}
                  onMouseEnter={() => setHoveredCol(6)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  CPOE
                </th>
                <th
                  className={`px-2.5 py-2.5 text-center font-bold border-r border-slate-700/70 ${hoveredCol === 7 ? 'bg-slate-700/70' : ''}`}
                  onMouseEnter={() => setHoveredCol(7)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  New Incoming
                </th>
                <th
                  className={`px-2.5 py-2.5 text-center font-bold border-r border-slate-700/70 ${hoveredCol === 8 ? 'bg-slate-700/70' : ''}`}
                  onMouseEnter={() => setHoveredCol(8)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  Cross-Training
                </th>
                <th
                  className={`px-2.5 py-2.5 text-center font-bold ${hoveredCol === 9 ? 'bg-slate-700/70' : ''}`}
                  onMouseEnter={() => setHoveredCol(9)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  Special Projects
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[12px]">
              {activeEmployees.map((employee, empIdx) => {
                const assignment = assignments[employee.id] || {};
                const isDarTrained = canAssignDAR(employee);
                const colorClass = employeeColors[empIdx % employeeColors.length];
                const isRowHovered = hoveredRow === employee.id;

                return (
                  <tr
                    key={employee.id}
                    className={`${empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isRowHovered ? 'ring-1 ring-emerald-300/50 bg-emerald-50/40' : ''}`}
                    onMouseEnter={() => setHoveredRow(employee.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Employee Name */}
                    <td className="sticky left-0 bg-inherit px-3 py-2.5 z-10 border-r border-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-[12px] ${colorClass} truncate block`} title={employee.name}>
                          {employee.name}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => showEmployeeHistory(employee)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                          >
                            history
                          </button>
                        )}
                      </div>
                    </td>

                    {/* DAR Columns - Clickable Cells */}
                    {darColumns.map((_, darIdx) => {
                      const isAssigned = assignment.dars?.includes(darIdx);
                      const entityCode = getEntityShortCode(darEntities[darIdx]);
                      const colIndex = darIdx;
                      const isColHovered = hoveredCol === colIndex;

                      return (
                        <td
                          key={darIdx}
                          className={`px-2 py-2.5 text-center cursor-pointer transition-colors border border-gray-200 ${
                            !isDarTrained
                              ? 'bg-gray-100 text-gray-400'
                              : isAssigned
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                : 'bg-white hover:bg-slate-100'
                          } ${isColHovered ? 'bg-emerald-50/70' : ''}`}
                          onClick={() => isDarTrained && handleDARToggle(employee.id, darIdx)}
                          onMouseEnter={() => setHoveredCol(colIndex)}
                          onMouseLeave={() => setHoveredCol(null)}
                        >
                          {isDarTrained ? (
                            isAssigned ? (
                              <div className="text-[11px] font-semibold text-emerald-800 leading-tight">
                                {entityCode || '✓'}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-[12px]">—</span>
                            )
                          ) : (
                            <span className="text-gray-400 text-[12px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* CPOE */}
                    <td
                      className={`px-2.5 py-2.5 text-center border border-gray-200 ${hoveredCol === 6 ? 'bg-emerald-50/70' : ''}`}
                      onMouseEnter={() => setHoveredCol(6)}
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {readOnly ? (
                        <span className="text-gray-800 font-semibold text-[12px]">{formatEntityList(assignment.cpoe)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.cpoe) ? assignment.cpoe : (assignment.cpoe ? [assignment.cpoe] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'cpoe', selected);
                          }}
                          className="w-full px-2.5 py-1.5 text-[12px] border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'cpoe').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* New Incoming Items */}
                    <td
                      className={`px-2.5 py-2.5 text-center border border-gray-200 ${hoveredCol === 7 ? 'bg-emerald-50/70' : ''}`}
                      onMouseEnter={() => setHoveredCol(7)}
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {readOnly ? (
                        <span className="text-gray-800 font-semibold text-[12px]">{formatEntityList(assignment.newIncoming)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.newIncoming) ? assignment.newIncoming : (assignment.newIncoming ? [assignment.newIncoming] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'newIncoming', selected);
                          }}
                          className="w-full px-2.5 py-1.5 text-[12px] border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'newIncoming').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Cross-Training */}
                    <td
                      className={`px-2.5 py-2.5 text-center border border-gray-200 ${hoveredCol === 8 ? 'bg-emerald-50/70' : ''}`}
                      onMouseEnter={() => setHoveredCol(8)}
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {readOnly ? (
                        <span className="text-gray-800 font-semibold text-[12px]">{formatEntityList(assignment.crossTraining)}</span>
                      ) : (
                        <select
                          multiple
                          value={Array.isArray(assignment.crossTraining) ? assignment.crossTraining : (assignment.crossTraining ? [assignment.crossTraining] : [])}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            handleAssignmentChange(employee.id, 'crossTraining', selected);
                          }}
                          className="w-full px-2.5 py-1.5 text-[12px] border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                          size="1"
                        >
                          {getAvailableEntitiesForAssignment(employee.id, 'crossTraining').map(entity => (
                            <option key={entity.id} value={entity.name}>{entity.name}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Special Projects/Assignments */}
                    <td
                      className={`px-2.5 py-2.5 text-center border border-gray-200 ${hoveredCol === 9 ? 'bg-emerald-50/70' : ''}`}
                      onMouseEnter={() => setHoveredCol(9)}
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {readOnly ? (
                        <span className="text-gray-800 font-semibold text-[12px]">{formatEntityList(assignment.specialProjects)}</span>
                      ) : (
                        <input
                          type="text"
                          value={formatEntityList(assignment.specialProjects)}
                          onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[12px] border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center bg-white"
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

      {/* Save Button */}
      {!readOnly && hasChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
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
