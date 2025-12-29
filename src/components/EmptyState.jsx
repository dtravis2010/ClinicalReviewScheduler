import { Calendar, Users, Building2, Plus, ArrowRight, FileText } from 'lucide-react';

/**
 * Empty state component with helpful guidance
 * Used when there's no data to display
 *
 * @param {Object} props
 * @param {('schedule'|'employees'|'entities'|'history'|'generic')} props.type - Type of empty state
 * @param {string} props.title - Custom title override
 * @param {string} props.description - Custom description override
 * @param {Function} props.onAction - Callback for primary action button
 * @param {string} props.actionLabel - Label for the action button
 * @param {boolean} props.showAction - Whether to show the action button
 */
export default function EmptyState({
  type = 'generic',
  title,
  description,
  onAction,
  actionLabel,
  showAction = true,
}) {
  const configs = {
    schedule: {
      icon: Calendar,
      title: 'No Schedules Yet',
      description: 'Create your first schedule to start assigning employees to entities.',
      actionLabel: 'Create Schedule',
      tips: [
        'Schedules help you organize employee assignments over time',
        'You can create multiple schedules for different periods',
        'Publish schedules to make them visible to all users',
      ],
    },
    employees: {
      icon: Users,
      title: 'No Employees Added',
      description: 'Add employees to start building your team and making assignments.',
      actionLabel: 'Add Employee',
      tips: [
        'Track employee skills like DAR, CPOE, and Trace',
        'Employees can be assigned to multiple entities',
        'Archive employees when they leave to preserve history',
      ],
    },
    entities: {
      icon: Building2,
      title: 'No Entities Created',
      description: 'Create entities (locations or departments) to assign employees to.',
      actionLabel: 'Add Entity',
      tips: [
        'Entities represent locations, departments, or work areas',
        'Employees are assigned to entities on the schedule',
        'You can track which entities need coverage',
      ],
    },
    history: {
      icon: FileText,
      title: 'No Activity Yet',
      description: 'Activity history will appear here as changes are made.',
      actionLabel: null,
      tips: [
        'All schedule changes are automatically logged',
        'View who made changes and when',
        'Track assignment modifications over time',
      ],
    },
    generic: {
      icon: Calendar,
      title: 'Nothing Here Yet',
      description: 'There is no data to display at this time.',
      actionLabel: 'Get Started',
      tips: [],
    },
  };

  const config = configs[type] || configs.generic;
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-6 shadow-soft">
        <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
        {displayDescription}
      </p>

      {/* Action button */}
      {showAction && displayActionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 bg-thr-blue-500 hover:bg-thr-blue-600 text-white font-semibold rounded-xl transition-all shadow-soft hover:shadow-soft-md mb-8"
        >
          <Plus className="w-5 h-5" />
          {displayActionLabel}
        </button>
      )}

      {/* Tips section */}
      {config.tips.length > 0 && (
        <div className="w-full max-w-md">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Quick Tips
            </h4>
            <ul className="space-y-2">
              {config.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <ArrowRight className="w-4 h-4 text-thr-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline empty state for smaller sections
 */
export function InlineEmptyState({ icon: Icon = Calendar, message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="text-sm text-thr-blue-500 hover:text-thr-blue-600 font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
