import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Info, Edit2, Check, X } from 'lucide-react';
import { formatEntityList, getEntityShortCode } from '../../utils/scheduleUtils';
import { getAvailableEntitiesForDar } from '../../utils/assignmentLogic';
import EntitySelectionModal from './EntitySelectionModal';

/**
 * Header component that allows text editing or entity selection
 */
const ConfigurableHeader = ({
  label,
  columnKey,
  entities,
  customText,
  onEntityClick,
  onTextChange,
  readOnly
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(customText || '');

  // In read-only mode, never surface the "+ Entities" editing prompt — fall back
  // to a neutral placeholder so clinicians don't see a control that looks broken.
  const configuredText = customText || getEntityShortCode(entities, []);
  const displayText = configuredText || (readOnly ? '—' : '+ Entities');

  const handleSave = () => {
    onTextChange(columnKey, text);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(customText || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-white rounded px-1 py-0.5">
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="text-black text-xs px-1 py-0.5 rounded w-full min-w-[80px] border border-gray-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-800"><Check className="w-3 h-3" /></button>
        <button onClick={handleCancel} className="text-red-600 hover:text-red-800"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 w-full">
      <button
        className="cursor-pointer hover:bg-white/30 active:bg-white/40 rounded-lg px-3 py-1.5 truncate max-w-[140px] focus:ring-2 focus:ring-white/60 transition-all duration-200 hover:scale-105 font-bold text-sm shadow-sm"
        onClick={onEntityClick}
        title={formatEntityList(entities)}
        disabled={readOnly}
      >
        {displayText}
      </button>
      {!readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setText(customText || getEntityShortCode(entities, []) || '');
            setIsEditing(true);
          }}
          className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-1"
          title="Edit header text"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

/**
 * ScheduleTableHeader component
 * Displays column headers and DAR/Incoming entity configuration
 */
function ScheduleTableHeader({
  darColumns,
  darEntities,
  incomingColumns = [], // New
  incomingEntities = {}, // New
  headerTexts = {}, // New
  entities,
  editingDar,
  editingIncoming, // New
  readOnly,
  onDarClick,
  onDarEntityToggle,
  onIncomingClick, // New
  onIncomingEntityToggle, // New
  onHeaderRename, // New
  onDarInfoClick,
  onEditingDarClose,
  onEditingIncomingClose, // New
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

        {/* DAR Columns */}
        {darColumns.map((dar, idx) => (
          <th key={`dar-${idx}`} scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[130px] relative border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors group">
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
            <div className="text-[11px] font-medium opacity-90 min-h-[24px]">
              <ConfigurableHeader
                label={dar}
                columnKey={`dar-${idx}`}
                entities={darEntities[idx]}
                customText={headerTexts[`dar-${idx}`]}
                onEntityClick={() => !readOnly && onDarClick(idx)}
                onTextChange={onHeaderRename}
                readOnly={readOnly}
              />
            </div>

            <EntitySelectionModal
              isOpen={editingDar === idx && !readOnly}
              onClose={onEditingDarClose}
              title={`Select Entities for ${dar}`}
              entities={getAvailableEntitiesForDar(idx, darEntities, entities)} // You might need to adjust this logic if it only handles DARs
              selectedEntities={darEntities[idx] || []}
              onToggle={(entityName) => onDarEntityToggle(idx, entityName)}
              showShortCodes={false}
            />
          </th>
        ))}

        {/* Incoming Columns */}
        {incomingColumns.map((inc, idx) => (
          <th key={`inc-${idx}`} scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[130px] relative border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors group">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <span className="text-sm drop-shadow-sm">{inc}</span>
              {!readOnly && onNewIncomingInfoClick && idx === 0 && (
                 <button
                   onClick={(e) => { e.stopPropagation(); onNewIncomingInfoClick(); }}
                   className="p-1 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                   title="View Incoming history"
                 >
                   <Info className="w-4 h-4" />
                 </button>
              )}
            </div>
            <div className="text-xs font-bold opacity-95 min-h-[24px] bg-white/10 rounded-md px-2 py-1">
              <ConfigurableHeader
                label={inc}
                columnKey={`inc-${idx}`}
                entities={incomingEntities[idx]}
                customText={headerTexts[`inc-${idx}`]}
                onEntityClick={() => !readOnly && onIncomingClick && onIncomingClick(idx)}
                onTextChange={onHeaderRename}
                readOnly={readOnly}
              />
            </div>

            <EntitySelectionModal
              isOpen={editingIncoming === idx && !readOnly}
              onClose={onEditingIncomingClose}
              title={`Select Entities for ${inc}`}
              entities={entities} // Needs proper filtering?
              selectedEntities={incomingEntities[idx] || []}
              onToggle={(entityName) => onIncomingEntityToggle && onIncomingEntityToggle(idx, entityName)}
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
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[110px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
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
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm drop-shadow-sm">3P Email</span>
            <span className="text-[10px] opacity-80">(Primary)</span>
          </div>
        </th>
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[100px] border-r border-thr-blue-600 dark:border-thr-blue-700 hover:bg-white/10 transition-colors">
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm drop-shadow-sm">3P Email</span>
            <span className="text-[10px] opacity-80">(Backup)</span>
          </div>
        </th>
        <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider min-w-[80px] hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-center">
            <span className="text-sm drop-shadow-sm">Float</span>
          </div>
        </th>
      </tr>
    </thead>
  );
}

ScheduleTableHeader.propTypes = {
  darColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  darEntities: PropTypes.object.isRequired,
  incomingColumns: PropTypes.arrayOf(PropTypes.string), // New
  incomingEntities: PropTypes.object, // New
  headerTexts: PropTypes.object, // New
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string
  })).isRequired,
  editingDar: PropTypes.number,
  editingIncoming: PropTypes.number, // New
  readOnly: PropTypes.bool,
  onDarClick: PropTypes.func.isRequired,
  onDarEntityToggle: PropTypes.func.isRequired,
  onIncomingClick: PropTypes.func, // New
  onIncomingEntityToggle: PropTypes.func, // New
  onHeaderRename: PropTypes.func, // New
  onDarInfoClick: PropTypes.func.isRequired,
  onEditingDarClose: PropTypes.func.isRequired,
  onEditingIncomingClose: PropTypes.func, // New
  onCpoeInfoClick: PropTypes.func,
  onNewIncomingInfoClick: PropTypes.func,
  onCrossTrainingInfoClick: PropTypes.func,
  onSpecialProjectsInfoClick: PropTypes.func,
  showBulkSelect: PropTypes.bool,
  allSelected: PropTypes.bool,
  onSelectAll: PropTypes.func
};

export default memo(ScheduleTableHeader);
