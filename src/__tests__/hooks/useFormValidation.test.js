import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, validationPresets } from '../../hooks/useFormValidation.js';

describe('useFormValidation', () => {
  describe('initialization', () => {
    it('should initialize with provided values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useFormValidation(initialValues, {}));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('should start with isValid as true when no validation rules', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }, {}));

      expect(result.current.isValid).toBe(true);
    });
  });

  describe('required validation', () => {
    it('should validate required fields', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Name is required');
    });

    it('should pass validation when required field has value', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });

    it('should validate required array fields', () => {
      const rules = {
        skills: [{ type: 'required', message: 'At least one skill is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ skills: [] }, rules));

      act(() => {
        result.current.handleBlur('skills');
      });

      expect(result.current.errors.skills).toBe('At least one skill is required');
    });
  });

  describe('minLength validation', () => {
    it('should validate minimum length', () => {
      const rules = {
        name: [{ type: 'minLength', value: 3, message: 'Name must be at least 3 characters' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'Jo' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Name must be at least 3 characters');
    });

    it('should pass validation when length is sufficient', () => {
      const rules = {
        name: [{ type: 'minLength', value: 3 }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('maxLength validation', () => {
    it('should validate maximum length', () => {
      const rules = {
        name: [{ type: 'maxLength', value: 5, message: 'Name must be at most 5 characters' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'Jonathan' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Name must be at most 5 characters');
    });

    it('should pass validation when length is within limit', () => {
      const rules = {
        name: [{ type: 'maxLength', value: 10 }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('email validation', () => {
    it('should validate email format', () => {
      const rules = {
        email: [{ type: 'email', message: 'Invalid email' }]
      };
      const { result } = renderHook(() => useFormValidation({ email: 'invalid-email' }, rules));

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.errors.email).toBe('Invalid email');
    });

    it('should pass validation for valid email', () => {
      const rules = {
        email: [{ type: 'email' }]
      };
      const { result } = renderHook(() => useFormValidation({ email: 'john@example.com' }, rules));

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('should allow empty email when not required', () => {
      const rules = {
        email: [{ type: 'email' }]
      };
      const { result } = renderHook(() => useFormValidation({ email: '' }, rules));

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('pattern validation', () => {
    it('should validate against regex pattern', () => {
      const rules = {
        phone: [{ type: 'pattern', value: /^\d{3}-\d{3}-\d{4}$/, message: 'Invalid phone format' }]
      };
      const { result } = renderHook(() => useFormValidation({ phone: '1234567890' }, rules));

      act(() => {
        result.current.handleBlur('phone');
      });

      expect(result.current.errors.phone).toBe('Invalid phone format');
    });

    it('should pass validation for matching pattern', () => {
      const rules = {
        phone: [{ type: 'pattern', value: /^\d{3}-\d{3}-\d{4}$/ }]
      };
      const { result } = renderHook(() => useFormValidation({ phone: '123-456-7890' }, rules));

      act(() => {
        result.current.handleBlur('phone');
      });

      expect(result.current.errors.phone).toBeUndefined();
    });
  });

  describe('custom validation', () => {
    it('should support custom validation functions', () => {
      const rules = {
        password: [{
          type: 'custom',
          validate: (value) => value.length >= 8 ? null : 'Password must be at least 8 characters'
        }]
      };
      const { result } = renderHook(() => useFormValidation({ password: 'short' }, rules));

      act(() => {
        result.current.handleBlur('password');
      });

      expect(result.current.errors.password).toBe('Password must be at least 8 characters');
    });
  });

  describe('handleChange', () => {
    it('should update field value', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }, {}));

      act(() => {
        result.current.handleChange('name', 'John');
      });

      expect(result.current.values.name).toBe('John');
    });

    it('should validate on change if field has been touched', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Name is required');

      act(() => {
        result.current.handleChange('name', 'John');
      });

      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched', () => {
      const { result } = renderHook(() => useFormValidation({ name: '' }, {}));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should trigger validation on blur', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.errors.name).toBe('Name is required');
    });
  });

  describe('validateForm', () => {
    it('should validate all fields', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }],
        email: [{ type: 'required', message: 'Email is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '', email: '' }, rules));

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('Name is required');
      expect(result.current.errors.email).toBe('Email is required');
    });

    it('should return true when all fields are valid', () => {
      const rules = {
        name: [{ type: 'required' }],
        email: [{ type: 'required' }, { type: 'email' }]
      };
      const { result } = renderHook(() =>
        useFormValidation({ name: 'John', email: 'john@example.com' }, rules)
      );

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('resetForm', () => {
    it('should reset form to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useFormValidation(initialValues, {}));

      act(() => {
        result.current.handleChange('name', 'Jane');
        result.current.handleBlur('name');
      });

      expect(result.current.values.name).toBe('Jane');
      expect(result.current.touched.name).toBe(true);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });

    it('should reset form to new values', () => {
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, {}));

      act(() => {
        result.current.resetForm({ name: 'Jane' });
      });

      expect(result.current.values.name).toBe('Jane');
    });
  });

  describe('getFieldProps', () => {
    it('should return field props for easy integration', () => {
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, {}));

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps.value).toBe('John');
      expect(typeof fieldProps.onChange).toBe('function');
      expect(typeof fieldProps.onBlur).toBe('function');
    });

    it('should include error when field is touched and has error', () => {
      const rules = {
        name: [{ type: 'required', message: 'Name is required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '' }, rules));

      act(() => {
        result.current.handleBlur('name');
      });

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps.error).toBe('Name is required');
    });
  });

  describe('isValid property', () => {
    it('should be true when all fields are valid', () => {
      const rules = {
        name: [{ type: 'required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, rules));

      expect(result.current.isValid).toBe(true);
    });

    it('should be false when any field is invalid', () => {
      const rules = {
        name: [{ type: 'required' }]
      };
      const { result } = renderHook(() => useFormValidation({ name: '' }, rules));

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('validationPresets', () => {
    it('should export name preset', () => {
      expect(validationPresets.name).toBeDefined();
      expect(Array.isArray(validationPresets.name)).toBe(true);
    });

    it('should export email preset', () => {
      expect(validationPresets.email).toBeDefined();
      expect(Array.isArray(validationPresets.email)).toBe(true);
    });

    it('should export optionalEmail preset', () => {
      expect(validationPresets.optionalEmail).toBeDefined();
      expect(Array.isArray(validationPresets.optionalEmail)).toBe(true);
    });

    it('should export entityName preset', () => {
      expect(validationPresets.entityName).toBeDefined();
      expect(Array.isArray(validationPresets.entityName)).toBe(true);
    });
  });
});
