import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

/**
 * FormInput - Enhanced form input component with validation states
 *
 * Features:
 * - Visual error/success indicators (colored borders + icons)
 * - Shake animation on error
 * - Help text support
 * - Required field indicator
 * - Full accessibility (ARIA labels, error descriptions)
 * - Auto-focus on error
 *
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} props.id - Input ID (required for accessibility)
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Input name attribute
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.error - Error message (shows error state if present)
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.helpText - Optional help text below input
 * @param {string} props.autoComplete - Autocomplete attribute
 * @param {string} props.inputMode - Input mode for mobile keyboards
 * @param {string} props.autoCapitalize - Auto-capitalization setting
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.className - Additional CSS classes
 */
const FormInput = forwardRef(({
  label,
  id,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  required = false,
  placeholder,
  helpText,
  autoComplete,
  inputMode,
  autoCapitalize,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="label flex items-center gap-1.5"
        >
          {label}
          {required && <span className="text-red-500" aria-label="required">*</span>}
          {helpText && (
            <span className="ml-auto">
              <HelpCircle
                className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-help"
                title={helpText}
              />
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            hasError ? `${id}-error` : helpText ? `${id}-help` : undefined
          }
          className={`input-field pr-10 transition-all duration-200 ${
            hasError
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 animate-shake'
              : isValid
              ? 'border-green-300 dark:border-green-600 focus:ring-green-500/20 focus:border-green-500 dark:focus:border-green-500'
              : ''
          }`}
          {...props}
        />

        {/* Status Icon */}
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 animate-scale-in" />
            ) : isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 animate-scale-in" />
            ) : null}
          </div>
        )}
      </div>

      {/* Help Text */}
      {helpText && !hasError && (
        <p id={`${id}-help`} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {hasError && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5 animate-slide-down"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

FormInput.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  helpText: PropTypes.string,
  autoComplete: PropTypes.string,
  inputMode: PropTypes.string,
  autoCapitalize: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default FormInput;
