import { memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { AriaLiveRegion } from './AriaLiveRegion';

/**
 * Auto-save status indicator component
 * Shows saving state, last saved time, or error messages
 */
function AutoSaveIndicator({ isSaving, lastSaved, error }) {
  const navigate = useNavigate();

  // Generate announcement message for screen readers
  const getAnnouncementMessage = () => {
    if (error) {
      const errorMsg = typeof error === 'object' ? error.message : error;
      return `Save failed: ${errorMsg}`;
    }
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
      // P0-4: Handle auth errors specially with re-login button
      const isAuthError = typeof error === 'object' && error.type === 'auth';
      // P0-1: Handle version conflicts specially
      const isConflict = typeof error === 'object' && error.type === 'conflict';
      const errorMsg = typeof error === 'object' ? error.message : error;

      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm animate-fade-in" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">{ errorMsg}</span>
          {isAuthError && (
            <button
              onClick={() => navigate('/login')}
              className="ml-2 flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
              aria-label="Re-login to save"
            >
              <LogIn className="w-3 h-3" aria-hidden="true" />
              Re-login
            </button>
          )}
          {isConflict && (
            <button
              onClick={() => window.location.reload()}
              className="ml-2 flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors"
              aria-label="Reload to see latest changes"
            >
              Refresh
            </button>
          )}
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
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      type: PropTypes.string,
      message: PropTypes.string,
      canRecover: PropTypes.bool
    })
  ])
};

export default memo(AutoSaveIndicator);
