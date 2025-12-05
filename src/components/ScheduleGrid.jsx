import { useState, useEffect } from 'react';
import { X, Check, Save, Download, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import EmployeeHistoryModal from './EmployeeHistoryModal';

export default function ScheduleGrid({ schedule, employees = [], entities = [], onSave, readOnly = false }) {
  const [assignments, setAssignments] = useState({});
  const [scheduleName, setScheduleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (schedule) {
      setAssignments(schedule.assignments || {});
      setScheduleName(schedule.name || '');
      setStartDate(schedule.startDate || '');
      setEndDate(schedule.endDate || '');
    }
  }, [schedule]);

  const darColumns = ['DAR 1', 'DAR 2', 'DAR 3', 'DAR 4', 'DAR 5', 'DAR 6'];

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
      return; // Can't assign DAR if not trained
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

  function handleSave() {
    if (onSave) {
      onSave({
        name: scheduleName,
        startDate,
        endDate,
        assignments
      });
      setHasChanges(false);
    }
  }

  function exportToExcel() {
    const data = employees.map(employee => {
      const assignment = assignments[employee.id] || {};
      const row = {
        'Employee Name': employee.name,
      };

      // DAR columns
      darColumns.forEach((dar, idx) => {
        const isDarTrained = employee.skills?.includes('DAR') || employee.skills?.includes('Float');
        if (isDarTrained) {
          row[dar] = assignment.dars?.includes(idx) ? 'X' : '';
        } else {
          row[dar] = 'N/A';
        }
      });

      row['Assignment'] = assignment.entity || '';
      row['Special Projects'] = assignment.specialProjects || '';
      row['3PM Email - Primary'] = assignment.email3pmPrimary ? 'X' : '';
      row['3PM Email - Backup'] = assignment.email3pmBackup ? 'X' : '';

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

  function canAssignTrace(employee) {
    return employee.skills?.includes('Trace') || employee.skills?.includes('Float');
  }

  function canAssignCPOE(employee) {
    return employee.skills?.includes('CPOE') || employee.skills?.includes('Float');
  }

  // Filter out archived employees
  const activeEmployees = employees.filter(e => !e.archived);

  return (
    <div className="space-y-6">
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
                className="input-field"
                placeholder="e.g., November-December 2024"
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
                className="input-field"
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
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              {hasChanges && (
                <span className="text-sm text-yellow-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportToExcel} className="btn-outline">
                <Download className="w-4 h-4 inline mr-2" />
                Export to Excel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`btn-primary ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="flex justify-end">
          <button onClick={exportToExcel} className="btn-outline">
            <Download className="w-4 h-4 inline mr-2" />
            Export to Excel
          </button>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto schedule-scroll">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-thr-blue-500 text-white">
              <tr>
                <th className="sticky left-0 bg-thr-blue-500 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider z-10">
                  Employee Name
                </th>
                {darColumns.map((dar, idx) => (
                  <th key={idx} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    {dar}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Assignment (Entity)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Special Projects
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider" colSpan="2">
                  3 PM Email
                </th>
              </tr>
              <tr className="bg-thr-blue-600">
                <th className="sticky left-0 bg-thr-blue-600 px-4 py-2"></th>
                {darColumns.map((_, idx) => (
                  <th key={idx}></th>
                ))}
                <th></th>
                <th></th>
                <th className="px-3 py-2 text-center text-xs font-semibold">Primary</th>
                <th className="px-3 py-2 text-center text-xs font-semibold">Backup</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeEmployees.map((employee, empIdx) => {
                const assignment = assignments[employee.id] || {};
                const isDarTrained = canAssignDAR(employee);

                return (
                  <tr key={employee.id} className={empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Employee Name */}
                    <td className="sticky left-0 bg-inherit px-4 py-3 whitespace-nowrap z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{employee.name}</span>
                        {!readOnly && (
                          <button
                            onClick={() => showEmployeeHistory(employee)}
                            className="text-thr-blue-500 hover:text-thr-blue-700"
                            title="View assignment history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {employee.skills?.join(', ') || 'No skills assigned'}
                      </div>
                    </td>

                    {/* DAR Columns */}
                    {darColumns.map((_, darIdx) => (
                      <td
                        key={darIdx}
                        className={`px-3 py-3 text-center ${
                          !isDarTrained ? 'bg-gray-200' : ''
                        }`}
                      >
                        {isDarTrained ? (
                          <button
                            onClick={() => handleDARToggle(employee.id, darIdx)}
                            disabled={readOnly}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              assignment.dars?.includes(darIdx)
                                ? 'bg-thr-green-500 text-white'
                                : 'border-2 border-gray-300 hover:border-thr-green-500'
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {assignment.dars?.includes(darIdx) && <Check className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    ))}

                    {/* Assignment (Entity) */}
                    <td className="px-4 py-3">
                      {readOnly ? (
                        <span className="text-gray-900">{assignment.entity || '-'}</span>
                      ) : (
                        <select
                          value={assignment.entity || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'entity', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select Entity</option>
                          {entities.map(entity => (
                            <option key={entity.id} value={entity.name}>
                              {entity.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Special Projects */}
                    <td className="px-4 py-3">
                      {readOnly ? (
                        <span className="text-gray-900">{assignment.specialProjects || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          value={assignment.specialProjects || ''}
                          onChange={(e) => handleAssignmentChange(employee.id, 'specialProjects', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent text-sm"
                          placeholder="Enter project..."
                        />
                      )}
                    </td>

                    {/* 3PM Email - Primary */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={assignment.email3pmPrimary || false}
                        onChange={(e) => handleAssignmentChange(employee.id, 'email3pmPrimary', e.target.checked)}
                        disabled={readOnly}
                        className="w-5 h-5 text-thr-blue-500 rounded focus:ring-thr-blue-500"
                      />
                    </td>

                    {/* 3PM Email - Backup */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={assignment.email3pmBackup || false}
                        onChange={(e) => handleAssignmentChange(employee.id, 'email3pmBackup', e.target.checked)}
                        disabled={readOnly}
                        className="w-5 h-5 text-thr-blue-500 rounded focus:ring-thr-blue-500"
                      />
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
