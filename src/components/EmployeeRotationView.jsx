import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  calculateEmployeeRotation,
  sortByRotationPriority,
  getRotationStatusBadge,
  formatDateRange,
  daysSince
} from '../utils/rotationAnalysis';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  Info
} from 'lucide-react';
import { logger } from '../utils/logger';

export default function EmployeeRotationView({ employees, schedules, lookbackLimit = 10, compact = false }) {
  const [sortField, setSortField] = useState('rotationScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSkill, setFilterSkill] = useState('all');

  // Calculate rotation data for all employees
  const employeesWithRotation = useMemo(() => {
    logger.info(`Calculating rotation for ${employees.length} employees across ${schedules.length} schedules`);
    return calculateEmployeeRotation(employees, schedules, lookbackLimit);
  }, [employees, schedules, lookbackLimit]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employeesWithRotation;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.rotationData.rotationStatus === filterStatus);
    }

    // Filter by skill
    if (filterSkill !== 'all') {
      filtered = filtered.filter(emp =>
        emp.skills && emp.skills.includes(filterSkill)
      );
    }

    // Filter out archived employees
    filtered = filtered.filter(emp => !emp.archived);

    return filtered;
  }, [employeesWithRotation, filterStatus, filterSkill]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'rotationScore':
          aVal = a.rotationData.rotationScore;
          bVal = b.rotationData.rotationScore;
          break;
        case 'lastDar':
          aVal = a.rotationData.schedulesSinceLastDar ?? 999;
          bVal = b.rotationData.schedulesSinceLastDar ?? 999;
          break;
        case 'lastNewIncoming':
          aVal = a.rotationData.schedulesSinceLastNewIncoming ?? 999;
          bVal = b.rotationData.schedulesSinceLastNewIncoming ?? 999;
          break;
        case 'totalAssignments':
          aVal = a.rotationData.totalAssignmentCount;
          bVal = b.rotationData.totalAssignmentCount;
          break;
        default:
          aVal = a.rotationData.rotationScore;
          bVal = b.rotationData.rotationScore;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [filteredEmployees, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {sortByRotationPriority(employeesWithRotation).slice(0, 5).map(emp => {
          const badge = getRotationStatusBadge(emp.rotationData.rotationStatus);
          return (
            <div
              key={emp.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{emp.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {emp.rotationData.rotationScore}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Employee Rotation Tracker
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analyzing last {lookbackLimit} published schedules • {filteredEmployees.length} employees
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">How Rotation Scoring Works</p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• <strong>Rotation Score (0-100)</strong>: Higher scores = more due for assignment</li>
              <li>• <strong>🔴 Never Assigned</strong>: Employee has never been assigned</li>
              <li>• <strong>🟠 Overdue</strong>: Not assigned in 4+ schedules</li>
              <li>• <strong>🟡 Due</strong>: Not assigned in 2-3 schedules</li>
              <li>• <strong>🟢 Recent</strong>: Assigned in last 1-2 schedules</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="never-assigned">Never Assigned</option>
            <option value="overdue">Overdue</option>
            <option value="due">Due</option>
            <option value="recent">Recent</option>
          </select>
        </div>

        <div>
          <label htmlFor="skill-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Skill
          </label>
          <select
            id="skill-filter"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-thr-blue-500 focus:border-transparent"
          >
            <option value="all">All Skills</option>
            <option value="DAR">DAR</option>
            <option value="Trace">Trace</option>
            <option value="CPOE">CPOE</option>
            <option value="Float">Float</option>
          </select>
        </div>

        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterSkill('all');
            setSortField('rotationScore');
            setSortDirection('desc');
          }}
          className="mt-6 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Rotation Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('rotationScore')}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Score
                  <SortIcon field="rotationScore" />
                </div>
              </th>
              <th className="px-4 py-3 text-center">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('lastDar')}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Last DAR
                  <SortIcon field="lastDar" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('lastNewIncoming')}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Last New Incoming
                  <SortIcon field="lastNewIncoming" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('totalAssignments')}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total
                  <SortIcon field="totalAssignments" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {sortedEmployees.length > 0 ? (
              sortedEmployees.map((emp) => {
                const { rotationData } = emp;
                const badge = getRotationStatusBadge(rotationData.rotationStatus);

                return (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {/* Employee Name */}
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{emp.name}</p>
                        {emp.skills && emp.skills.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {emp.skills.join(', ')}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Rotation Score */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {rotationData.rotationScore}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        <span>{badge.icon}</span>
                        {badge.label}
                      </span>
                    </td>

                    {/* Last DAR Assignment */}
                    <td className="px-4 py-4">
                      {rotationData.lastDarAssignment ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {rotationData.schedulesSinceLastDar === 0 ? 'Current' : `${rotationData.schedulesSinceLastDar} schedule${rotationData.schedulesSinceLastDar > 1 ? 's' : ''} ago`}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {rotationData.lastDarAssignment.entityCount} entit{rotationData.lastDarAssignment.entityCount === 1 ? 'y' : 'ies'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {rotationData.lastDarAssignment.startDate}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-600 italic">Never assigned</span>
                      )}
                    </td>

                    {/* Last New Incoming Assignment */}
                    <td className="px-4 py-4">
                      {rotationData.lastNewIncomingAssignment ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {rotationData.schedulesSinceLastNewIncoming === 0 ? 'Current' : `${rotationData.schedulesSinceLastNewIncoming} schedule${rotationData.schedulesSinceLastNewIncoming > 1 ? 's' : ''} ago`}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {rotationData.lastNewIncomingAssignment.entityCount} entit{rotationData.lastNewIncomingAssignment.entityCount === 1 ? 'y' : 'ies'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {rotationData.lastNewIncomingAssignment.startDate}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-600 italic">Never assigned</span>
                      )}
                    </td>

                    {/* Total Assignments */}
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {rotationData.totalAssignmentCount}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                          <p>DAR: {rotationData.totalDarCount}</p>
                          <p>New: {rotationData.totalNewIncomingCount}</p>
                          <p>Cross: {rotationData.totalCrossTrainingCount}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No employees match your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {employeesWithRotation.filter(e => e.rotationData.rotationStatus === 'never-assigned').length}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">Never Assigned</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {employeesWithRotation.filter(e => e.rotationData.rotationStatus === 'overdue').length}
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Overdue</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {employeesWithRotation.filter(e => e.rotationData.rotationStatus === 'due').length}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Due</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {employeesWithRotation.filter(e => e.rotationData.rotationStatus === 'recent').length}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Recent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

EmployeeRotationView.propTypes = {
  employees: PropTypes.array.isRequired,
  schedules: PropTypes.array.isRequired,
  lookbackLimit: PropTypes.number,
  compact: PropTypes.bool
};
