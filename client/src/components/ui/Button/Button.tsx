import React from 'react';
import { Spinner } from '../Spinner/Spinner';
import './Button.css';

/**
 * Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual variant style of the button.
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  /**
   * The size of the button.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Puts the button in a loading state, disabling interactions and displaying a spinner.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Optional icon to render inside the button.
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon relative to the children.
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
}

/**
 * Button component supporting various states, layouts, and loading transitions.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={() => alert('clicked!')}>
 *   Click Me
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${
        isLoading ? 'ui-button--loading' : ''
      } ${className}`}
      disabled={isButtonDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <Spinner
          size="sm"
          variant={
            variant === 'primary' ||
            variant === 'secondary' ||
            variant === 'danger'
              ? 'light'
              : 'primary'
          }
          className="ui-button__spinner"
        />
      )}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="ui-button__icon ui-button__icon--left">{icon}</span>
      )}
      <span className="ui-button__text">{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="ui-button__icon ui-button__icon--right">{icon}</span>
      )}
    </button>
  );
};
