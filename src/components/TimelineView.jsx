import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';

/**
 * Timeline View - Horizontal scrolling timeline with assignments as colored bars
 * 
 * Phase 2 Advanced UI Feature:
 * - Horizontal gantt-style layout
 * - Each employee is a row
 * - Assignments displayed as pill-shaped bars
 * - Smooth scroll
 * - Sticky employee name column
 * - Role-specific colors
 * - Tooltips with assignment details
 */
export default function TimelineView({
  employees = [],
  assignments = {},
  startDate,
  endDate,
  onAssignmentClick,
}) {
  const scrollContainerRef = useRef(null);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Role colors matching the design system
  const roleColors = {
    DAR: 'bg-role-dar',
    CR: 'bg-role-cr',
    CPOE: 'bg-role-cpoe',
    Fax: 'bg-role-fax',
    Float: 'bg-role-float',
    Email: 'bg-role-email',
    Incoming: 'bg-role-incoming',
  };

  // Generate date columns for the timeline
  const generateDateColumns = () => {
    const dates = [];
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks default

    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dateColumns = generateDateColumns();

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Handle mouse hover for tooltip
  const handleMouseEnter = (e, assignment, employee) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredAssignment({ ...assignment, employeeName: employee.name });
  };

  const handleMouseLeave = () => {
    setHoveredAssignment(null);
  };

  const activeEmployees = employees.filter(e => !e.archived);

  return (
    <div className="card animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-thr-blue-500/10 to-thr-green-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-thr-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline View</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {startDate && endDate ? `${startDate} to ${endDate}` : 'Schedule Overview'}
            </p>
          </div>
        </div>
        
        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="relative overflow-hidden">
        <div className="flex">
          {/* Sticky Employee Names Column */}
          <div className="flex-shrink-0 w-40 border-r border-slate-200 dark:border-slate-700 z-10 bg-white dark:bg-slate-800">
            {/* Header Cell */}
            <div className="h-12 px-3 flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Team Member
              </span>
            </div>
            
            {/* Employee Names */}
            {activeEmployees.map((employee, idx) => (
              <div
                key={employee.id}
                className={`h-14 px-3 flex items-center border-b border-slate-100 dark:border-slate-700 ${
                  idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {employee.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable Timeline Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto schedule-scroll"
          >
            <div className="min-w-max">
              {/* Date Headers */}
              <div className="flex h-12 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {dateColumns.map((date, idx) => (
                  <div
                    key={idx}
                    className={`w-24 flex-shrink-0 px-2 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-700 ${
                      date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {date.getDate()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Employee Rows with Assignment Bars */}
              {activeEmployees.map((employee, empIdx) => {
                const empAssignment = assignments[employee.id] || {};
                
                return (
                  <div
                    key={employee.id}
                    className={`flex h-14 border-b border-slate-100 dark:border-slate-700 ${
                      empIdx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    {dateColumns.map((date, dateIdx) => {
                      // Mock assignment bar (in real implementation, check actual assignments)
                      const hasDAR = empAssignment.dars?.length > 0 && dateIdx % 3 === 0;
                      const hasCPOE = empAssignment.cpoe && dateIdx % 4 === 1;
                      
                      return (
                        <div
                          key={dateIdx}
                          className={`w-24 flex-shrink-0 px-1 py-1 border-r border-slate-100 dark:border-slate-700 relative ${
                            date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50 dark:bg-slate-700/30' : ''
                          }`}
                        >
                          {hasDAR && (
                            <div
                              className={`absolute left-1 right-1 top-2 h-4 ${roleColors.DAR} rounded-full shadow-soft cursor-pointer hover:shadow-soft-md transition-all duration-150 hover:scale-105`}
                              onMouseEnter={(e) => handleMouseEnter(e, { role: 'DAR', date: formatShortDate(date) }, employee)}
                              onMouseLeave={handleMouseLeave}
                              onClick={() => onAssignmentClick?.({ employee, role: 'DAR', date })}
                            />
                          )}
                          {hasCPOE && (
                            <div
                              className={`absolute left-1 right-1 bottom-2 h-4 ${roleColors.CPOE} rounded-full shadow-soft cursor-pointer hover:shadow-soft-md transition-all duration-150 hover:scale-105`}
                              onMouseEnter={(e) => handleMouseEnter(e, { role: 'CPOE', date: formatShortDate(date) }, employee)}
                              onMouseLeave={handleMouseLeave}
                              onClick={() => onAssignmentClick?.({ employee, role: 'CPOE', date })}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Legend:
          </span>
          {Object.entries(roleColors).map(([role, color]) => (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-4 h-3 ${color} rounded-full`} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredAssignment && (
        <div
          className="fixed z-50 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg shadow-soft-lg transform -translate-x-1/2 -translate-y-full pointer-events-none animate-fade-in-up"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <p className="font-semibold">{hoveredAssignment.employeeName}</p>
          <p className="text-slate-300 dark:text-slate-400">
            {hoveredAssignment.role} - {hoveredAssignment.date}
          </p>
        </div>
      )}

      {/* Empty State */}
      {activeEmployees.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No employees to display</p>
        </div>
      )}
    </div>
  );
}
