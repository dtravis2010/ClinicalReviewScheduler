import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';

/**
 * Workload Heat Map
 * 2D visualization of workload distribution across employees and time periods
 *
 * Features:
 * - Color-coded cells (white=low, green=balanced, yellow=high, red=overloaded)
 * - Hover tooltips with assignment breakdown
 * - Click cells to see details
 * - Identify burnout risks and imbalances at a glance
 */

const WorkloadHeatMap = ({
  schedules = [],
  employees = [],
  onCellClick,
  maxPeriods = 12,
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calculate workload score for an assignment
  const calculateWorkloadScore = (assignment) => {
    if (!assignment) return 0;

    let score = 0;
    score += (assignment.dars?.length || 0) * 3;
    score += (assignment.newIncoming?.length || 0) * 2;
    score += (assignment.crossTraining?.length || 0) * 1.5;
    score += assignment.cpoe ? 2 : 0;
    score += assignment.specialProjects ? 1 : 0;

    return score;
  };

  // Build workload matrix
  const workloadMatrix = useMemo(() => {
    const matrix = {};
    const periodsList = schedules.slice(-maxPeriods).reverse(); // Most recent first

    employees.forEach(emp => {
      if (emp.archived) return;

      matrix[emp.id] = {
        employee: emp,
        periods: periodsList.map(schedule => {
          const assignment = schedule.assignments?.[emp.id];
          const workloadScore = calculateWorkloadScore(assignment);

          return {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            date: schedule.startDate,
            score: workloadScore,
            assignment,
          };
        }),
      };
    });

    return matrix;
  }, [schedules, employees, maxPeriods]);

  // Calculate statistics
  const stats = useMemo(() => {
    const allScores = Object.values(workloadMatrix)
      .flatMap(emp => emp.periods.map(p => p.score))
      .filter(score => score > 0);

    if (allScores.length === 0) {
      return { avg: 0, min: 0, max: 0, stdDev: 0 };
    }

    const avg = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
    const min = Math.min(...allScores);
    const max = Math.max(...allScores);

    const variance = allScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / allScores.length;
    const stdDev = Math.sqrt(variance);

    return { avg, min, max, stdDev };
  }, [workloadMatrix]);

  // Get color for workload score
  const getColor = (score) => {
    if (score === 0) return 'bg-white dark:bg-slate-900';

    const { avg } = stats;
    if (avg === 0) return 'bg-blue-100 dark:bg-blue-900';

    const ratio = score / avg;

    if (ratio > 1.5) return 'bg-red-500 text-white'; // Critically overloaded
    if (ratio > 1.3) return 'bg-red-400 text-white'; // Overloaded
    if (ratio > 1.1) return 'bg-orange-400 text-white'; // High
    if (ratio > 0.9) return 'bg-green-400 text-white'; // Balanced
    if (ratio > 0.7) return 'bg-green-300'; // Below average
    if (ratio > 0.5) return 'bg-green-200'; // Low
    return 'bg-green-100'; // Very low
  };

  // Get tooltip content
  const getTooltipContent = (empId, periodIdx) => {
    const empData = workloadMatrix[empId];
    if (!empData) return null;

    const period = empData.periods[periodIdx];
    if (!period) return null;

    const assignment = period.assignment;
    if (!assignment) {
      return {
        employee: empData.employee.name,
        period: period.scheduleName,
        score: 0,
        details: ['No assignments'],
      };
    }

    const details = [];
    if (assignment.dars?.length > 0) {
      details.push(`DARs: ${assignment.dars.length} (${assignment.dars.length * 3} pts)`);
    }
    if (assignment.newIncoming?.length > 0) {
      details.push(`New Incoming: ${assignment.newIncoming.length} (${assignment.newIncoming.length * 2} pts)`);
    }
    if (assignment.crossTraining?.length > 0) {
      details.push(`Cross-Training: ${assignment.crossTraining.length} (${assignment.crossTraining.length * 1.5} pts)`);
    }
    if (assignment.cpoe) {
      details.push('CPOE: Yes (2 pts)');
    }
    if (assignment.specialProjects) {
      details.push('Special Projects: Yes (1 pt)');
    }

    return {
      employee: empData.employee.name,
      period: period.scheduleName,
      score: period.score,
      details,
      avgCompare: stats.avg > 0 ? ((period.score / stats.avg - 1) * 100).toFixed(0) : 0,
    };
  };

  const handleCellHover = (empId, periodIdx, event) => {
    const content = getTooltipContent(empId, periodIdx);
    if (!content) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredCell({ empId, periodIdx, content });
  };

  const handleCellClick = (empId, periodIdx) => {
    const empData = workloadMatrix[empId];
    if (!empData) return;

    const period = empData.periods[periodIdx];
    if (!period || !onCellClick) return;

    onCellClick({
      employee: empData.employee,
      schedule: {
        id: period.scheduleId,
        name: period.scheduleName,
      },
      assignment: period.assignment,
      workload: period.score,
    });
  };

  const employeeList = Object.values(workloadMatrix);
  const periods = employeeList[0]?.periods || [];

  if (employeeList.length === 0 || periods.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          No schedule data available for heat map
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Workload Heat Map
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Visual representation of workload distribution across time periods
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Average</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats.avg.toFixed(1)}
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Minimum</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.min.toFixed(1)}
          </div>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Maximum</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.max.toFixed(1)}
          </div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Std Dev</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.stdDev.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white dark:bg-slate-900 border border-slate-300 rounded"></div>
            <span className="text-slate-600 dark:text-slate-400">No load</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span className="text-slate-600 dark:text-slate-400">Balanced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span className="text-slate-600 dark:text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-slate-600 dark:text-slate-400">Overloaded</span>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 text-left border-b-2 border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Employee
                  </span>
                </th>
                {periods.map((period, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-3 text-center border-b-2 border-slate-200 dark:border-slate-700 min-w-[80px]"
                  >
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {period.scheduleName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {period.date}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employeeList.map(empData => (
                <tr key={empData.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {empData.employee.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {empData.employee.skills?.join(', ')}
                    </div>
                  </td>

                  {empData.periods.map((period, periodIdx) => (
                    <td
                      key={periodIdx}
                      className="border-b border-slate-200 dark:border-slate-700 p-1"
                    >
                      <div
                        className={`h-16 rounded cursor-pointer transition-all hover:ring-2 hover:ring-thr-blue-500 flex items-center justify-center font-bold ${getColor(period.score)}`}
                        onMouseEnter={(e) => handleCellHover(empData.employee.id, periodIdx, e)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(empData.employee.id, periodIdx)}
                      >
                        {period.score > 0 && (
                          <span className="text-sm">
                            {period.score.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-soft-xl pointer-events-none animate-fadeIn"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold mb-2">
            {hoveredCell.content.employee} - {hoveredCell.content.period}
          </div>

          <div className="space-y-1 mb-2">
            {hoveredCell.content.details.map((detail, idx) => (
              <div key={idx} className="text-sm opacity-90">
                {detail}
              </div>
            ))}
          </div>

          <div className="text-sm pt-2 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span>Total Score:</span>
              <span className="font-bold">{hoveredCell.content.score.toFixed(1)}</span>
            </div>
            {hoveredCell.content.avgCompare !== 0 && (
              <div className="flex items-center justify-between mt-1">
                <span>vs. Average:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  hoveredCell.content.avgCompare > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {hoveredCell.content.avgCompare > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(hoveredCell.content.avgCompare)}%
                </span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div
            className="absolute left-1/2 bottom-0 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"
            style={{ transform: 'translate(-50%, 100%)' }}
          />
        </div>
      )}
    </div>
  );
};

WorkloadHeatMap.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    assignments: PropTypes.object,
  })).isRequired,
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCellClick: PropTypes.func,
  maxPeriods: PropTypes.number,
};

export default WorkloadHeatMap;
