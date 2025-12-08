import { memo } from 'react';
import PropTypes from 'prop-types';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { AriaLiveRegion } from './AriaLiveRegion';

/**
 * Auto-save status indicator component
 * Shows saving state, last saved time, or error messages
 */
function AutoSaveIndicator({ isSaving, lastSaved, error }) {
  // Generate announcement message for screen readers
  const getAnnouncementMessage = () => {
    if (error) return `Save failed: ${error}`;
    if (isSaving) return 'Saving changes';
    if (lastSaved) return 'Changes saved successfully';
    return '';
  };
  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const content = (() => {
    if (error) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm animate-fade-in" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">Save failed: {error}</span>
        </div>
      );
    }

    if (isSaving) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm animate-fade-in">
          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" aria-hidden="true" />
          <span className="font-medium">Saving...</span>
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">Saved {formatTime(lastSaved)}</span>
        </div>
      );
    }

    return null;
  })();

  return (
    <>
      <AriaLiveRegion message={getAnnouncementMessage()} mode={error ? 'assertive' : 'polite'} />
      {content}
    </>
  );
}

AutoSaveIndicator.propTypes = {
  isSaving: PropTypes.bool,
  lastSaved: PropTypes.instanceOf(Date),
  error: PropTypes.string
};

export default memo(AutoSaveIndicator);
