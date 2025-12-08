import { memo } from 'react';
import PropTypes from 'prop-types';
import { History, Settings, FileDown, Plus, Eye, Undo, Redo } from 'lucide-react';
import AutoSaveIndicator from '../AutoSaveIndicator';

/**
 * ScheduleHeader component
 * Displays action buttons, status indicators, and auto-save status
 */
function ScheduleHeader({
  readOnly,
  isSaving,
  lastSaved,
  autoSaveError,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCreateNewSchedule,
  onShowHistory,
  onExport,
  scheduleStatus
}) {
  return (
    <div className="bg-white dark:bg-slate-800 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-soft">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-slate-900 dark:text-slate-100">Schedule Builder</h1>
          <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
            Click any cell to assign • Click DAR info icon for history
          </p>
          <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden">
            Tap to assign
          </p>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Auto-save indicator */}
            <AutoSaveIndicator 
              isSaving={isSaving}
              lastSaved={lastSaved}
              error={autoSaveError}
            />

            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`btn-pill flex items-center gap-1.5 shadow-soft transition-all ${
                  canUndo
                    ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:shadow-soft-md'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Undo (Ctrl+Z)"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`btn-pill flex items-center gap-1.5 shadow-soft transition-all ${
                  canRedo
                    ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:shadow-soft-md'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Redo (Ctrl+Y)"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Redo</span>
              </button>
            </div>
            
            {onCreateNewSchedule && (
              <button
                className="btn-pill bg-thr-green-500 hover:bg-thr-green-600 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
                aria-label="Create new schedule"
                onClick={onCreateNewSchedule}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">New Schedule</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
            
            <button
              onClick={onShowHistory}
              className="btn-pill bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
              aria-label="Show history"
            >
              <History className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Show History</span>
            </button>
            
            <button
              className="btn-pill bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
              aria-label="Configuration"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Config</span>
            </button>

            <button
              onClick={onExport}
              className="btn-pill bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-soft hover:shadow-soft-md transition-all"
              aria-label="Export to Excel"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Status indicators */}
            <div className={`btn-pill flex items-center gap-1.5 cursor-default ${
              scheduleStatus === 'published'
                ? 'bg-thr-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}>
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>{scheduleStatus === 'published' ? 'Published' : 'Unpublish (Draft)'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ScheduleHeader.propTypes = {
  readOnly: PropTypes.bool,
  isSaving: PropTypes.bool,
  lastSaved: PropTypes.instanceOf(Date),
  autoSaveError: PropTypes.object,
  canUndo: PropTypes.bool,
  canRedo: PropTypes.bool,
  onUndo: PropTypes.func,
  onRedo: PropTypes.func,
  onCreateNewSchedule: PropTypes.func,
  onShowHistory: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  scheduleStatus: PropTypes.oneOf(['draft', 'published'])
};

export default memo(ScheduleHeader);
