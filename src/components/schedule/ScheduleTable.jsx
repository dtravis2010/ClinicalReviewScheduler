import PropTypes from 'prop-types';

/**
 * ScheduleTable component
 * Wrapper for the schedule table with scroll handling
 */
export default function ScheduleTable({ children, className = '' }) {
  return (
    <div className={`bg-slate-50 dark:bg-slate-900 flex-1 overflow-auto p-3 ${className}`}>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-auto border border-slate-100 dark:border-slate-700">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse min-w-max" role="grid" aria-label="Schedule assignments">
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

ScheduleTable.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
