import PropTypes from 'prop-types';
import { Search, X, Filter } from 'lucide-react';
import Button from './atoms/Button';

/**
 * SearchFilter - Reusable search and filter component for lists
 *
 * Provides a consistent search/filter experience with:
 * - Search input with clear button
 * - Multiple filter dropdowns
 * - Responsive layout (stacks on mobile)
 * - Clear all filters action
 * - Accessible labels and keyboard navigation
 *
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query value
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Array} props.filters - Array of filter configurations
 * @param {Function} props.onClearFilters - Optional handler to clear all filters
 * @param {boolean} props.showClearFilters - Whether to show clear filters button
 */
export default function SearchFilter({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onClearFilters,
  showClearFilters = false
}) {
  const hasActiveFilters = filters.some(filter => filter.value && filter.value !== 'all' && filter.value !== '');

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-field pl-10 pr-10 w-full"
            aria-label="Search"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {filters.map((filter, index) => (
          <div key={index} className="sm:w-48">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="input-field w-full"
              aria-label={filter.label}
            >
              <option value={filter.allValue || 'all'}>{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Clear Filters Button */}
        {showClearFilters && (hasActiveFilters || searchQuery) && onClearFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            icon={<X className="w-4 h-4" />}
            className="sm:w-auto"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {(hasActiveFilters || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            <Filter className="w-4 h-4 inline mr-1" aria-hidden="true" />
            Active filters:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-700 dark:text-thr-blue-300">
              Search: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="hover:bg-thr-blue-200 dark:hover:bg-thr-blue-800 rounded p-0.5 transition-colors"
                aria-label="Clear search filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.map((filter, index) => {
            if (!filter.value || filter.value === 'all' || filter.value === '') return null;
            const selectedOption = filter.options.find(opt => opt.value === filter.value);
            return (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-thr-green-100 dark:bg-thr-green-900/30 text-thr-green-700 dark:text-thr-green-300"
              >
                {filter.label}: {selectedOption?.label || filter.value}
                <button
                  onClick={() => filter.onChange(filter.allValue || 'all')}
                  className="hover:bg-thr-green-200 dark:hover:bg-thr-green-800 rounded p-0.5 transition-colors"
                  aria-label={`Clear ${filter.label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

SearchFilter.propTypes = {
  searchQuery: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ).isRequired,
      allValue: PropTypes.string,
    })
  ),
  onClearFilters: PropTypes.func,
  showClearFilters: PropTypes.bool,
};
