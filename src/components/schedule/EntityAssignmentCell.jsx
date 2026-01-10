import { memo } from 'react';
import PropTypes from 'prop-types';
import { formatEntityList, getEntityShortCode } from '../../utils/scheduleUtils';
import EntitySelectionModal from './EntitySelectionModal';

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

  // Get entity abbreviations for display
  const entityAbbreviations = hasAssignments 
    ? getEntityShortCode(currentArray, availableEntities)
    : '';

  const handleCellClick = (e) => {
    // Only open the popup if we're not already editing
    // This prevents the cell click from interfering with popup interactions
    if (!readOnly && !isEditing) {
      onStartEdit();
    }
  };

  const handleCellKeyPress = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !readOnly && !isEditing) {
      e.preventDefault();
      onStartEdit();
    }
  };

  const handleEntityToggle = (entityName) => {
    if (!blocked) {
      onToggle(employee.id, field, entityName);
    }
  };

  const fieldLabel = field === 'newIncoming' ? 'New Incoming' : 'Cross-Training';

  return (
    <td
      id={cellId}
      className={`px-2 py-3 text-center relative transition-all duration-200 border-r border-slate-100 dark:border-slate-700/50 ${
        hasAssignments
          ? 'bg-gradient-to-br from-thr-green-100 to-thr-green-50 dark:from-thr-green-900/40 dark:to-thr-green-900/20 hover:from-thr-green-200 hover:to-thr-green-100 dark:hover:from-thr-green-900/60 dark:hover:to-thr-green-900/40 cursor-pointer shadow-sm hover:shadow-md active:scale-95'
          : blocked
            ? 'bg-slate-100/50 dark:bg-slate-800/40 cursor-not-allowed opacity-60'
            : 'bg-white dark:bg-slate-800/20 hover:bg-gradient-to-br hover:from-thr-blue-50 hover:to-white dark:hover:from-thr-blue-900/20 dark:hover:to-slate-800/40 cursor-pointer hover:shadow-sm active:scale-95'
      } ${isFocused ? 'ring-2 ring-thr-blue-500 dark:ring-thr-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}
      onClick={handleCellClick}
      onKeyPress={handleCellKeyPress}
      tabIndex={useKeyboardNav ? (isFocused ? 0 : -1) : (!readOnly ? 0 : -1)}
      role="gridcell"
      aria-label={`${fieldLabel} for ${employee.name}: ${formatEntityList(currentArray) || 'None'}${blocked ? `. ${blockMessage}` : ''}`}
    >
      {readOnly ? (
        hasAssignments ? (
          <div className="flex items-center justify-center gap-1" title={formatEntityList(currentArray)}>
            <span className="text-xs font-bold text-thr-green-700 dark:text-thr-green-300 px-2 py-1 bg-thr-green-200 dark:bg-thr-green-800/40 rounded-lg shadow-sm">
              {entityAbbreviations}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>
        )
      ) : (
        <>
          {hasAssignments ? (
            <div className="flex items-center justify-center gap-1" title={formatEntityList(currentArray)}>
              <span className="text-xs font-bold text-thr-green-700 dark:text-thr-green-300 px-2 py-1 bg-thr-green-200 dark:bg-thr-green-800/40 rounded-lg shadow-sm">
                {entityAbbreviations}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
            </div>
          )}

          {/* Entity Selection Modal - Rendered in portal, outside table DOM */}
          <EntitySelectionModal
            isOpen={isEditing}
            onClose={onEndEdit}
            title={`Select Entities for ${fieldLabel}`}
            entities={availableEntities}
            selectedEntities={currentArray}
            onToggle={handleEntityToggle}
            entityHistory={entityHistory}
            showShortCodes={true}
            disabled={blocked}
            disabledMessage={blockMessage || `Remove other primary assignments to add ${fieldLabel}.`}
          />
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
    code: PropTypes.string
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
