import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { GripVertical, X, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { getEntityShortCode } from '../utils/scheduleUtils';

/**
 * DarEntityConfig component
 * Allows configuring DAR columns with entities from the entity list
 *
 * Features:
 * - Click-to-assign entities to DARs
 * - Remove entities from DARs
 * - Move entities between DARs
 * - Visual feedback for assigned vs available entities
 */
export default function DarEntityConfig({
  darCount,
  darConfig,
  entities,
  onConfigChange
}) {
  const [selectedDar, setSelectedDar] = useState(0);
  const [movingEntity, setMovingEntity] = useState(null);

  // Generate DAR columns
  const darColumns = useMemo(() =>
    Array.from({ length: darCount }, (_, i) => `DAR ${i + 1}`),
    [darCount]
  );

  // Get entities assigned to a specific DAR
  const getAssignedEntities = useCallback((darIndex) => {
    const config = darConfig[darIndex];
    if (!config) return [];
    // Handle both array and string formats
    if (Array.isArray(config)) return config;
    if (typeof config === 'string' && config.trim()) {
      return config.split('/').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [darConfig]);

  // Get all assigned entity names across all DARs
  const allAssignedEntities = useMemo(() => {
    const assigned = new Set();
    for (let i = 0; i < darCount; i++) {
      getAssignedEntities(i).forEach(name => assigned.add(name));
    }
    return assigned;
  }, [darCount, getAssignedEntities]);

  // Get available (unassigned) entities
  const availableEntities = useMemo(() =>
    entities.filter(e => !allAssignedEntities.has(e.name)),
    [entities, allAssignedEntities]
  );

  // Add entity to a DAR
  const addEntityToDar = useCallback((darIndex, entityName) => {
    const current = getAssignedEntities(darIndex);
    if (!current.includes(entityName)) {
      onConfigChange(darIndex, [...current, entityName]);
    }
    setMovingEntity(null);
  }, [getAssignedEntities, onConfigChange]);

  // Remove entity from a DAR
  const removeEntityFromDar = useCallback((darIndex, entityName) => {
    const current = getAssignedEntities(darIndex);
    onConfigChange(darIndex, current.filter(name => name !== entityName));
  }, [getAssignedEntities, onConfigChange]);

  // Move entity between DARs
  const moveEntity = useCallback((fromDar, toDar, entityName) => {
    // Remove from source
    const fromCurrent = getAssignedEntities(fromDar);
    onConfigChange(fromDar, fromCurrent.filter(name => name !== entityName));

    // Add to destination
    const toCurrent = getAssignedEntities(toDar);
    if (!toCurrent.includes(entityName)) {
      onConfigChange(toDar, [...toCurrent, entityName]);
    }
    setMovingEntity(null);
  }, [getAssignedEntities, onConfigChange]);

  // Start moving an entity
  const startMoveEntity = useCallback((darIndex, entityName) => {
    setMovingEntity({ darIndex, entityName });
  }, []);

  // Cancel moving
  const cancelMove = useCallback(() => {
    setMovingEntity(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* DAR Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {darColumns.map((darName, darIndex) => {
          const assignedEntities = getAssignedEntities(darIndex);
          const isSelected = selectedDar === darIndex;
          const isMovingTarget = movingEntity && movingEntity.darIndex !== darIndex;

          return (
            <div
              key={darIndex}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isMovingTarget
                  ? 'border-thr-blue-400 bg-thr-blue-50 dark:bg-thr-blue-900/20 cursor-pointer'
                  : isSelected
                  ? 'border-thr-blue-500 bg-thr-blue-50/50 dark:bg-thr-blue-900/10'
                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50'
              }`}
              onClick={() => {
                if (isMovingTarget && movingEntity) {
                  moveEntity(movingEntity.darIndex, darIndex, movingEntity.entityName);
                } else {
                  setSelectedDar(darIndex);
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  {darName}
                </h4>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  {assignedEntities.length} {assignedEntities.length === 1 ? 'entity' : 'entities'}
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
                    const abbrev = getEntityShortCode([entityName]);
                    const isBeingMoved = movingEntity?.darIndex === darIndex && movingEntity?.entityName === entityName;

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
                              startMoveEntity(darIndex, entityName);
                            }}
                            title="Drag to move to another DAR"
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
                          {darIndex > 0 && (
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-thr-blue-600 dark:hover:text-thr-blue-400"
                              onClick={() => moveEntity(darIndex, darIndex - 1, entityName)}
                              title={`Move to DAR ${darIndex}`}
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                          {darIndex < darCount - 1 && (
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-thr-blue-600 dark:hover:text-thr-blue-400"
                              onClick={() => moveEntity(darIndex, darIndex + 1, entityName)}
                              title={`Move to DAR ${darIndex + 2}`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => removeEntityFromDar(darIndex, entityName)}
                            title="Remove from DAR"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick add button for selected DAR */}
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
            Moving <strong>{movingEntity.entityName}</strong> — Click a DAR column to move it there
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
            Click to add to DAR {selectedDar + 1}
          </span>
        </div>

        {availableEntities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
            All entities have been assigned to DARs
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableEntities.map(entity => {
              const abbrev = getEntityShortCode([entity.name]);
              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => addEntityToDar(selectedDar, entity.name)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-thr-blue-400 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 transition-all duration-200 group"
                  title={`Add ${entity.name} to DAR ${selectedDar + 1}`}
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
                  const abbrev = getEntityShortCode([entity.name]);
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

DarEntityConfig.propTypes = {
  darCount: PropTypes.number.isRequired,
  darConfig: PropTypes.object.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string
  })).isRequired,
  onConfigChange: PropTypes.func.isRequired
};
