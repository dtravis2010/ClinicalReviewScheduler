import React, { useEffect, useState } from 'react';

/**
 * ARIA live region component for announcing dynamic content changes to screen readers
 * 
 * @param {Object} props
 * @param {string} props.message - Message to announce
 * @param {('polite'|'assertive')} props.mode - Announcement priority
 * @param {string} props.className - Additional CSS classes
 */
export function AriaLiveRegion({ message, mode = 'polite', className = '' }) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      // Clear the announcement first to ensure it's re-announced even if the same
      setAnnouncement('');
      
      // Use a small delay to ensure the screen reader picks up the change
      const timer = setTimeout(() => {
        setAnnouncement(message);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {announcement}
    </div>
  );
}

/**
 * Screen reader only text component
 * Visually hidden but accessible to screen readers
 */
export function ScreenReaderOnly({ children, as: Component = 'span' }) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}
