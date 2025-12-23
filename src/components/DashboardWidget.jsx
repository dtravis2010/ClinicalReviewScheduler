/**
 * Dashboard Widget Component
 * Draggable and customizable widget container
 */

import { useState } from 'react';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import PropTypes from 'prop-types';

export default function DashboardWidget({
  id,
  title,
  icon: Icon,
  children,
  onRemove,
  onDragStart,
  onDragEnd,
  draggable = true,
  collapsible = true,
  removable = false,
  className = '',
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (onDragStart) {
      onDragStart(id);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(id);
    }
  };

  return (
    <div
      className={`card overflow-hidden ${className}`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      role="region"
      aria-labelledby={`widget-title-${id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 flex-1">
          {draggable && (
            <button
              className="cursor-move text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors draggable"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-thr-blue-500/10 to-thr-blue-500/5 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-thr-blue-500" aria-hidden="true" />
            </div>
          )}
          <h3
            id={`widget-title-${id}`}
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              ) : (
                <Minimize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              )}
            </button>
          )}
          {removable && onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              aria-label="Remove widget"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

DashboardWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  onRemove: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  draggable: PropTypes.bool,
  collapsible: PropTypes.bool,
  removable: PropTypes.bool,
  className: PropTypes.string,
};
