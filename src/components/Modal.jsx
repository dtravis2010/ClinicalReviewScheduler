import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * A reusable, accessible Modal component with focus trap and keyboard navigation
 * Modern THR-styled with clean design
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal should close
 * @param {string} props.title - Modal title for aria-labelledby
 * @param {React.ReactNode} props.children - Modal content
 * @param {('sm'|'md'|'lg'|'xl')} props.size - Modal width size
 * @param {boolean} props.showCloseButton - Show close button in header (default: true)
 * @param {boolean} props.closeOnBackdropClick - Allow closing on backdrop click (default: true)
 * @param {boolean} props.closeOnEsc - Allow closing on ESC key (default: true)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true
}) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);

  // Size mapping - Modern 20px rounded corners
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Focus trap: get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(
      modalRef.current.querySelectorAll(focusableSelectors.join(','))
    );
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEsc]);

  // Focus trap and management
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElementRef.current = document.activeElement;

    // Focus first element in modal
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Tab trap handler
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    // Cleanup: restore focus
    return () => {
      document.removeEventListener('keydown', handleTab);
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, getFocusableElements]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose, closeOnBackdropClick]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal - Modern THR styling with 20px rounded corners */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-soft-lg w-full ${sizeClasses[size]} animate-scale-up`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
            {title && (
              <h3 id={titleId.current} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
}
