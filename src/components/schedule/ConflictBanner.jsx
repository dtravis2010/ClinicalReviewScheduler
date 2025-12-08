import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, AlertCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Banner component for displaying schedule conflicts and warnings
 */
export default function ConflictBanner({ conflicts, warnings, workloadImbalances, onDismiss }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalIssues = conflicts.length + warnings.length + workloadImbalances.length;

  if (totalIssues === 0) return null;

  const hasErrors = conflicts.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasInfo = workloadImbalances.length > 0;

  return (
    <div className={`rounded-lg border-2 shadow-soft animate-fade-in ${
      hasErrors 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
        : hasWarnings
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />
          ) : hasWarnings ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
          )}
          
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${
              hasErrors 
                ? 'text-red-900 dark:text-red-200'
                : hasWarnings
                  ? 'text-yellow-900 dark:text-yellow-200'
                  : 'text-blue-900 dark:text-blue-200'
            }`}>
              {hasErrors && `${conflicts.length} Error${conflicts.length !== 1 ? 's' : ''}`}
              {hasErrors && hasWarnings && ', '}
              {hasWarnings && `${warnings.length} Warning${warnings.length !== 1 ? 's' : ''}`}
              {(hasErrors || hasWarnings) && hasInfo && ', '}
              {hasInfo && `${workloadImbalances.length} Workload Issue${workloadImbalances.length !== 1 ? 's' : ''}`}
            </h3>
            <p className={`text-xs mt-0.5 ${
              hasErrors 
                ? 'text-red-700 dark:text-red-300'
                : hasWarnings
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-blue-700 dark:text-blue-300'
            }`}>
              {hasErrors 
                ? 'Fix errors before publishing'
                : hasWarnings
                  ? 'Review warnings before publishing'
                  : 'Review workload distribution'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              hasErrors 
                ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300'
                : hasWarnings
                  ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                  : 'hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-2 rounded-lg transition-colors ${
                hasErrors 
                  ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300'
                  : hasWarnings
                    ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                    : 'hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              }`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-current/20 p-4 space-y-3">
          {/* Errors */}
          {conflicts.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-red-900 dark:text-red-200 mb-2 uppercase tracking-wider">
                Errors
              </h4>
              <ul className="space-y-1">
                {conflicts.map((conflict, idx) => (
                  <li key={idx} className="text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                    <span>{conflict.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-yellow-900 dark:text-yellow-200 mb-2 uppercase tracking-wider">
                Warnings
              </h4>
              <ul className="space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Workload Imbalances */}
          {workloadImbalances.length > 0 && (
            <div>
              <h4 className="font-semibold text-xs text-blue-900 dark:text-blue-200 mb-2 uppercase tracking-wider">
                Workload Distribution
              </h4>
              <ul className="space-y-1">
                {workloadImbalances.map((imbalance, idx) => (
                  <li key={idx} className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>{imbalance.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ConflictBanner.propTypes = {
  conflicts: PropTypes.arrayOf(PropTypes.object),
  warnings: PropTypes.arrayOf(PropTypes.object),
  workloadImbalances: PropTypes.arrayOf(PropTypes.object),
  onDismiss: PropTypes.func
};

ConflictBanner.defaultProps = {
  conflicts: [],
  warnings: [],
  workloadImbalances: []
};
