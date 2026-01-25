import PropTypes from 'prop-types';
import { FileX } from 'lucide-react';
import Button from './atoms/Button';

/**
 * EmptyState - Reusable component for displaying empty states with optional action
 *
 * Provides a consistent, user-friendly experience when lists or data are empty.
 * Follows UX best practices by:
 * - Explaining why the state is empty
 * - Providing clear next steps
 * - Using visual hierarchy to guide users
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icon component to display (default: FileX)
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Explanatory text to guide users
 * @param {Function} props.action - Optional action to execute (shows button if provided)
 * @param {string} props.actionLabel - Label for the action button
 * @param {React.ReactNode} props.actionIcon - Icon for the action button
 * @param {string} props.variant - Button variant (primary, secondary, etc.)
 */
export default function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  actionLabel,
  actionIcon,
  variant = 'primary'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in-up">
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-5 shadow-soft">
        <Icon className="w-10 h-10 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {action && actionLabel && (
        <Button
          variant={variant}
          onClick={action}
          icon={actionIcon}
          size="md"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
  actionIcon: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success']),
};
