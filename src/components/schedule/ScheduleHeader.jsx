import { memo } from 'react';
import PropTypes from 'prop-types';
import { History, Settings, FileDown, Plus, Eye, Undo, Redo, Users, Maximize, Minimize, BarChart3 } from 'lucide-react';
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
  scheduleStatus,
  selectedCount = 0,
  onBulkAssign,
  isFullscreen = false,
  onToggleFullscreen,
  onViewProductivity
}) {
  return (
    <div className="bg-white dark:bg-slate-800 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {readOnly ? 'Published Schedule' : 'Schedule Builder'}
            </h1>
          </div>
          {!readOnly && (
            <AutoSaveIndicator
              isSaving={isSaving}
              lastSaved={lastSaved}
              error={autoSaveError}
            />
          )}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {/* Bulk Assignment button */}
            {selectedCount > 0 && onBulkAssign && (
              <button
                onClick={onBulkAssign}
                className="px-3 py-1.5 bg-thr-blue-600 hover:bg-thr-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors"
                aria-label={`Bulk assign ${selectedCount} selected employee${selectedCount > 1 ? 's' : ''}`}
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>Bulk ({selectedCount})</span>
              </button>
            )}

            {/* Undo/Redo buttons - Compact */}
            <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`px-2 py-1.5 transition-colors border-r border-slate-200 dark:border-slate-600 ${
                  canUndo
                    ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Undo (Ctrl+Z)"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`px-2 py-1.5 transition-colors ${
                  canRedo
                    ? 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Redo (Ctrl+Y)"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <button
              onClick={onShowHistory}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              aria-label="Show history"
              title="Show assignment history"
            >
              <History className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={onExport}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors"
              aria-label="Export to Excel"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                aria-label={isFullscreen ? "Exit focus mode" : "Enter focus mode"}
                title={isFullscreen ? "Exit focus mode (ESC)" : "Enter focus mode (F11)"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Maximize className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Status indicators */}
            <div className={`btn-pill flex items-center gap-1.5 cursor-default ${
              scheduleStatus === 'published'
                ? 'bg-thr-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}>
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>{scheduleStatus === 'published' ? 'Published' : 'Draft'}</span>
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
  scheduleStatus: PropTypes.oneOf(['draft', 'published']),
  selectedCount: PropTypes.number,
  onBulkAssign: PropTypes.func,
  isFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func,
  onViewProductivity: PropTypes.func
};

export default memo(ScheduleHeader);
