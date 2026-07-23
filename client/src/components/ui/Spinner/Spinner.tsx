import React from 'react';
import './Spinner.css';

/**
 * Props for the Spinner component.
 */
export interface SpinnerProps {
  /**
   * The size of the spinner.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The color variant of the spinner.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'light';
  /**
   * Custom CSS class name to append.
   */
  className?: string;
}

/**
 * Spinner component used to display a loading state.
 *
 * @example
 * ```tsx
 * <Spinner size="md" variant="primary" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="loading"
      className={`ui-spinner ui-spinner--${size} ui-spinner--${variant} ${className}`}
    >
      <span className="ui-spinner-sr-only">Loading...</span>
    </div>
  );
};
