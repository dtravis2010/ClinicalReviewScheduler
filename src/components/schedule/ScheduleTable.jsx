import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * ScheduleTable component
 * Wrapper for the schedule table with scroll handling
 */
function ScheduleTable({ children, className = '', tableRef = null, ariaActivedescendant, ariaRowCount, ariaColCount }) {
  return (
    <div className={`bg-slate-50 dark:bg-slate-900 p-3 w-full ${className}`}>
      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 w-full">
        <div className="overflow-x-auto w-full">
          <table
            ref={tableRef}
            className="w-full border-collapse"
            role="grid"
            aria-label="Schedule assignments"
            tabIndex={0}
            aria-activedescendant={ariaActivedescendant}
            aria-rowcount={ariaRowCount}
            aria-colcount={ariaColCount}
          >
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

ScheduleTable.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  tableRef: PropTypes.any,
  ariaActivedescendant: PropTypes.string,
  ariaRowCount: PropTypes.number,
  ariaColCount: PropTypes.number
};

export default memo(ScheduleTable);
