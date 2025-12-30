import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * ScheduleTable component
 * Wrapper for the schedule table with scroll handling
 */
function ScheduleTable({ children, className = '', tableRef = null, ariaActivedescendant, ariaRowCount, ariaColCount }) {
  return (
    <div className={`bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 w-full ${className}`}>
      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
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
