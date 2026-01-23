import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GripVertical, X, Plus, ArrowRight, ArrowLeft, Edit2, Check } from 'lucide-react';
import { getEntityShortCode } from '../utils/scheduleUtils';

/**
 * ColumnEntityConfig component
 * Allows configuring columns (DAR or Incoming) with entities
 *
 * Features:
 * - Click-to-assign entities to columns
 * - Remove entities from columns
 * - Move entities between columns
 * - Edit header text
 * - Visual feedback for assigned vs available entities
 */
export default function ColumnEntityConfig({
  columnCount,
  columnConfig,
  entities,
  onConfigChange,
  headerTexts,
  onHeaderRename,
  labelPrefix = 'DAR'
}) {
  const [selectedCol, setSelectedCol] = useState(0);
  const [movingEntity, setMovingEntity] = useState(null);
  const [editingHeader, setEditingHeader] = useState(null);
  const [tempHeaderText, setTempHeaderText] = useState('');

  // Generate columns
  const columns = useMemo(() =>
    Array.from({ length: columnCount }, (_, i) => `${labelPrefix} ${i + 1}`),
    [columnCount, labelPrefix]
  );

  // Get entities assigned to a specific column
  const getAssignedEntities = useCallback((colIndex) => {
    const config = columnConfig[colIndex];
    if (!config) return [];
    // Handle both array and string formats
    if (Array.isArray(config)) return config;
    if (typeof config === 'string' && config.trim()) {
      return config.split('/').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [columnConfig]);

  // Get all assigned entity names across all columns
  const allAssignedEntities = useMemo(() => {
    const assigned = new Set();
    for (let i = 0; i < columnCount; i++) {
      getAssignedEntities(i).forEach(name => assigned.add(name));
    }
    return assigned;
  }, [columnCount, getAssignedEntities]);

  // Get available (unassigned) entities
  const availableEntities = useMemo(() =>
    entities.filter(e => !allAssignedEntities.has(e.name)),
    [entities, allAssignedEntities]
  );

  // Add entity to a column
  const addEntityToCol = useCallback((colIndex, entityName) => {
    const current = getAssignedEntities(colIndex);
    if (!current.includes(entityName)) {
      onConfigChange(colIndex, [...current, entityName]);
    }
    setMovingEntity(null);
  }, [getAssignedEntities, onConfigChange]);

  // Remove entity from a column
  const removeEntityFromCol = useCallback((colIndex, entityName) => {
    const current = getAssignedEntities(colIndex);
    onConfigChange(colIndex, current.filter(name => name !== entityName));
  }, [getAssignedEntities, onConfigChange]);

  // Move entity between columns
  const moveEntity = useCallback((fromCol, toCol, entityName) => {
    // Remove from source
    const fromCurrent = getAssignedEntities(fromCol);
    onConfigChange(fromCol, fromCurrent.filter(name => name !== entityName));

    // Add to destination
    const toCurrent = getAssignedEntities(toCol);
    if (!toCurrent.includes(entityName)) {
      onConfigChange(toCol, [...toCurrent, entityName]);
    }
    setMovingEntity(null);
  }, [getAssignedEntities, onConfigChange]);

  // Start moving an entity
  const startMoveEntity = useCallback((colIndex, entityName) => {
    setMovingEntity({ colIndex, entityName });
  }, []);

  // Cancel moving
  const cancelMove = useCallback(() => {
    setMovingEntity(null);
  }, []);

  // Header renaming
  const startHeaderEdit = (colIndex, currentText) => {
    setEditingHeader(colIndex);
    setTempHeaderText(currentText || '');
  };

  const saveHeaderEdit = (colIndex, columnKey) => {
    if (onHeaderRename) {
      onHeaderRename(columnKey, tempHeaderText);
    }
    setEditingHeader(null);
  };

  return (
    <div className="space-y-6">
      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {columns.map((colName, colIndex) => {
          const assignedEntities = getAssignedEntities(colIndex);
          const isSelected = selectedCol === colIndex;
          const isMovingTarget = movingEntity && movingEntity.colIndex !== colIndex;
          const columnKey = `${labelPrefix.toLowerCase()}-${colIndex}`;
          const customHeaderText = headerTexts?.[columnKey];
          const displayHeader = customHeaderText || colName;

          return (
            <div
              key={colIndex}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isMovingTarget
                  ? 'border-thr-blue-400 bg-thr-blue-50 dark:bg-thr-blue-900/20 cursor-pointer'
                  : isSelected
                  ? 'border-thr-blue-500 bg-thr-blue-50/50 dark:bg-thr-blue-900/10'
                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50'
              }`}
              onClick={() => {
                if (isMovingTarget && movingEntity) {
                  moveEntity(movingEntity.colIndex, colIndex, movingEntity.entityName);
                } else {
                  setSelectedCol(colIndex);
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                {editingHeader === colIndex ? (
                   <div className="flex items-center gap-1 flex-1 mr-2">
                     <input
                       value={tempHeaderText}
                       onChange={e => setTempHeaderText(e.target.value)}
                       className="w-full text-sm px-1 py-0.5 rounded border border-slate-300"
                       autoFocus
                       onClick={e => e.stopPropagation()}
                       onKeyDown={e => {
                         if (e.key === 'Enter') saveHeaderEdit(colIndex, columnKey);
                       }}
                     />
                     <button onClick={(e) => { e.stopPropagation(); saveHeaderEdit(colIndex, columnKey); }} className="text-green-600"><Check className="w-4 h-4" /></button>
                   </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {colName}
                      {customHeaderText && <span className="block text-xs font-normal text-slate-500">({customHeaderText})</span>}
                    </h4>
                    {onHeaderRename && (
                      <button
                        onClick={(e) => { e.stopPropagation(); startHeaderEdit(colIndex, customHeaderText); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  {assignedEntities.length}
                </span>
              </div>

              {/* Assigned entities */}
              <div className="min-h-[80px] space-y-2">
                {assignedEntities.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                    {isMovingTarget ? 'Drop entity here' : 'No entities assigned'}
                  </p>
                ) : (
                  assignedEntities.map((entityName, idx) => {
                    const entity = entities.find(e => e.name === entityName);
                    const abbrev = getEntityShortCode(entity ? [entity] : [entityName], entities);
                    const isBeingMoved = movingEntity?.colIndex === colIndex && movingEntity?.entityName === entityName;

                    return (
                      <div
                        key={entityName}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg group transition-all duration-200 ${
                          isBeingMoved
                            ? 'bg-thr-blue-200 dark:bg-thr-blue-800 ring-2 ring-thr-blue-500'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-thr-blue-300 dark:hover:border-thr-blue-500'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            className="p-1 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              startMoveEntity(colIndex, entityName);
                            }}
                            title="Drag to move"
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <span className="font-bold text-thr-blue-600 dark:text-thr-blue-400 text-sm">
                              {abbrev}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 truncate" title={entityName}>
                              {entityName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Move buttons */}
                          {colIndex > 0 && (
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-thr-blue-600 dark:hover:text-thr-blue-400"
                              onClick={() => moveEntity(colIndex, colIndex - 1, entityName)}
                              title="Move Left"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                          {colIndex < columnCount - 1 && (
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-thr-blue-600 dark:hover:text-thr-blue-400"
                              onClick={() => moveEntity(colIndex, colIndex + 1, entityName)}
                              title="Move Right"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => removeEntityFromCol(colIndex, entityName)}
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick add button for selected Col */}
              {isSelected && availableEntities.length > 0 && !movingEntity && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Click an entity below to add it here
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Moving entity indicator */}
      {movingEntity && (
        <div className="flex items-center justify-center gap-2 p-3 bg-thr-blue-100 dark:bg-thr-blue-900/30 rounded-lg border border-thr-blue-300 dark:border-thr-blue-700">
          <span className="text-sm text-thr-blue-700 dark:text-thr-blue-300">
            Moving <strong>{movingEntity.entityName}</strong> — Click a column to move it there
          </span>
          <button
            type="button"
            onClick={cancelMove}
            className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Available Entities */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Available Entities
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click to add to {labelPrefix} {selectedCol + 1}
          </span>
        </div>

        {availableEntities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
            All entities have been assigned
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableEntities.map(entity => {
              const abbrev = getEntityShortCode([entity], entities);
              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => addEntityToCol(selectedCol, entity.name)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-thr-blue-400 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 transition-all duration-200 group"
                  title={`Add ${entity.name} to ${labelPrefix} ${selectedCol + 1}`}
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-thr-blue-500" />
                  <span className="font-bold text-thr-blue-600 dark:text-thr-blue-400 text-sm">
                    {abbrev}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {entity.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* All entities reference */}
        {entities.length > 0 && allAssignedEntities.size > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                View all entities ({entities.length})
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {entities.map(entity => {
                  const abbrev = getEntityShortCode([entity], entities);
                  const isAssigned = allAssignedEntities.has(entity.name);
                  return (
                    <span
                      key={entity.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isAssigned
                          ? 'bg-thr-green-100 dark:bg-thr-green-900/30 text-thr-green-700 dark:text-thr-green-400'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold">{abbrev}</span>
                      <span className="text-slate-500 dark:text-slate-400">{entity.name}</span>
                    </span>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

ColumnEntityConfig.propTypes = {
  columnCount: PropTypes.number.isRequired,
  columnConfig: PropTypes.object.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string
  })).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  headerTexts: PropTypes.object,
  onHeaderRename: PropTypes.func,
  labelPrefix: PropTypes.string
};
