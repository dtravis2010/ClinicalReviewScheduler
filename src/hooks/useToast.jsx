import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Custom hook for toast notifications with helper functions
 * Uses react-hot-toast library with custom styling
 */
export function useToast() {
  /**
   * Show a success toast notification
   * @param {string} message - The success message to display
   */
  const showSuccess = (message) => {
    toast.success(message, {
      icon: '✓',
    });
  };

  /**
   * Show an error toast notification
   * @param {string} message - The error message to display
   */
  const showError = (message) => {
    toast.error(message, {
      icon: '✕',
    });
  };

  /**
   * Show a warning toast notification (uses custom styling)
   * @param {string} message - The warning message to display
   */
  const showWarning = (message) => {
    toast(message, {
      icon: '⚠',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b',
      },
      iconTheme: {
        primary: '#f59e0b',
        secondary: '#fff',
      },
    });
  };

  /**
   * Show an info toast notification (uses blue theme)
   * @param {string} message - The info message to display
   */
  const showInfo = (message) => {
    toast(message, {
      icon: 'ℹ',
      style: {
        background: '#e6f0ff',
        color: '#003d7a',
        border: '1px solid #0066cc',
      },
      iconTheme: {
        primary: '#0066cc',
        secondary: '#fff',
      },
    });
  };

  /**
   * Show a loading toast notification
   * @param {string} message - The loading message to display
   * @returns {string} Toast ID to be used with promise or dismiss
   */
  const showLoading = (message) => {
    return toast.loading(message);
  };

  /**
   * Promise-based confirmation dialog using toasts
   * @param {string} message - The confirmation message
   * @param {Object} options - Configuration options
   * @param {string} options.confirmText - Text for confirm button (default: 'Confirm')
   * @param {string} options.cancelText - Text for cancel button (default: 'Cancel')
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  const showConfirm = (message, options = {}) => {
    const {
      confirmText = 'Confirm',
      cancelText = 'Cancel',
    } = options;

    return new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-yellow-500 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-thr-blue-500 rounded hover:bg-thr-blue-600 transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #f59e0b',
            maxWidth: '500px',
          },
        }
      );
    });
  };

  /**
   * Dismiss a specific toast by ID
   * @param {string} toastId - The ID of the toast to dismiss
   */
  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  /**
   * Dismiss all active toasts
   */
  const dismissAll = () => {
    toast.dismiss();
  };

  /**
   * Update an existing toast (useful for loading states)
   * @param {string} toastId - The ID of the toast to update
   * @param {Object} options - Toast options
   */
  const update = (toastId, options) => {
    toast.dismiss(toastId);
    if (options.type === 'success') {
      toast.success(options.message);
    } else if (options.type === 'error') {
      toast.error(options.message);
    }
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showConfirm,
    dismiss,
    dismissAll,
    update,
  };
}
