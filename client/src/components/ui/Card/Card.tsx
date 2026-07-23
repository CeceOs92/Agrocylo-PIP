import React from 'react';
import './Card.css';

/**
 * Props for the Card component.
 */
export interface CardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /**
   * Title text or element for the Card header.
   */
  title?: React.ReactNode;
  /**
   * Optional description text below the title.
   */
  description?: string;
  /**
   * Footer actions or content.
   */
  footer?: React.ReactNode;
  /**
   * Enables a hover scale and cursor style if the card is clickable.
   */
  isClickable?: boolean;
}

/**
 * Card container component used to group related information in a structured visual layout.
 *
 * @example
 * ```tsx
 * <Card title="Project Escrow" description="Farmer escrow account details" footer={<Button>View</Button>}>
 *   <p>Balance: 1,000 XLM</p>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  title,
  description,
  footer,
  isClickable = false,
  children,
  className = '',
  ...props
}) => {
  const isInteractive = isClickable || !!props.onClick;

  return (
    <div
      className={`ui-card ${isInteractive ? 'ui-card--interactive' : ''} ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="ui-card-header">
          {title && <h3 className="ui-card-title">{title}</h3>}
          {description && <p className="ui-card-description">{description}</p>}
        </div>
      )}
      {children && <div className="ui-card-content">{children}</div>}
      {footer && <div className="ui-card-footer">{footer}</div>}
    </div>
  );
};
