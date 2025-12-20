import { memo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateRange } from '../../utils/scheduleUtils';

/**
 * Check if a schedule is current based on its end date
 * @param {string} endDate - Schedule end date (YYYY-MM-DD)
 * @returns {boolean} True if schedule is current or future
 */
function isScheduleCurrent(endDate) {
  if (!endDate) return true; // Default to current if no end date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  const scheduleEndDate = new Date(endDate + 'T00:00:00');
  scheduleEndDate.setHours(0, 0, 0, 0);
  return scheduleEndDate >= today;
}

/**
 * ScheduleDateBanner component
 * Displays formatted date range and schedule status with date editing (supervisor mode)
 *
 * Features:
 * - Navigation arrows for browsing between schedules
 * - Formatted assignment period display (Month Year format)
 * - Status badge (LIVE/DRAFT)
 * - Date editing controls (supervisor mode only)
 * - Accessible keyboard navigation
 *
 * @param {Object} props - Component props
 * @param {string} props.scheduleName - @deprecated No longer displayed, kept for backward compatibility
 * @param {string} props.startDate - Schedule start date (YYYY-MM-DD)
 * @param {string} props.endDate - Schedule end date (YYYY-MM-DD)
 * @param {string} props.scheduleStatus - Schedule status ('draft' or 'published')
 * @param {boolean} props.readOnly - If true, hides date editing controls (User View)
 * @param {Function} props.onScheduleNameChange - @deprecated No longer used, kept for backward compatibility
 * @param {Function} props.onStartDateChange - Callback for start date changes
 * @param {Function} props.onEndDateChange - Callback for end date changes
 * @param {Function} props.onPreviousSchedule - Callback for previous schedule navigation
 * @param {Function} props.onNextSchedule - Callback for next schedule navigation
 * @param {boolean} props.canGoPrevious - Whether previous schedule navigation is available
 * @param {boolean} props.canGoNext - Whether next schedule navigation is available
 */
function ScheduleDateBanner({
  scheduleName, // eslint-disable-line no-unused-vars
  startDate,
  endDate,
  scheduleStatus,
  readOnly,
  onScheduleNameChange, // eslint-disable-line no-unused-vars
  onStartDateChange,
  onEndDateChange,
  onPreviousSchedule,
  onNextSchedule,
  canGoPrevious,
  canGoNext
}) {
  const isCurrent = isScheduleCurrent(endDate);
  const headerColorClass = isCurrent ? 'header-gradient' : 'header-gradient-past';

  // Determine if navigation is available at all
  const hasNavigation = (canGoPrevious || canGoNext) && (onPreviousSchedule || onNextSchedule);

  return (
    <div className={`${headerColorClass} px-4 sm:px-6 py-4 text-white flex-shrink-0`}>
      <div className="flex items-center justify-between gap-4">
        {/* Previous Schedule Button */}
        <button
          onClick={onPreviousSchedule}
          disabled={!canGoPrevious || !onPreviousSchedule}
          className={`p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent ${
            canGoPrevious && onPreviousSchedule
              ? 'hover:bg-white/15 active:bg-white/20 cursor-pointer shadow-sm hover:shadow-md'
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Go to previous (older) schedule"
          title={canGoPrevious ? 'Previous schedule' : 'No older schedules'}
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Center Content - Assignment Period Display */}
        <div className="text-center flex-1 min-w-0">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Assignment Period Badge */}
            <div
              className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/20 shadow-lg"
              role="heading"
              aria-level="2"
            >
              <Calendar className="w-5 h-5 text-white/90 flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold text-base text-white tracking-wide">
                {formatDateRange(startDate, endDate, true) || 'No dates set'}
              </span>
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                scheduleStatus === 'published'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
              role="status"
              aria-label={`Schedule status: ${scheduleStatus === 'published' ? 'Live' : 'Draft'}`}
            >
              {scheduleStatus === 'published' ? 'LIVE' : 'DRAFT'}
            </span>
          </div>

          {/* Date Editing Controls (Supervisor mode only) */}
          {!readOnly && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="bg-transparent px-2 py-1 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200 cursor-pointer [color-scheme:dark]"
                  aria-label="Schedule start date"
                  style={{ colorScheme: 'dark' }}
                />
                <span className="text-white/70 text-sm font-medium select-none">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="bg-transparent px-2 py-1 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200 cursor-pointer [color-scheme:dark]"
                  aria-label="Schedule end date"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}

          {/* Navigation hint for User View when multiple schedules exist */}
          {readOnly && hasNavigation && (
            <p className="text-white/60 text-xs mt-2 font-medium">
              Use arrows to browse schedules
            </p>
          )}
        </div>

        {/* Next Schedule Button */}
        <button
          onClick={onNextSchedule}
          disabled={!canGoNext || !onNextSchedule}
          className={`p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent ${
            canGoNext && onNextSchedule
              ? 'hover:bg-white/15 active:bg-white/20 cursor-pointer shadow-sm hover:shadow-md'
              : 'opacity-30 cursor-not-allowed'
          }`}
          aria-label="Go to next (newer) schedule"
          title={canGoNext ? 'Next schedule' : 'No newer schedules'}
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

ScheduleDateBanner.propTypes = {
  scheduleName: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  scheduleStatus: PropTypes.oneOf(['draft', 'published']),
  readOnly: PropTypes.bool,
  onScheduleNameChange: PropTypes.func,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  onPreviousSchedule: PropTypes.func,
  onNextSchedule: PropTypes.func,
  canGoPrevious: PropTypes.bool,
  canGoNext: PropTypes.bool
};

export default memo(ScheduleDateBanner);
