import PropTypes from 'prop-types';
import { getRotationStatusBadge } from '../../utils/rotationAnalysis';

/**
 * Small rotation status badge for inline display in schedule grid
 */
export default function RotationStatusBadge({ rotationStatus, compact = true, showIcon = true }) {
  const badge = getRotationStatusBadge(rotationStatus);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${badge.color}`}
        title={`Rotation Status: ${badge.label}`}
        aria-label={`Rotation Status: ${badge.label}`}
      >
        {badge.icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      title={`Rotation Status: ${badge.label}`}
    >
      {showIcon && <span>{badge.icon}</span>}
      <span>{badge.label}</span>
    </span>
  );
}

RotationStatusBadge.propTypes = {
  rotationStatus: PropTypes.string.isRequired,
  compact: PropTypes.bool,
  showIcon: PropTypes.bool
};
