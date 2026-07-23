import React, { useId } from 'react';
import './Input.css';

/**
 * Props for the Input component.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text for the input field.
   */
  label?: string;
  /**
   * Error message. When provided, the input displays an error state and message.
   */
  error?: string;
  /**
   * Helper description text to show below the input.
   */
  helperText?: string;
}

/**
 * Input field component supporting accessibility, floating labels, errors, and custom layout.
 *
 * @example
 * ```tsx
 * <Input label="Email Address" error="Please enter a valid email" type="email" />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  disabled,
  id,
  required,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div
      className={`ui-input-container ${disabled ? 'ui-input-container--disabled' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
          {required && (
            <span className="ui-input-required-star" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={`ui-input-field ${error ? 'ui-input-field--error' : ''}`}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          [error ? errorId : null, helperText ? helperId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {error && (
        <p id={errorId} className="ui-input-error-msg" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="ui-input-helper-msg">
          {helperText}
        </p>
      )}
    </div>
  );
};
