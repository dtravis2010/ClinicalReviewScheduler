import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, X, Calendar, Users, Building2, FileText, Clock } from 'lucide-react';

/**
 * Global Search Component
 * Deep search across all data with advanced filtering
 *
 * Features:
 * - Search across employees, entities, schedules, assignments
 * - Advanced filters (date range, skills, workload, etc.)
 * - Search history tracking
 * - Export search results
 * - Highlighted search terms in results
 */

const GlobalSearch = ({
  employees = [],
  entities = [],
  schedules = [],
  onSelectResult,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: ['employees', 'entities', 'schedules', 'assignments'],
    dateRange: null,
    skills: [],
    workloadMin: null,
    workloadMax: null,
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('searchHistory');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((query) => {
    if (!query.trim()) return;

    const newHistory = [
      query,
      ...searchHistory.filter(h => h !== query)
    ].slice(0, 10);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Calculate workload for an employee in a schedule
  const calculateWorkload = useCallback((assignment) => {
    if (!assignment) return 0;
    let score = 0;
    score += (assignment.dars?.length || 0) * 3;
    score += (assignment.newIncoming?.length || 0) * 2;
    score += (assignment.crossTraining?.length || 0) * 1.5;
    score += assignment.cpoe ? 2 : 0;
    score += assignment.specialProjects ? 1 : 0;
    return score;
  }, []);

  // Highlight matching text
  const highlightText = useCallback((text, query) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // Build searchable index
  const searchIndex = useMemo(() => {
    const index = [];

    // Index employees
    if (filters.types.includes('employees')) {
      employees.forEach(emp => {
        // Filter by skills if specified
        if (filters.skills.length > 0) {
          const hasRequiredSkill = filters.skills.some(skill =>
            emp.skills?.includes(skill)
          );
          if (!hasRequiredSkill) return;
        }

        index.push({
          type: 'employee',
          id: emp.id,
          title: emp.name,
          subtitle: emp.skills?.join(', ') || 'No skills',
          data: emp,
          searchText: `${emp.name} ${emp.skills?.join(' ') || ''} ${emp.email || ''}`.toLowerCase(),
          icon: <Users className="w-5 h-5 text-purple-600" />,
        });
      });
    }

    // Index entities
    if (filters.types.includes('entities')) {
      entities.forEach(ent => {
        index.push({
          type: 'entity',
          id: ent.id,
          title: ent.name,
          subtitle: `Entity${ent.code ? ` • ${ent.code}` : ''}`,
          data: ent,
          searchText: `${ent.name} ${ent.code || ''}`.toLowerCase(),
          icon: <Building2 className="w-5 h-5 text-blue-600" />,
        });
      });
    }

    // Index schedules
    if (filters.types.includes('schedules')) {
      schedules.forEach(sched => {
        // Filter by date range if specified
        if (filters.dateRange) {
          const schedDate = new Date(sched.startDate);
          if (schedDate < filters.dateRange.start || schedDate > filters.dateRange.end) {
            return;
          }
        }

        index.push({
          type: 'schedule',
          id: sched.id,
          title: sched.name,
          subtitle: `${sched.startDate} - ${sched.endDate}`,
          data: sched,
          searchText: `${sched.name} ${sched.startDate} ${sched.endDate}`.toLowerCase(),
          icon: <Calendar className="w-5 h-5 text-green-600" />,
        });
      });
    }

    // Index assignments
    if (filters.types.includes('assignments')) {
      schedules.forEach(sched => {
        if (!sched.assignments) return;

        Object.entries(sched.assignments).forEach(([empId, assignment]) => {
          const employee = employees.find(e => e.id === empId);
          if (!employee) return;

          // Calculate workload
          const workload = calculateWorkload(assignment);

          // Filter by workload if specified
          if (filters.workloadMin !== null && workload < filters.workloadMin) return;
          if (filters.workloadMax !== null && workload > filters.workloadMax) return;

          // Create searchable text from assignment
          const assignmentText = [
            ...(assignment.dars || []).map(d => `DAR ${d + 1}`),
            ...(assignment.newIncoming || []),
            ...(assignment.crossTraining || []),
            assignment.cpoe ? 'CPOE' : '',
            assignment.specialProjects ? 'Special Projects' : '',
          ].filter(Boolean).join(' ');

          index.push({
            type: 'assignment',
            id: `${sched.id}-${empId}`,
            title: `${employee.name} - ${sched.name}`,
            subtitle: assignmentText || 'No assignments',
            metadata: `Workload: ${workload.toFixed(1)}`,
            data: { schedule: sched, employee, assignment, workload },
            searchText: `${employee.name} ${sched.name} ${assignmentText}`.toLowerCase(),
            icon: <FileText className="w-5 h-5 text-orange-600" />,
          });
        });
      });
    }

    return index;
  }, [employees, entities, schedules, filters, calculateWorkload]);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);

    return searchIndex
      .filter(item => {
        // Check if all words are in the search text
        return words.every(word => item.searchText.includes(word));
      })
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.searchText.includes(lowerQuery) ? 1 : 0;
        const bExact = b.searchText.includes(lowerQuery) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Then by type order
        const typeOrder = { employee: 0, entity: 1, schedule: 2, assignment: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
      })
      .slice(0, 50); // Limit to 50 results
  }, [query, searchIndex]);

  // Handle search
  const handleSearch = (newQuery) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      saveToHistory(newQuery);
    }
  };

  // Handle result selection
  const handleSelectResult = (result) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose?.();
  };

  // Toggle filter
  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType];
      if (Array.isArray(current)) {
        return {
          ...prev,
          [filterType]: current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]
        };
      }
      return prev;
    });
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search employees, entities, schedules, assignments..."
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base"
            aria-label="Global search"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-thr-blue-100 dark:bg-thr-blue-900/30 text-thr-blue-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3 animate-slideInDown">
            {/* Type filters */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                Search In:
              </label>
              <div className="flex flex-wrap gap-2">
                {['employees', 'entities', 'schedules', 'assignments'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('types', type)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      filters.types.includes(type)
                        ? 'bg-thr-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill filters */}
            {filters.types.includes('employees') && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Skills:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['DAR', 'CPOE', 'Trace', 'Float'].map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleFilter('skills', skill)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        filters.skills.includes(skill)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search History (when no query) */}
      {!query && searchHistory.length > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recent Searches
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((historyQuery, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(historyQuery)}
                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query && results.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </p>
          </div>
        ) : query ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {result.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {highlightText(result.title, query)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {highlightText(result.subtitle, query)}
                  </div>
                  {result.metadata && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {result.metadata}
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded">
                    {result.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {query && results.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};

GlobalSearch.propTypes = {
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  entities: PropTypes.arrayOf(PropTypes.object).isRequired,
  schedules: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectResult: PropTypes.func,
  onClose: PropTypes.func,
};

export default GlobalSearch;
