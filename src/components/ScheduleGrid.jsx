import { useState, useEffect } from 'react';
import { Save, Download, History, Edit2 } from 'lucide-react';
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

  useEffect(() => {
    if (schedule) {
      setAssignments(schedule.assignments || {});
      setScheduleName(schedule.name || '');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
      setDarEntities(schedule.darEntities || {});
    } else {
      // Load default DAR config for new schedules
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

  function handleDarEntityChange(darIndex, value) {
    setDarEntities(prev => ({
      ...prev,
      [darIndex]: value
    }));
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
      const row = {
        'TEAM MEMBER': employee.name,
      };

      darColumns.forEach((dar, idx) => {
        const isDarTrained = employee.skills?.includes('DAR') || employee.skills?.includes('Float');
        const entityName = darEntities[idx] || '';
        const columnName = entityName ? `${dar}\n${entityName}` : dar;

        if (isDarTrained) {
          row[columnName] = assignment.dars?.includes(idx) ? 'X' : '';
        } else {
          row[columnName] = '';
        }
      });

      row['Back up New incoming items'] = assignment.backupIncoming || '';
      row['CPOE'] = assignment.cpoe || '';
      row['New Incoming Items'] = assignment.newIncoming || '';
      row['Censa/Tracing'] = assignment.tracing || '';
      row['3PM EMAIL'] = assignment.email3pm || '';
      row['Special Projects / Assign'] = assignment.specialProjects || '';

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

  const activeEmployees = employees.filter(e => !e.archived);

  return (
    <div className="space-y-4">
      {/* Schedule Details */}
      {!readOnly && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Schedule Name</label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => {
                  setScheduleName(e.target.value);
                  setHasChanges(true);
                }}
                className="input-field text-base"
                placeholder="e.g., Sept and Oct 2025"
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHasChanges(true);
                }}
                className="input-field text-base"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHasChanges(true);
                }}
                className="input-field text-base"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              {hasChanges && (
                <span className="text-base text-yellow-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportToExcel} className="btn-outline text-base">
                <Download className="w-5 h-5 inline mr-2" />
                Export to Excel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`btn-primary text-base ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-5 h-5 inline mr-2" />
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{scheduleName}</h2>
            <p className="text-base text-gray-600">{startDate} to {endDate}</p>
          </div>
          <button onClick={exportToExcel} className="btn-outline text-base">
            <Download className="w-5 h-5 inline mr-2" />
            Export to Excel
          </button>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto schedule-scroll">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-600">
                <th className="sticky left-0 bg-blue-600 px-4 py-3 text-left text-sm font-bold text-white uppercase tracking-wider border border-gray-300 z-10 min-w-[160px]">
                  TEAM MEMBER
                </th>
                {darColumns.map((dar, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[120px]"
                  >
                    <div>{dar}</div>
                    <div className="text-xs font-normal mt-1.5 opacity-90">
                      {editingDar === idx && !readOnly ? (
                        <input
                          type="text"
                          value={darEntities[idx] || ''}
                          onChange={(e) => handleDarEntityChange(idx, e.target.value)}
                          onBlur={() => setEditingDar(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingDar(null);
                          }}
                          autoFocus
                          className="w-full px-1.5 py-1 text-xs text-gray-900 bg-white border-0 rounded focus:ring-2 focus:ring-white"
                          placeholder="e.g., THFR/FM"
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center gap-1 cursor-pointer hover:bg-blue-700 rounded px-1.5 py-1"
                          onClick={() => !readOnly && setEditingDar(idx)}
                        >
                          <span>{darEntities[idx] || 'Click to edit'}</span>
                          {!readOnly && <Edit2 className="w-3 h-3" />}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[140px]">
                  Back up New<br/>incoming items
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[110px]">
                  CPOE
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[140px]">
                  New Incoming<br/>Items
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[140px]">
                  Censa/Tracing
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[90px]">
                  3PM<br/>EMAIL
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase tracking-wider border border-gray-300 min-w-[160px]">
                  Special Projects /<br/>Assign
                </th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map((employee, empIdx) => {
                const assignment = assignments[employee.id] || {};
                const isDarTrained = canAssignDAR(employee);

                return (
                  <tr key={employee.id} className="hover:bg-blue-50">
                    {/* Employee Name */}
                    <td className="sticky left-0 bg-white px-4 py-3 border border-gray-300 z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-base text-blue-700 uppercase">
                          {employee.name}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => showEmployeeHistory(employee)}
                            className="text-gray-400 hover:text-blue-600"
                            title="View assignment history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* DAR Columns */}
                    {darColumns.map((_, darIdx) => (
                      <td
                        key={darIdx}
                        className={`px-4 py-3 text-center border border-gray-300 ${
                          !isDarTrained ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        {isDarTrained ? (
                          readOnly ? (
                            assignment.dars?.includes(darIdx) ? (
                              <span className="text-green-600 font-bold text-xl">X</span>
                            ) : null
                          ) : (
                            <input
                              type="checkbox"
                              checked={assignment.dars?.includes(darIdx) || false}
                              onChange={() => handleDARToggle(employee.id, darIdx)}
                              className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                            />
                          )
                        ) : null}
                      </td>
                    ))}

                    {/* Back up New incoming items */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-blue-600 font-medium">{assignment.backupIncoming || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.backupIncoming || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'backupIncoming', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
                          placeholder=""
                        />
                      )}
                    </td>

                    {/* CPOE */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-blue-600 font-medium">{assignment.cpoe || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.cpoe || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'cpoe', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
                          placeholder=""
                        />
                      )}
                    </td>

                    {/* New Incoming Items */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-blue-600 font-medium">{assignment.newIncoming || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.newIncoming || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'newIncoming', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
                          placeholder=""
                        />
                      )}
                    </td>

                    {/* Censa/Tracing */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-blue-600 font-medium">{assignment.tracing || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.tracing || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'tracing', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
                          placeholder=""
                        />
                      )}
                    </td>

                    {/* 3PM EMAIL */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-pink-600 font-bold">{assignment.email3pm || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.email3pm || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'email3pm', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
                          placeholder=""
                        />
                      )}
                    </td>

                    {/* Special Projects / Assign */}
                    <td className="px-3 py-3 border border-gray-300 bg-white">
                      {readOnly ? (
                        <span className="text-base text-pink-600 font-medium">{assignment.specialProjects || ''}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.specialProjects || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                          className="w-full px-2 py-1.5 text-base border-0 focus:ring-1 focus:ring-blue-500 text-center"
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
              <p className="text-base">No employees found. Add employees first to create a schedule.</p>
            </div>
          )}
        </div>
      </div>

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
