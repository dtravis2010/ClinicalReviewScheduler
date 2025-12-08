import PropTypes from 'prop-types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateRange } from '../../utils/scheduleUtils';

/**
 * ScheduleDateBanner component
 * Displays schedule name, dates, and status with inline editing
 */
export default function ScheduleDateBanner({
  scheduleName,
  startDate,
  endDate,
  scheduleStatus,
  readOnly,
  onScheduleNameChange,
  onStartDateChange,
  onEndDateChange
}) {
  return (
    <div className="header-gradient px-4 sm:px-6 py-3 text-white flex-shrink-0">
      <div className="flex items-center justify-between">
        <button
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/50"
          aria-label="Previous schedule"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center flex-1 px-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Calendar className="w-5 h-5 text-white/80" aria-hidden="true" />
            {!readOnly ? (
              <div className="inline-flex items-center gap-2 bg-thr-green-600/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-white font-semibold">✓</span>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => onScheduleNameChange(e.target.value)}
                  className="bg-transparent text-white font-semibold text-sm text-center focus:outline-none placeholder:text-white/60 w-auto min-w-[120px]"
                  placeholder="Schedule name"
                  style={{ width: `${Math.max(120, (scheduleName?.length || 12) * 8)}px` }}
                />
                <span className="text-white/90 text-sm">
                  ({startDate || 'start'} to {endDate || 'end'})
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-thr-green-600/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-white font-semibold">✓</span>
                <span className="font-semibold text-sm text-white">
                  {scheduleName || 'Schedule'} ({formatDateRange(startDate, endDate) || 'No dates'})
                </span>
              </div>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-soft ${
              scheduleStatus === 'published' ? 'bg-thr-green-500' : 'bg-orange-500'
            }`}>
              {scheduleStatus === 'published' ? 'LIVE' : 'DRAFT'}
            </span>
          </div>
          {!readOnly && (
            <div className="flex items-center justify-center gap-2 mt-2 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-white text-xs font-medium focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-soft transition-all duration-200 cursor-pointer hover:bg-white/25 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
                <span className="text-white/80 text-xs font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 text-white text-xs font-medium focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-soft transition-all duration-200 cursor-pointer hover:bg-white/25 [color-scheme:dark]"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/50"
          aria-label="Next schedule"
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
  onEndDateChange: PropTypes.func
};
