import React, { useId } from 'react';
import './Select.css';

/**
 * Option item structure for the Select dropdown.
 */
export interface SelectOption {
  /**
   * The actual value of the option.
   */
  value: string | number;
  /**
   * The human-readable label to display.
   */
  label: string;
}

/**
 * Props for the Select component.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Dropdown options to render.
   */
  options: SelectOption[];
  /**
   * Label text above the dropdown.
   */
  label?: string;
  /**
   * Optional helper description text.
   */
  helperText?: string;
  /**
   * Error message. When provided, highlights the dropdown in red.
   */
  error?: string;
  /**
   * Optional placeholder option text.
   */
  placeholderOption?: string;
}

/**
 * Custom dropdown select component with support for labels, errors, and custom styling.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Status Filter"
 *   options={[{ value: 'active', label: 'Active' }]}
 *   onChange={(e) => console.log(e.target.value)}
 * />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  options,
  label,
  helperText,
  error,
  placeholderOption,
  className = '',
  disabled,
  id,
  required,
  value,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div
      className={`ui-select-container ${disabled ? 'ui-select-container--disabled' : ''} ${className}`}
    >
      {label && (
        <label htmlFor={selectId} className="ui-select-label">
          {label}
          {required && (
            <span className="ui-select-required-star" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <div className="ui-select-wrapper">
        <select
          id={selectId}
          className={`ui-select-field ${error ? 'ui-select-field--error' : ''} ${
            value === '' || value === undefined
              ? 'ui-select-field--placeholder'
              : ''
          }`}
          disabled={disabled}
          required={required}
          value={value}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : null, helperText ? helperId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...props}
        >
          {placeholderOption && (
            <option value="" disabled hidden={required}>
              {placeholderOption}
            </option>
          )}
          {options.map((opt, index) => (
            <option key={`${opt.value}-${index}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="ui-select-arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
      {error && (
        <p id={errorId} className="ui-select-error-msg" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="ui-select-helper-msg">
          {helperText}
        </p>
      )}
    </div>
  );
};
