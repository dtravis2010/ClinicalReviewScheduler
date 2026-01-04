import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal';
import { getEntityShortCode, formatEntityList } from '../../utils/scheduleUtils';
import { formatHistoryDate } from '../../utils/entityHistory';

/**
 * EntitySelectionModal - Reusable modal for selecting entities with checkboxes
 *
 * Extracted from inline dialogs in ScheduleTableHeader and EntityAssignmentCell
 * to fix event propagation issues and improve code reusability.
 *
 * Uses createPortal via Modal component to render outside table DOM,
 * preventing checkbox click conflicts with table cell events.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal should close
 * @param {string} props.title - Modal title
 * @param {Array} props.entities - Available entities to select from
 * @param {Array} props.selectedEntities - Currently selected entity names
 * @param {Function} props.onToggle - Called when entity checkbox is toggled (entityName)
 * @param {Object} props.entityHistory - Optional history data for entities
 * @param {boolean} props.showShortCodes - Whether to show entity short codes
 * @param {boolean} props.disabled - Whether selections are disabled
 * @param {string} props.disabledMessage - Message to show when disabled
 */
export default function EntitySelectionModal({
  isOpen,
  onClose,
  title,
  entities = [],
  selectedEntities = [],
  onToggle,
  entityHistory = {},
  showShortCodes = false,
  disabled = false,
  disabledMessage = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter entities based on search query
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities;
    const query = searchQuery.toLowerCase().trim();
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  // Convert selectedEntities to array if needed
  const selectedArray = Array.isArray(selectedEntities)
    ? selectedEntities
    : (selectedEntities ? [selectedEntities] : []);

  const handleToggle = (entityName) => {
    if (!disabled && onToggle) {
      onToggle(entityName);
    }
  };

  const handleClose = () => {
    setSearchQuery(''); // Reset search on close
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      closeOnBackdropClick={true}
      closeOnEsc={true}
    >
      <div className="space-y-4">
        {/* Search and Selected Count */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-thr-blue-500 dark:focus:ring-thr-blue-400 bg-white dark:bg-slate-700 dark:text-slate-100"
            placeholder="Search entities..."
            aria-label="Search entities"
            autoFocus
          />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {selectedArray.length} selected
          </span>
        </div>

        {/* Disabled Warning */}
        {disabled && disabledMessage && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-4 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-200">
              {disabledMessage}
            </p>
          </div>
        )}

        {/* Entity List */}
        <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
          {filteredEntities.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
              {searchQuery ? 'No entities match your search' : 'No entities available'}
            </p>
          ) : (
            filteredEntities.map((entity) => {
              const isSelected = selectedArray.includes(entity.name);
              const history = entityHistory[entity.name];
              const shortCode = showShortCodes
                ? getEntityShortCode([entity], entities)
                : null;

              return (
                <label
                  key={entity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    disabled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={entity.name}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => handleToggle(entity.name)}
                    className="w-4 h-4 mt-0.5 text-thr-blue-500 dark:text-thr-blue-400 rounded focus:ring-2 focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${entity.name}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      {showShortCodes && shortCode ? (
                        <>
                          <span className="text-sm font-bold text-thr-blue-600 dark:text-thr-blue-400">
                            {shortCode}
                          </span>
                          {entity.name !== shortCode && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {entity.name}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {entity.name}
                        </span>
                      )}
                    </div>

                    {/* Entity History (if available) */}
                    {history?.employeeName && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Last: {history.employeeName} ({formatHistoryDate(history.startDate)})
                      </div>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Done Button */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-thr-blue-500 hover:bg-thr-blue-600 dark:bg-thr-blue-600 dark:hover:bg-thr-blue-500 text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

EntitySelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  selectedEntities: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string
  ]),
  onToggle: PropTypes.func.isRequired,
  entityHistory: PropTypes.object,
  showShortCodes: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledMessage: PropTypes.string
};
