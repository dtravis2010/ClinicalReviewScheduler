import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, Users, Building2, Settings,
  BarChart3, FileDown, Plus, Eye, X
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Command Palette (Cmd+K / Ctrl+K)
 * Universal search and navigation for the application
 *
 * Features:
 * - Fuzzy search across employees, entities, schedules, actions
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent items tracking
 * - Quick actions
 * - Category grouping
 */

const CommandPalette = ({
  isOpen,
  onClose,
  employees = [],
  entities = [],
  schedules = [],
  onAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Command definitions
  const commands = useMemo(() => [
    // Navigation
    {
      id: 'nav-schedule',
      category: 'Navigation',
      icon: <Calendar className="w-5 h-5" />,
      label: 'View Schedule',
      keywords: ['schedule', 'view', 'calendar'],
      action: () => navigate('/schedule'),
    },
    {
      id: 'nav-supervisor',
      category: 'Navigation',
      icon: <Users className="w-5 h-5" />,
      label: 'Supervisor Dashboard',
      keywords: ['supervisor', 'dashboard', 'manage'],
      action: () => navigate('/supervisor'),
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics Dashboard',
      keywords: ['analytics', 'stats', 'reports', 'metrics'],
      action: () => navigate('/analytics'),
    },
    {
      id: 'nav-productivity',
      category: 'Navigation',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Productivity Dashboard',
      keywords: ['productivity', 'performance'],
      action: () => navigate('/productivity'),
    },
    {
      id: 'nav-insights',
      category: 'Navigation',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Insights Dashboard',
      keywords: ['insights', 'analysis'],
      action: () => navigate('/insights'),
    },

    // Actions
    {
      id: 'action-new-schedule',
      category: 'Actions',
      icon: <Plus className="w-5 h-5" />,
      label: 'Create New Schedule',
      keywords: ['create', 'new', 'schedule', 'add'],
      action: () => {
        navigate('/supervisor');
        onAction?.('createSchedule');
      },
    },
    {
      id: 'action-export',
      category: 'Actions',
      icon: <FileDown className="w-5 h-5" />,
      label: 'Export to Excel',
      keywords: ['export', 'download', 'excel', 'xlsx'],
      action: () => onAction?.('export'),
    },
  ], [navigate, onAction]);

  // Build searchable items (employees, entities, schedules, commands)
  const searchableItems = useMemo(() => {
    const items = [...commands];

    // Add employees
    employees.forEach(emp => {
      items.push({
        id: `emp-${emp.id}`,
        category: 'Employees',
        icon: <Users className="w-5 h-5" />,
        label: emp.name,
        subtitle: emp.skills?.join(', '),
        keywords: [emp.name, ...emp.skills || [], 'employee'],
        action: () => {
          navigate('/supervisor');
          onAction?.('viewEmployee', emp.id);
        },
      });
    });

    // Add entities
    entities.forEach(ent => {
      items.push({
        id: `ent-${ent.id}`,
        category: 'Entities',
        icon: <Building2 className="w-5 h-5" />,
        label: ent.name,
        keywords: [ent.name, 'entity', 'location'],
        action: () => {
          navigate('/supervisor');
          onAction?.('viewEntity', ent.id);
        },
      });
    });

    // Add schedules
    schedules.forEach(sched => {
      items.push({
        id: `sched-${sched.id}`,
        category: 'Schedules',
        icon: <Calendar className="w-5 h-5" />,
        label: sched.name,
        subtitle: `${sched.startDate} - ${sched.endDate}`,
        keywords: [sched.name, sched.startDate, 'schedule'],
        action: () => {
          navigate('/supervisor');
          onAction?.('loadSchedule', sched.id);
        },
      });
    });

    return items;
  }, [commands, employees, entities, schedules, navigate, onAction]);

  // Fuzzy search function
  const fuzzyMatch = useCallback((str, pattern) => {
    if (!pattern) return true;

    const lowerStr = str.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Exact match gets highest priority
    if (lowerStr.includes(lowerPattern)) return 2;

    // Fuzzy match
    let patternIdx = 0;
    let strIdx = 0;

    while (strIdx < lowerStr.length && patternIdx < lowerPattern.length) {
      if (lowerStr[strIdx] === lowerPattern[patternIdx]) {
        patternIdx++;
      }
      strIdx++;
    }

    return patternIdx === lowerPattern.length ? 1 : 0;
  }, []);

  // Filter and rank items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show recent items when no query
      return recentItems.slice(0, 5);
    }

    const results = searchableItems
      .map(item => {
        // Search in label and keywords
        const labelScore = fuzzyMatch(item.label, query);
        const keywordScore = Math.max(
          ...item.keywords.map(kw => fuzzyMatch(kw, query))
        );
        const score = Math.max(labelScore, keywordScore);

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return results;
  }, [query, searchableItems, recentItems, fuzzyMatch]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};

    filteredItems.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }, [filteredItems]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [filteredItems, selectedIndex, onClose]);

  // Handle item selection
  const handleSelectItem = useCallback((item) => {
    // Add to recent items
    setRecentItems(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return [item, ...filtered].slice(0, 10);
    });

    // Execute action
    item.action();

    // Close palette
    onClose();
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Parent component should handle opening
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1050] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-soft-xl animate-scale-in"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search for employees, entities, schedules, or actions..."
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base"
            aria-label="Command palette search"
            id="command-palette-title"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close command palette"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {/* Category header */}
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                  {category}
                </div>

                {/* Category items */}
                {items.map((item, idx) => {
                  const globalIdx = filteredItems.findIndex(i => i.id === item.id);
                  const isSelected = globalIdx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                        isSelected
                          ? 'bg-thr-blue-50 dark:bg-thr-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      aria-selected={isSelected}
                    >
                      <div className={`flex-shrink-0 ${
                        isSelected
                          ? 'text-thr-blue-600 dark:text-thr-blue-400'
                          : 'text-slate-400'
                      }`}>
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.label}
                        </div>
                        {item.subtitle && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="flex-shrink-0 text-xs text-thr-blue-600 dark:text-thr-blue-400 font-medium">
                          ↵
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">↑</kbd>
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  employees: PropTypes.arrayOf(PropTypes.object),
  entities: PropTypes.arrayOf(PropTypes.object),
  schedules: PropTypes.arrayOf(PropTypes.object),
  onAction: PropTypes.func,
};

export default CommandPalette;
