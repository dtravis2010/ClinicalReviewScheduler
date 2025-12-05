import { Undo2, Trash2, Zap } from 'lucide-react';

/**
 * Quick-Assign Toolbar - Floating toolbar above the grid with shortcuts
 * 
 * Features:
 * - Glossy pill buttons for common actions
 * - Role-specific quick assignment buttons
 * - Clear and Undo actions
 * - Floats with shadow + rounded corners
 */
export default function QuickAssignToolbar({
  onAssignDAR,
  onAssignCR,
  onAssignCPOE,
  onClearCell,
  onUndo,
  visible = true,
  hasSelection = false,
  canUndo = false,
}) {
  if (!visible) return null;

  const roleButtons = [
    { id: 'dar', label: 'DAR', color: 'bg-role-dar', onClick: onAssignDAR },
    { id: 'cr', label: 'CR', color: 'bg-role-cr', onClick: onAssignCR },
    { id: 'cpoe', label: 'CPOE', color: 'bg-role-cpoe', onClick: onAssignCPOE },
  ];

  return (
    <div className="floating-toolbar">
      {/* Quick Actions Label */}
      <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-600">
        <Zap className="w-4 h-4 text-thr-blue-500" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Quick Assign</span>
      </div>

      {/* Role Assignment Buttons */}
      <div className="flex items-center gap-2">
        {roleButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            disabled={!hasSelection}
            className={`btn-pill text-white ${btn.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-600" />

      {/* Clear Cell Button */}
      <button
        onClick={onClearCell}
        disabled={!hasSelection}
        className="btn-pill bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Clear
      </button>

      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="btn-pill bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Undo2 className="w-4 h-4" />
        Undo
      </button>
    </div>
  );
}
