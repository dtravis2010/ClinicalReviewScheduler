/**
 * Date Range Filter Component
 * Advanced date range filtering with presets and custom ranges
 */

import { useState, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import PropTypes from 'prop-types';

const DATE_PRESETS = [
  { label: 'Today', value: 'today', getDates: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Yesterday', value: 'yesterday', getDates: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
  { label: 'Last 7 Days', value: 'last7days', getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 Days', value: 'last30days', getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'This Week', value: 'thisweek', getDates: () => ({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }) },
  { label: 'Last Week', value: 'lastweek', getDates: () => ({ start: startOfWeek(subWeeks(new Date(), 1)), end: endOfWeek(subWeeks(new Date(), 1)) }) },
  { label: 'This Month', value: 'thismonth', getDates: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Last Month', value: 'lastmonth', getDates: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Custom', value: 'custom', getDates: null },
];

export default function DateRangeFilter({ 
  onFilterChange, 
  initialStartDate = null,
  initialEndDate = null,
  isOpen = false,
  onClose = () => {},
  showAsModal = false
}) {
  const [selectedPreset, setSelectedPreset] = useState('last30days');
  const [startDate, setStartDate] = useState(initialStartDate || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initialEndDate || format(new Date(), 'yyyy-MM-dd'));
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    if (initialStartDate) setStartDate(format(new Date(initialStartDate), 'yyyy-MM-dd'));
    if (initialEndDate) setEndDate(format(new Date(initialEndDate), 'yyyy-MM-dd'));
  }, [initialStartDate, initialEndDate]);

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset.value);
    
    if (preset.value === 'custom') {
      setCustomMode(true);
    } else {
      setCustomMode(false);
      const dates = preset.getDates();
      const newStartDate = format(dates.start, 'yyyy-MM-dd');
      const newEndDate = format(dates.end, 'yyyy-MM-dd');
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      
      if (onFilterChange) {
        onFilterChange({
          startDate: newStartDate,
          endDate: newEndDate,
          preset: preset.value
        });
      }
    }
  };

  const handleApplyCustom = () => {
    if (onFilterChange) {
      onFilterChange({
        startDate,
        endDate,
        preset: 'custom'
      });
    }
    if (showAsModal && onClose) {
      onClose();
    }
  };

  const handleClear = () => {
    setSelectedPreset('last30days');
    const preset = DATE_PRESETS.find(p => p.value === 'last30days');
    const dates = preset.getDates();
    setStartDate(format(dates.start, 'yyyy-MM-dd'));
    setEndDate(format(dates.end, 'yyyy-MM-dd'));
    setCustomMode(false);
    
    if (onFilterChange) {
      onFilterChange({
        startDate: format(dates.start, 'yyyy-MM-dd'),
        endDate: format(dates.end, 'yyyy-MM-dd'),
        preset: 'last30days'
      });
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Quick Filters
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                selectedPreset === preset.value
                  ? 'bg-thr-blue-500 text-white border-thr-blue-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-thr-blue-500 dark:hover:border-thr-blue-400'
              }`}
              aria-pressed={selectedPreset === preset.value}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      {customMode && (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-thr-blue-500"
              aria-label="Start date"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-thr-blue-500"
              aria-label="End date"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Apply Custom Range
          </button>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="p-3 bg-thr-blue-50 dark:bg-thr-blue-900/20 rounded-lg border border-thr-blue-200 dark:border-thr-blue-800">
        <div className="flex items-center gap-2 text-sm text-thr-blue-900 dark:text-thr-blue-100">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span className="font-medium">Current Range:</span>
          <span>
            {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleClear}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );

  if (showAsModal) {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-filter-title"
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-thr-blue-500" aria-hidden="true" />
              </div>
              <h2 id="date-filter-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Date Range Filter
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close date filter"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
            </button>
          </div>
          <div className="p-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Date Range Filter
      </h3>
      {content}
    </div>
  );
}

DateRangeFilter.propTypes = {
  onFilterChange: PropTypes.func,
  initialStartDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  initialEndDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  showAsModal: PropTypes.bool,
};
