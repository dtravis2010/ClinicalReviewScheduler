import { useState, useEffect } from 'react';

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and validation helpers
 */
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Validation functions
  const validators = {
    required: (value, message = 'This field is required') => {
      if (Array.isArray(value)) {
        return value.length > 0 ? null : message;
      }
      return value && value.trim() !== '' ? null : message;
    },

    minLength: (value, min, message) => {
      if (!value) return null;
      return value.length >= min ? null : message || `Must be at least ${min} characters`;
    },

    maxLength: (value, max, message) => {
      if (!value) return null;
      return value.length <= max ? null : message || `Must be at most ${max} characters`;
    },

    email: (value, message = 'Invalid email format') => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    },

    pattern: (value, regex, message = 'Invalid format') => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },

    custom: (value, validatorFn) => {
      return validatorFn(value);
    }
  };

  // Validate a single field
  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const { type, ...params } = rule;
      const validator = validators[type];

      if (!validator) {
        console.warn(`Unknown validator type: ${type}`);
        continue;
      }

      let error;
      if (type === 'custom') {
        error = validator(value, params.validate);
      } else if (type === 'required') {
        error = validator(value, params.message);
      } else if (type === 'minLength' || type === 'maxLength') {
        error = validator(value, params.value, params.message);
      } else if (type === 'pattern') {
        error = validator(value, params.value, params.message);
      } else {
        error = validator(value, params.message);
      }

      if (error) {
        return error;
      }
    }

    return null;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Validate on change if field has been touched
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate on blur
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Reset form
  const resetForm = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  // Check if form is valid
  const isValid = Object.keys(validationRules).every(fieldName => {
    return !validateField(fieldName, values[fieldName]);
  });

  // Get field props for easy integration
  const getFieldProps = (fieldName) => ({
    value: values[fieldName] || '',
    onChange: (e) => {
      const value = e.target.value;
      handleChange(fieldName, value);
    },
    onBlur: () => handleBlur(fieldName),
    error: touched[fieldName] && errors[fieldName],
    isValid: touched[fieldName] && !errors[fieldName] && values[fieldName]
  });

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    setValues,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    resetForm,
    getFieldProps
  };
}

/**
 * Common validation rule presets
 */
export const validationPresets = {
  name: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' }
  ],

  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Please enter a valid email address' }
  ],

  optionalEmail: [
    { type: 'email', message: 'Please enter a valid email address' }
  ],

  entityName: [
    { type: 'required', message: 'Entity name is required' },
    { type: 'minLength', value: 2, message: 'Entity name must be at least 2 characters' }
  ]
};
