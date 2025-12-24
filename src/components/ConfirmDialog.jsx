import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * A confirmation dialog component built on top of Modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {Function} props.onClose - Called when dialog should close
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button (default: 'Confirm')
 * @param {string} props.cancelText - Text for cancel button (default: 'Cancel')
 * @param {boolean} props.danger - Use danger styling for destructive actions (default: false)
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdropClick={false}
    >
      <div className="space-y-4">
        {/* Icon for danger variant */}
        {danger && (
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn-outline flex-1 w-full sm:w-auto focus:ring-2 focus:ring-offset-2 focus:ring-thr-blue-500 dark:focus:ring-offset-slate-800"
            autoFocus={!danger}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 w-full sm:w-auto focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
              danger
                ? 'btn-danger focus:ring-red-500'
                : 'btn-primary focus:ring-thr-blue-500'
            }`}
            autoFocus={danger}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
