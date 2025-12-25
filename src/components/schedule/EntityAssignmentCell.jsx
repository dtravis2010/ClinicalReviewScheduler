import { memo, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getEntityShortCode, formatEntityList } from '../../utils/scheduleUtils';
import { formatHistoryDate } from '../../utils/entityHistory';

/**
 * Reusable cell component for entity-based assignments (New Incoming, Cross-Training)
 * Handles display, editing popup, and entity selection
 */
function EntityAssignmentCell({
  employee,
  field,
  assignment,
  availableEntities,
  entityHistory,
  readOnly,
  blocked,
  blockMessage,
  isEditing,
  onStartEdit,
  onEndEdit,
  onToggle,
  cellId,
  useKeyboardNav = false,
  isFocused = false
}) {
  const currentValues = assignment?.[field] || [];
  const currentArray = Array.isArray(currentValues) ? currentValues : (currentValues ? [currentValues] : []);
  const hasAssignments = currentArray.length > 0;

  const handleCellClick = () => {
    if (!readOnly) {
      onStartEdit();
    }
  };

  const handleCellKeyPress = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !readOnly) {
      e.preventDefault();
      onStartEdit();
    }
  };

  const handleDoneClick = (e) => {
    e.stopPropagation();
    onEndEdit();
  };

  const handleEntityToggle = (entityName) => {
    if (!blocked) {
      onToggle(employee.id, field, entityName);
    }
  };

  const fieldLabel = field === 'newIncoming' ? 'New Incoming' : 'Cross-Training';

  // Search within available entities
  const [query, setQuery] = useState('');
  const filteredEntities = useMemo(() => {
    if (!query) return availableEntities;
    const q = query.toLowerCase();
    return availableEntities.filter(e => e.name.toLowerCase().includes(q));
  }, [availableEntities, query]);

  const selectedCount = currentArray.length;

  return (
    <td
      id={cellId}
      className={`px-1 py-2 text-center relative transition-all duration-150 rounded-lg mx-0.5 ${
        hasAssignments
          ? 'bg-thr-green-100 dark:bg-thr-green-900/30 hover:bg-thr-green-200 dark:hover:bg-thr-green-900/50 cursor-pointer shadow-soft'
          : blocked
            ? 'bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed'
            : 'hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 cursor-pointer'
      } ${isFocused ? 'ring-2 ring-thr-blue-500 dark:ring-thr-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-800' : ''}`}
      onClick={handleCellClick}
      onKeyPress={handleCellKeyPress}
      tabIndex={useKeyboardNav ? (isFocused ? 0 : -1) : (!readOnly ? 0 : -1)}
      role="gridcell"
      aria-label={`${fieldLabel} for ${employee.name}: ${formatEntityList(currentArray) || 'None'}${blocked ? `. ${blockMessage}` : ''}`}
    >
      {readOnly ? (
        hasAssignments ? (
          <div
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight px-1"
            title={formatEntityList(currentArray)}
          >
            {getEntityShortCode(currentArray)}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-600 text-sm">—</span>
        )
      ) : (
        <>
          {hasAssignments ? (
            <div
              className="text-xs font-semibold text-thr-green-700 dark:text-thr-green-300 leading-tight px-1"
              title={formatEntityList(currentArray)}
            >
              {getEntityShortCode(currentArray)}
            </div>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
          )}
          
          {/* Entity Selection Popup */}
          {isEditing && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 max-h-64 overflow-y-auto min-w-[220px] border border-slate-200 dark:border-slate-600" 
              role="dialog" 
              aria-label={`Select entities for ${fieldLabel}`}
            >
              {/* Search and summary */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 bg-white dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Search entities..."
                  aria-label="Search entities"
                  role="search"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">{selectedCount} selected</span>
              </div>
              {blocked && (
                <div className="mb-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200">
                  {blockMessage || `Remove other primary assignments to add ${fieldLabel}.`}
                </div>
              )}
              
              <div className="space-y-1 mb-3">
                {filteredEntities.map(entity => {
                  const isSelected = currentArray.includes(entity.name);
                  const history = entityHistory?.[entity.name];
                  const entityShort = getEntityShortCode([entity.name]);

                  return (
                    <label 
                      key={entity.id} 
                      className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors" 
                      title={entity.name}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={blocked}
                        onChange={() => handleEntityToggle(entity.name)}
                        className="w-4 h-4 mt-0.5 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50"
                        aria-label={`Assign ${entity.name} to ${fieldLabel}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-thr-blue-600 dark:text-thr-blue-400">
                            {entityShort || entity.name}
                          </span>
                          {entityShort && entity.name !== entityShort && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {entity.name}
                            </span>
                          )}
                        </div>
                        {history?.employeeName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Last: {history.employeeName} ({formatHistoryDate(history.startDate)})
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <button
                onClick={handleDoneClick}
                className="mt-2 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                aria-label="Close entity selection"
              >
                Done
              </button>
            </div>
          )}
        </>
      )}
    </td>
  );
}

EntityAssignmentCell.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  field: PropTypes.oneOf(['newIncoming', 'crossTraining']).isRequired,
  assignment: PropTypes.object,
  availableEntities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  entityHistory: PropTypes.object,
  readOnly: PropTypes.bool,
  blocked: PropTypes.bool,
  blockMessage: PropTypes.string,
  isEditing: PropTypes.bool,
  onStartEdit: PropTypes.func.isRequired,
  onEndEdit: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  cellId: PropTypes.string,
  useKeyboardNav: PropTypes.bool,
  isFocused: PropTypes.bool,
};

EntityAssignmentCell.defaultProps = {
  assignment: {},
  entityHistory: {},
  readOnly: false,
  blocked: false,
  blockMessage: '',
  isEditing: false,
  cellId: undefined,
  useKeyboardNav: false,
  isFocused: false,
};

export default memo(EntityAssignmentCell);
