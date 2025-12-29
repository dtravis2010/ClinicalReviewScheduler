import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, ThumbsUp, ThumbsDown, TrendingDown, Check, Clock, AlertCircle, X } from 'lucide-react';
import Button from './atoms/Button';

/**
 * Smart Suggestions Panel
 * AI-powered assignment recommendations based on skills, workload, rotation patterns
 *
 * Algorithm:
 * - Ranks employees by multiple criteria (skills, workload, rotation needs, experience)
 * - Provides explanations for each suggestion
 * - Learns from user feedback (accept/reject tracking)
 */

const SmartSuggestionsPanel = ({
  targetCell,
  employees = [],
  currentAssignments = {},
  entities = [],
  historicalSchedules = [],
  onAssign,
  onDismiss,
  onFeedback,
}) => {
  const [feedback, setFeedback] = useState({});

  // Calculate workload for each employee
  const calculateWorkload = (employeeId) => {
    const assignment = currentAssignments[employeeId] || {};

    let score = 0;
    score += (assignment.dars?.length || 0) * 3;
    score += (assignment.newIncoming?.length || 0) * 2;
    score += (assignment.crossTraining?.length || 0) * 1.5;
    score += assignment.cpoe ? 2 : 0;
    score += assignment.specialProjects ? 1 : 0;

    return score;
  };

  // Get average workload across all employees
  const averageWorkload = useMemo(() => {
    const workloads = employees.map(emp => calculateWorkload(emp.id));
    return workloads.reduce((sum, w) => sum + w, 0) / employees.length || 0;
  }, [employees, currentAssignments]);

  // Check if employee has required skill for target cell
  const hasRequiredSkill = (employee, cellType) => {
    if (!employee.skills) return false;

    const skillMap = {
      dars: ['DAR', 'Float'],
      cpoe: ['CPOE', 'Float'],
      trace: ['Trace', 'Float'],
      newIncoming: true, // All can do
      crossTraining: true, // All can do
      specialProjects: true,
    };

    const requiredSkills = skillMap[cellType];
    if (requiredSkills === true) return true;

    return requiredSkills?.some(skill => employee.skills.includes(skill));
  };

  // Get last assignment date for this entity
  const getLastAssignment = (employeeId, entityName) => {
    if (!historicalSchedules.length) return null;

    for (let i = 0; i < historicalSchedules.length; i++) {
      const schedule = historicalSchedules[i];
      const assignment = schedule.assignments?.[employeeId];

      if (assignment?.newIncoming?.includes(entityName) ||
          assignment?.crossTraining?.includes(entityName)) {
        return {
          weeks: i,
          type: assignment.newIncoming?.includes(entityName) ? 'New Incoming' : 'Cross-Training'
        };
      }
    }

    return null;
  };

  // Rank candidates for suggestion
  const rankedSuggestions = useMemo(() => {
    if (!targetCell) return [];

    const { type, entityName, darIndex } = targetCell;

    const candidates = employees
      .filter(emp => !emp.archived)
      .map(emp => {
        const reasons = [];
        const warnings = [];
        let score = 0;

        // 1. Required skill (hard constraint)
        const hasSkill = hasRequiredSkill(emp, type);
        if (!hasSkill) {
          return null; // Filter out
        }
        reasons.push({ icon: <Check />, text: `Has ${type === 'dars' ? 'DAR' : type.toUpperCase()} skill` });
        score += 100; // Base score for having skill

        // 2. Workload balance
        const workload = calculateWorkload(emp.id);
        const workloadRatio = averageWorkload > 0 ? workload / averageWorkload : 1;

        if (workloadRatio < 0.7) {
          reasons.push({
            icon: <TrendingDown />,
            text: `Below average workload (${workload.toFixed(1)} vs ${averageWorkload.toFixed(1)} avg)`
          });
          score += 40;
        } else if (workloadRatio > 1.3) {
          warnings.push({
            icon: <AlertCircle />,
            text: `Above average workload (${workload.toFixed(1)} vs ${averageWorkload.toFixed(1)} avg)`
          });
          score -= 30;
        } else {
          score += 20; // Neutral workload
        }

        // 3. Rotation/freshness (for entity assignments)
        if (entityName) {
          const lastAssigned = getLastAssignment(emp.id, entityName);

          if (!lastAssigned) {
            reasons.push({
              icon: <Sparkles />,
              text: `Never assigned to ${entityName} - fresh perspective`
            });
            score += 30;
          } else if (lastAssigned.weeks >= 4) {
            reasons.push({
              icon: <Clock />,
              text: `Last had ${entityName} ${lastAssigned.weeks} weeks ago`
            });
            score += 20;
          } else if (lastAssigned.weeks <= 1) {
            warnings.push({
              icon: <AlertCircle />,
              text: `Recently assigned to ${entityName} (${lastAssigned.weeks} week${lastAssigned.weeks > 1 ? 's' : ''} ago)`
            });
            score -= 10;
          }
        }

        // 4. Check if already assigned to same DAR
        if (type === 'dars' && currentAssignments[emp.id]?.dars?.includes(darIndex)) {
          warnings.push({
            icon: <AlertCircle />,
            text: 'Already assigned to this DAR column'
          });
          score -= 50;
        }

        // 5. Check if already assigned to this entity
        if (entityName) {
          const empAssignment = currentAssignments[emp.id] || {};
          const isAssigned = empAssignment.newIncoming?.includes(entityName) ||
                            empAssignment.crossTraining?.includes(entityName);

          if (isAssigned) {
            warnings.push({
              icon: <AlertCircle />,
              text: 'Already assigned to this entity'
            });
            score -= 50;
          }
        }

        return {
          employee: emp,
          score,
          confidence: Math.min(Math.max(score / 150, 0), 1), // Normalize to 0-1
          reasons,
          warnings,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    return candidates.slice(0, 5); // Top 5 suggestions
  }, [targetCell, employees, currentAssignments, averageWorkload, historicalSchedules]);

  if (!targetCell || rankedSuggestions.length === 0) {
    return null;
  }

  const handleAssign = (suggestion) => {
    onAssign?.(suggestion.employee);
    setFeedback(prev => ({ ...prev, [suggestion.employee.id]: 'accepted' }));
    onFeedback?.({ employeeId: suggestion.employee.id, action: 'accepted', context: targetCell });
  };

  const handleReject = (suggestion) => {
    setFeedback(prev => ({ ...prev, [suggestion.employee.id]: 'rejected' }));
    onFeedback?.({ employeeId: suggestion.employee.id, action: 'rejected', context: targetCell });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft-lg border border-slate-200 dark:border-slate-700 p-4 animate-slideInUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-thr-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Smart Suggestions
          </h3>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close suggestions"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Context */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Suggested for: <span className="font-medium text-slate-900 dark:text-slate-100">
            {targetCell.type === 'dars' && `DAR ${targetCell.darIndex + 1}`}
            {targetCell.type === 'newIncoming' && `New Incoming: ${targetCell.entityName}`}
            {targetCell.type === 'crossTraining' && `Cross-Training: ${targetCell.entityName}`}
            {targetCell.type === 'cpoe' && 'CPOE'}
          </span>
        </p>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {rankedSuggestions.map((suggestion, idx) => {
          const userFeedback = feedback[suggestion.employee.id];

          return (
            <div
              key={suggestion.employee.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                userFeedback === 'accepted'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : userFeedback === 'rejected'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : idx === 0
                  ? 'border-thr-blue-500 bg-thr-blue-50 dark:bg-thr-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Employee Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {suggestion.employee.name}
                    </h4>
                    {idx === 0 && !userFeedback && (
                      <span className="px-2 py-0.5 bg-thr-blue-600 text-white text-xs font-medium rounded">
                        Top Pick
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {suggestion.employee.skills?.join(', ')}
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex flex-col items-end ml-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Confidence
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          suggestion.confidence > 0.7 ? 'bg-green-500' :
                          suggestion.confidence > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-1.5 mb-3">
                {suggestion.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">
                      {reason.icon}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {reason.text}
                    </span>
                  </div>
                ))}

                {suggestion.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">
                      {warning.icon}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {warning.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {!userFeedback && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAssign(suggestion)}
                    className="flex-1"
                  >
                    Assign
                  </Button>

                  <button
                    onClick={() => handleReject(suggestion)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Not helpful"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {userFeedback === 'accepted' && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>Assigned</span>
                </div>
              )}

              {userFeedback === 'rejected' && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Dismissed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback Note */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          💡 Your feedback helps improve future suggestions
        </p>
      </div>
    </div>
  );
};

SmartSuggestionsPanel.propTypes = {
  targetCell: PropTypes.shape({
    type: PropTypes.string.isRequired,
    entityName: PropTypes.string,
    darIndex: PropTypes.number,
  }),
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentAssignments: PropTypes.object.isRequired,
  entities: PropTypes.arrayOf(PropTypes.object),
  historicalSchedules: PropTypes.arrayOf(PropTypes.object),
  onAssign: PropTypes.func,
  onDismiss: PropTypes.func,
  onFeedback: PropTypes.func,
};

export default SmartSuggestionsPanel;
