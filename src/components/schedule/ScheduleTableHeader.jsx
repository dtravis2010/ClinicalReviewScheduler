import { memo } from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import { formatEntityList, getEntityShortCode } from '../../utils/scheduleUtils';
import { getAvailableEntitiesForDar } from '../../utils/assignmentLogic';

/**
 * ScheduleTableHeader component
 * Displays column headers and DAR entity configuration
 */
function ScheduleTableHeader({
  darColumns,
  darEntities,
  entities,
  editingDar,
  readOnly,
  onDarClick,
  onDarEntityToggle,
  onDarInfoClick,
  onEditingDarClose
}) {
  return (
    <thead className="sticky top-0 z-20">
      <tr className="bg-gradient-to-r from-thr-blue-500 to-thr-blue-600 dark:from-thr-blue-600 dark:to-thr-blue-700 text-white">
        <th scope="col" className="sticky left-0 bg-thr-blue-500 dark:bg-thr-blue-600 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider z-30 min-w-[140px]">
          Team Member
        </th>
        {darColumns.map((dar, idx) => (
          <th key={idx} scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px] relative">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs">{dar}</span>
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDarInfoClick(idx);
                  }}
                  className="p-0.5 rounded hover:bg-white/20 transition-colors"
                  aria-label={`View ${dar} history and info`}
                  title="View DAR history"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[10px] font-normal opacity-80">
              {editingDar === idx && !readOnly ? (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg p-3 z-50 max-h-48 overflow-y-auto min-w-[200px] border border-slate-200 dark:border-slate-600" role="dialog" aria-label="Select entities for DAR">
                  <div className="space-y-1">
                    {getAvailableEntitiesForDar(idx, darEntities, entities).map(entity => {
                      const currentList = darEntities[idx] || [];
                      const currentArray = Array.isArray(currentList) ? currentList : (currentList ? [currentList] : []);
                      const isSelected = currentArray.includes(entity.name);

                      return (
                        <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-lg text-slate-900 dark:text-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onDarEntityToggle(idx, entity.name)}
                            className="w-4 h-4 text-thr-blue-500 dark:text-thr-blue-400 rounded-md focus:ring-thr-blue-500 dark:bg-slate-700 dark:border-slate-600"
                            aria-label={`Assign ${entity.name} to ${dar}`}
                          />
                          <span className="text-sm">{entity.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    onClick={onEditingDarClose}
                    className="mt-3 w-full px-3 py-2 bg-thr-blue-500 dark:bg-thr-blue-600 text-white rounded-lg text-sm font-medium hover:bg-thr-blue-600 dark:hover:bg-thr-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 transition-colors"
                    aria-label="Close entity selection"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  className="cursor-pointer hover:bg-white/10 rounded-lg px-2 py-1 truncate w-full focus:ring-2 focus:ring-white/50 transition-colors"
                  onClick={() => !readOnly && onDarClick(idx)}
                  title={formatEntityList(darEntities[idx])}
                  aria-label={`Configure entities for ${dar}. Current: ${formatEntityList(darEntities[idx]) || 'None'}`}
                  disabled={readOnly}
                >
                  {getEntityShortCode(darEntities[idx]) || 'Select'}
                </button>
              )}
            </div>
          </th>
        ))}
        <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[70px]">CPOE</th>
        <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[90px]">New Incoming<br/>Items</th>
        <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[90px]">Cross-<br/>Training</th>
        <th scope="col" className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px]">Special<br/>Projects</th>
      </tr>
    </thead>
  );
}

ScheduleTableHeader.propTypes = {
  darColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  darEntities: PropTypes.object.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  editingDar: PropTypes.number,
  readOnly: PropTypes.bool,
  onDarClick: PropTypes.func.isRequired,
  onDarEntityToggle: PropTypes.func.isRequired,
  onDarInfoClick: PropTypes.func.isRequired,
  onEditingDarClose: PropTypes.func.isRequired
};

export default memo(ScheduleTableHeader);
