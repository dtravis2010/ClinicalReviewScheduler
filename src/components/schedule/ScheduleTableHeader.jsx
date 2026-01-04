import { memo } from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import { formatEntityList, getEntityShortCode } from '../../utils/scheduleUtils';
import { getAvailableEntitiesForDar } from '../../utils/assignmentLogic';
import EntitySelectionModal from './EntitySelectionModal';

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
  onEditingDarClose,
  onCpoeInfoClick,
  onNewIncomingInfoClick,
  onCrossTrainingInfoClick,
  onSpecialProjectsInfoClick,
  showBulkSelect = false,
  allSelected = false,
  onSelectAll
}) {
  return (
    <thead className="sticky top-0 z-20 shadow-lg">
      <tr className="bg-gradient-to-r from-thr-blue-500 via-thr-blue-600 to-thr-blue-500 dark:from-thr-blue-600 dark:via-thr-blue-700 dark:to-thr-blue-600 text-white border-b-2 border-thr-blue-700 dark:border-thr-blue-800">
        {showBulkSelect && !readOnly && (
          <th scope="col" className="sticky left-0 bg-thr-blue-500 dark:bg-thr-blue-600 px-3 py-3.5 text-center z-30 w-12 border-r border-thr-blue-600 dark:border-thr-blue-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 text-thr-blue-500 rounded focus:ring-2 focus:ring-white/50 cursor-pointer"
              aria-label="Select all employees"
              title="Select all employees"
            />
          </th>
        )}
        <th scope="col" className="sticky left-0 bg-gradient-to-r from-thr-blue-500 to-thr-blue-600 dark:from-thr-blue-600 dark:to-thr-blue-700 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider z-30 min-w-[160px] border-r-2 border-thr-blue-700 dark:border-thr-blue-800 shadow-sm">
          <div className="flex items-center gap-2">
            <span>Team Member</span>
          </div>
        </th>
        {darColumns.map((dar, idx) => (
          <th key={idx} scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[130px] relative border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <span className="text-sm drop-shadow-sm">{dar}</span>
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDarInfoClick(idx);
                  }}
                  className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                  aria-label={`View ${dar} history and info`}
                  title="View DAR history"
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-[11px] font-medium opacity-90">
              <button
                className="cursor-pointer hover:bg-white/20 active:bg-white/30 rounded-lg px-2.5 py-1.5 truncate w-full focus:ring-2 focus:ring-white/60 transition-all duration-200 hover:scale-105 font-medium shadow-sm"
                onClick={() => !readOnly && onDarClick(idx)}
                title={formatEntityList(darEntities[idx])}
                aria-label={`Configure entities for ${dar}. Current: ${formatEntityList(darEntities[idx]) || 'None'}`}
                disabled={readOnly}
              >
                {getEntityShortCode(darEntities[idx], entities) || '+ Entities'}
              </button>
            </div>

            {/* Entity Selection Modal - Rendered in portal, outside table DOM */}
            <EntitySelectionModal
              isOpen={editingDar === idx && !readOnly}
              onClose={onEditingDarClose}
              title={`Select Entities for ${dar}`}
              entities={getAvailableEntitiesForDar(idx, darEntities, entities)}
              selectedEntities={darEntities[idx] || []}
              onToggle={(entityName) => onDarEntityToggle(idx, entityName)}
              showShortCodes={false}
            />
          </th>
        ))}
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[80px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm drop-shadow-sm">CPOE</span>
            {!readOnly && onCpoeInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCpoeInfoClick();
                }}
                className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="View CPOE history"
                title="View CPOE history"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </th>
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[160px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm drop-shadow-sm leading-tight">New Incoming<br/>Items</span>
            {!readOnly && onNewIncomingInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNewIncomingInfoClick();
                }}
                className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="View New Incoming history"
                title="View New Incoming history"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </th>
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[160px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm drop-shadow-sm leading-tight">Cross<br/>Training</span>
            {!readOnly && onCrossTrainingInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCrossTrainingInfoClick();
                }}
                className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="View Cross-Training history"
                title="View Cross-Training history"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </th>
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[110px] hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm drop-shadow-sm leading-tight">Special<br/>Projects</span>
            {!readOnly && onSpecialProjectsInfoClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpecialProjectsInfoClick();
                }}
                className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="View Special Projects history"
                title="View Special Projects history"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </th>
      </tr>
    </thead>
  );
}

ScheduleTableHeader.propTypes = {
  darColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  darEntities: PropTypes.object.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string
  })).isRequired,
  editingDar: PropTypes.number,
  readOnly: PropTypes.bool,
  onDarClick: PropTypes.func.isRequired,
  onDarEntityToggle: PropTypes.func.isRequired,
  onDarInfoClick: PropTypes.func.isRequired,
  onEditingDarClose: PropTypes.func.isRequired,
  onCpoeInfoClick: PropTypes.func,
  onNewIncomingInfoClick: PropTypes.func,
  onCrossTrainingInfoClick: PropTypes.func,
  onSpecialProjectsInfoClick: PropTypes.func,
  showBulkSelect: PropTypes.bool,
  allSelected: PropTypes.bool,
  onSelectAll: PropTypes.func
};

export default memo(ScheduleTableHeader);
