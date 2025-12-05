import { useState, useRef, useEffect } from 'react';
import { User, Clock, FileText } from 'lucide-react';

/**
 * HoverCard - Popover that appears when hovering over a schedule cell
 * 
 * Features:
 * - Employee photo placeholder
 * - Last 3 assignments
 * - Quick notes
 * - Smooth fade-in animation
 */
export default function HoverCard({
  employee,
  assignments = [],
  notes,
  position = { x: 0, y: 0 },
  isVisible = false,
}) {
  const cardRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep card in viewport
  useEffect(() => {
    if (!isVisible || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Prevent overflow on right edge
    if (position.x + rect.width > viewportWidth - 20) {
      adjustedX = viewportWidth - rect.width - 20;
    }

    // Prevent overflow on bottom edge
    if (position.y + rect.height > viewportHeight - 20) {
      adjustedY = position.y - rect.height - 10;
    }

    // Prevent overflow on left edge
    if (adjustedX < 20) {
      adjustedX = 20;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [position, isVisible]);

  if (!isVisible) return null;

  // Get last 3 assignments for display
  const recentAssignments = assignments.slice(0, 3);

  return (
    <div
      ref={cardRef}
      className="hover-card min-w-[280px] max-w-[320px] pointer-events-none"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header with Employee Info */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center shadow-soft">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {employee?.name || 'Employee'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employee?.skills?.join(', ') || 'No skills'}
          </p>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-thr-blue-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Last 3 Assignments
          </span>
        </div>
        <div className="space-y-2">
          {recentAssignments.length > 0 ? (
            recentAssignments.map((assignment, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${
                  assignment.role === 'DAR' ? 'bg-role-dar' :
                  assignment.role === 'CR' ? 'bg-role-cr' :
                  assignment.role === 'CPOE' ? 'bg-role-cpoe' :
                  'bg-slate-400'
                }`} />
                <span className="text-slate-600 dark:text-slate-300">
                  {assignment.role} - {assignment.entity}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  {assignment.date}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              No recent assignments
            </p>
          )}
        </div>
      </div>

      {/* Quick Notes */}
      {notes && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-thr-blue-500" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Notes
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {notes}
          </p>
        </div>
      )}
    </div>
  );
}
