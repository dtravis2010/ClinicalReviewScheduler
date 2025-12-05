import { Building2, Activity, MapPin } from 'lucide-react';

/**
 * Entity Card - Modern dashboard card for entity display
 * 
 * Features:
 * - 3-column responsive grid layout card
 * - Entity name, icon, primary modality highlights
 * - Soft border with slight gradient
 * - Hover: scale up 1.03 effect
 * - Click opens entity detail dialog
 */
export default function EntityCard({ entity, onClick, isSelected = false }) {
  // Get primary color based on entity type/name (can be customized)
  const getEntityColor = (name) => {
    const colors = {
      hospital: 'from-thr-blue-500 to-thr-blue-600',
      clinic: 'from-thr-green-500 to-thr-green-600',
      specialty: 'from-purple-500 to-purple-600',
      default: 'from-slate-500 to-slate-600',
    };
    return colors.default;
  };

  return (
    <button
      onClick={() => onClick?.(entity)}
      className={`
        w-full text-left p-5 rounded-2xl
        bg-white dark:bg-slate-800
        border border-slate-100 dark:border-slate-700
        shadow-card hover:shadow-card-hover
        transition-all duration-250
        transform hover:scale-[1.03] active:scale-[1.01]
        group
        ${isSelected ? 'ring-2 ring-thr-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
      `}
    >
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-12 h-12 rounded-xl
          bg-gradient-to-br ${getEntityColor(entity?.type)}
          flex items-center justify-center
          shadow-soft
          group-hover:shadow-soft-md
          transition-all duration-200
        `}>
          <Building2 className="w-6 h-6 text-white" />
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-thr-green-50 dark:bg-thr-green-900/20">
          <div className="w-1.5 h-1.5 rounded-full bg-thr-green-500 animate-pulse-subtle" />
          <span className="text-xs font-medium text-thr-green-600 dark:text-thr-green-400">Active</span>
        </div>
      </div>

      {/* Entity Name */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-thr-blue-600 dark:group-hover:text-thr-blue-400 transition-colors">
        {entity?.name || 'Entity Name'}
      </h3>

      {/* Entity Code */}
      {entity?.code && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-mono">
          Code: {entity.code}
        </p>
      )}

      {/* Description */}
      {entity?.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
          {entity.description}
        </p>
      )}

      {/* Modality Highlights */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Activity className="w-3.5 h-3.5" />
          <span>Primary Care</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>Dallas Area</span>
        </div>
      </div>
    </button>
  );
}
