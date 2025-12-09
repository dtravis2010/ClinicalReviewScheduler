import { memo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { hasSpecialProjects } from '../../utils/scheduleUtils.js';

/**
 * Workload indicator component
 * Shows workload score with color-coding and tooltip
 */
function WorkloadIndicator({ workload, avgWorkload, employeeName, assignment }) {
  // Determine load level
  const ratio = avgWorkload > 0 ? workload / avgWorkload : 1;
  
  let level = 'normal';
  let colorClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
  let icon = <Minus className="w-3 h-3" aria-hidden="true" />;
  
  if (ratio > 1.5) {
    level = 'high';
    colorClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    icon = <TrendingUp className="w-3 h-3" aria-hidden="true" />;
  } else if (ratio < 0.5 && workload > 0) {
    level = 'low';
    colorClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    icon = <TrendingDown className="w-3 h-3" aria-hidden="true" />;
  }

  // Build tooltip content
  const getTooltipContent = () => {
    const parts = [];
    
    if (assignment.dars && assignment.dars.length > 0) {
      parts.push(`${assignment.dars.length} DAR${assignment.dars.length !== 1 ? 's' : ''} (${assignment.dars.length * 3} pts)`);
    }
    
    if (assignment.cpoe) {
      parts.push('CPOE (2 pts)');
    }
    
    if (assignment.newIncoming) {
      const count = Array.isArray(assignment.newIncoming) ? assignment.newIncoming.length : 1;
      parts.push(`${count} New Incoming (${count * 2} pts)`);
    }
    
    if (assignment.crossTraining) {
      const count = Array.isArray(assignment.crossTraining) ? assignment.crossTraining.length : 1;
      parts.push(`${count} Cross-Training (${count} pt${count !== 1 ? 's' : ''})`);
    }
    
    if (hasSpecialProjects(assignment.specialProjects)) {
      parts.push('Special Project (1 pt)');
    }

    return parts.length > 0 ? parts.join('\n') : 'No assignments';
  };

  const tooltipContent = getTooltipContent();
  const percentOfAvg = avgWorkload > 0 ? Math.round(ratio * 100) : 100;

  return (
    <div className="group relative inline-flex">
      <div 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${colorClass}`}
        title={`${employeeName}\nWorkload: ${workload} pts (${percentOfAvg}% of avg)\n\n${tooltipContent}`}
      >
        {icon}
        <span>{workload}</span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 w-64 pointer-events-none">
        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-lg p-3 border border-slate-700">
          <div className="font-semibold mb-2">{employeeName}</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-300">Workload:</span>
              <span className="font-semibold">{workload} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Average:</span>
              <span>{avgWorkload.toFixed(1)} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Ratio:</span>
              <span className={
                level === 'high' ? 'text-red-400' : 
                level === 'low' ? 'text-yellow-400' : 
                'text-blue-400'
              }>
                {percentOfAvg}%
              </span>
            </div>
          </div>
          
          {tooltipContent !== 'No assignments' && (
            <>
              <div className="border-t border-slate-700 my-2"></div>
              <div className="text-slate-300 space-y-0.5">
                {tooltipContent.split('\n').map((line, idx) => (
                  <div key={idx} className="text-xs">• {line}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

WorkloadIndicator.propTypes = {
  workload: PropTypes.number.isRequired,
  avgWorkload: PropTypes.number.isRequired,
  employeeName: PropTypes.string.isRequired,
  assignment: PropTypes.shape({
    dars: PropTypes.array,
    cpoe: PropTypes.bool,
    newIncoming: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    crossTraining: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    specialProjects: PropTypes.string
  })
};

export default memo(WorkloadIndicator);

WorkloadIndicator.defaultProps = {
  assignment: {}
};
