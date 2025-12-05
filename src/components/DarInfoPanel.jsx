import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  UserCheck, 
  UserX,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

/**
 * DAR Info Panel - Shows historical information about a DAR when editing
 * 
 * Displays:
 * - Who has worked this DAR before (with frequency)
 * - Who has never been assigned to this DAR
 * - Productivity data (if available)
 * - Assignment history timeline
 */
export default function DarInfoPanel({ 
  darIndex, 
  darName, 
  darEntities, 
  employees = [], 
  currentAssignments = {},
  schedules = [],
  onClose,
  isOpen = true
}) {
  const [historyData, setHistoryData] = useState({
    assignmentCounts: {},
    neverAssigned: [],
    recentHistory: [],
    loading: true
  });
  const [expandedSection, setExpandedSection] = useState('assigned');

  useEffect(() => {
    if (isOpen) {
      analyzeHistoricalData();
    }
  }, [darIndex, schedules, employees, isOpen]);

  function analyzeHistoricalData() {
    // Count how many times each employee has been assigned to this DAR
    const assignmentCounts = {};
    const recentHistory = [];

    // Initialize all employees with 0 counts
    employees.forEach(emp => {
      if (!emp.archived) {
        assignmentCounts[emp.id] = {
          name: emp.name,
          count: 0,
          lastAssigned: null,
          skills: emp.skills || []
        };
      }
    });

    // Analyze published schedules for this DAR
    schedules
      .filter(s => s.status === 'published')
      .forEach(schedule => {
        const assignments = schedule.assignments || {};
        
        Object.entries(assignments).forEach(([empId, assignment]) => {
          if (assignment.dars?.includes(darIndex)) {
            if (assignmentCounts[empId]) {
              assignmentCounts[empId].count++;
              if (!assignmentCounts[empId].lastAssigned || 
                  new Date(schedule.startDate) > new Date(assignmentCounts[empId].lastAssigned)) {
                assignmentCounts[empId].lastAssigned = schedule.startDate;
              }
            }

            // Add to recent history
            recentHistory.push({
              employeeId: empId,
              employeeName: assignmentCounts[empId]?.name || 'Unknown',
              scheduleName: schedule.name,
              startDate: schedule.startDate,
              endDate: schedule.endDate
            });
          }
        });
      });

    // Find employees who have never been assigned to this DAR
    const neverAssigned = Object.entries(assignmentCounts)
      .filter(([_, data]) => data.count === 0 && (data.skills.includes('DAR') || data.skills.includes('Float')))
      .map(([id, data]) => ({ id, ...data }));

    // Sort by count (descending) for frequently assigned
    const sortedAssigned = Object.entries(assignmentCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    // Sort recent history by date (most recent first)
    recentHistory.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    setHistoryData({
      assignmentCounts: sortedAssigned,
      neverAssigned,
      recentHistory: recentHistory.slice(0, 10), // Last 10 assignments
      loading: false
    });
  }

  // Get currently assigned employees for this DAR
  const currentlyAssigned = Object.entries(currentAssignments)
    .filter(([_, assignment]) => assignment.dars?.includes(darIndex))
    .map(([empId]) => {
      const emp = employees.find(e => e.id === empId);
      return emp?.name || 'Unknown';
    });

  if (!isOpen) return null;

  const entityDisplay = Array.isArray(darEntities) 
    ? darEntities.join(' / ') 
    : darEntities || 'Not configured';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-thr-blue-500 to-thr-blue-600 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{darName} Info</h2>
              <p className="text-white/80 text-sm mt-1">{entityDisplay}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyData.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-thr-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Current Assignment */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-thr-green-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Current Schedule</h3>
              </div>
              {currentlyAssigned.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentlyAssigned.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-thr-green-100 dark:bg-thr-green-900/30 text-thr-green-700 dark:text-thr-green-300 text-sm font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No one assigned yet</p>
              )}
            </div>

            {/* Frequently Assigned Section */}
            <div className="card">
              <button
                onClick={() => setExpandedSection(expandedSection === 'assigned' ? '' : 'assigned')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-thr-blue-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Previously Assigned ({historyData.assignmentCounts.length})
                  </h3>
                </div>
                {expandedSection === 'assigned' ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {expandedSection === 'assigned' && (
                <div className="mt-4 space-y-2">
                  {historyData.assignmentCounts.length > 0 ? (
                    historyData.assignmentCounts.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {emp.name}
                          </p>
                          {emp.lastAssigned && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Last: {emp.lastAssigned}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-700 dark:text-thr-blue-300 text-xs font-bold">
                            {emp.count}x
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No historical assignments found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Never Assigned Section */}
            <div className="card">
              <button
                onClick={() => setExpandedSection(expandedSection === 'never' ? '' : 'never')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Never Assigned ({historyData.neverAssigned.length})
                  </h3>
                </div>
                {expandedSection === 'never' ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {expandedSection === 'never' && (
                <div className="mt-4">
                  {historyData.neverAssigned.length > 0 ? (
                    <div className="space-y-2">
                      {historyData.neverAssigned.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Skills: {emp.skills.join(', ') || 'None'}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">
                            New to DAR
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      All DAR-trained employees have been assigned at least once
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recent History Timeline */}
            <div className="card">
              <button
                onClick={() => setExpandedSection(expandedSection === 'history' ? '' : 'history')}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Recent History
                  </h3>
                </div>
                {expandedSection === 'history' ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {expandedSection === 'history' && (
                <div className="mt-4">
                  {historyData.recentHistory.length > 0 ? (
                    <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-600 space-y-4">
                      {historyData.recentHistory.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-thr-blue-500" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {item.employeeName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.scheduleName}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {item.startDate} - {item.endDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No historical data available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-thr-blue-500" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-xl shadow-soft">
                  <p className="text-2xl font-bold text-thr-blue-600 dark:text-thr-blue-400">
                    {historyData.assignmentCounts.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Employees with experience</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-xl shadow-soft">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {historyData.neverAssigned.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Need training exposure</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </>
  );
}
