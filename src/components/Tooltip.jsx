import { useState, useRef, useEffect } from 'react';

/**
 * A lightweight, accessible Tooltip component
 * Displays helpful text when hovering over or focusing on an element
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 * @param {string} props.content - The tooltip text content
 * @param {string} props.shortcut - Optional keyboard shortcut to display
 * @param {('top'|'bottom'|'left'|'right')} props.position - Tooltip position (default: 'top')
 * @param {number} props.delay - Delay before showing tooltip in ms (default: 300)
 * @param {boolean} props.disabled - Whether tooltip is disabled
 */
export default function Tooltip({
  children,
  content,
  shortcut,
  position = 'top',
  delay = 300,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow classes for the tooltip
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-600 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-600 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-600 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-600 border-y-transparent border-l-transparent',
  };

  // Check if tooltip would overflow viewport and adjust position
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();

      let newPosition = position;

      // Check for overflow and adjust
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > window.innerHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltipRect.right > window.innerWidth) {
        newPosition = 'left';
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setActualPosition(position);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!content && !shortcut) {
    return children;
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[actualPosition]} pointer-events-none`}
        >
          <div className="relative bg-slate-800 dark:bg-slate-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            <span>{content}</span>
            {shortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 bg-slate-700 dark:bg-slate-500 rounded text-[10px] font-mono">
                {shortcut}
              </kbd>
            )}
            {/* Arrow */}
            <span
              className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * IconButton with built-in tooltip
 * Use this for icon-only buttons that need accessible labels
 */
export function IconButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  className = '',
  variant = 'ghost',
  size = 'md',
  disabled = false,
  tooltipPosition = 'top',
  ...props
}) {
  const variantClasses = {
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100',
    primary: 'text-white bg-thr-blue-500 hover:bg-thr-blue-600',
    secondary: 'text-white bg-thr-green-500 hover:bg-thr-green-600',
    danger: 'text-white bg-red-500 hover:bg-red-600',
    outline: 'border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700',
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Tooltip content={label} shortcut={shortcut} position={tooltipPosition} disabled={disabled}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          rounded-xl transition-all duration-200
          focus-visible:ring-2 focus-visible:ring-thr-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        aria-label={label}
        {...props}
      >
        <Icon className={iconSizes[size]} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
