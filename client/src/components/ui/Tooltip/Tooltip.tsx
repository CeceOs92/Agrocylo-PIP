import React, { useState, useId } from 'react';
import './Tooltip.css';

/**
 * Props for the Tooltip component.
 */
export interface TooltipProps {
  /**
   * The text or node content to show inside the tooltip popup.
   */
  content: React.ReactNode;
  /**
   * Preferred placement relative to the trigger.
   * @default 'top'
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The trigger element that shows the tooltip on hover or keyboard focus.
   */
  children: React.ReactElement<any>;
}

/**
 * Tooltip popup component providing context on hover or keyboard focus.
 *
 * @example
 * ```tsx
 * <Tooltip content="Must be at least 8 characters" position="right">
 *   <input type="password" />
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  // Clone children to inject event handlers and aria parameters.
  // This allows the tooltip to be triggerable without wrapping children in a redundant span
  // that could break CSS layout flex/grid structures.
  const triggerEl = React.cloneElement(children, {
    'aria-describedby': tooltipId,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      if (children.props.onBlur) children.props.onBlur(e);
    },
  });

  return (
    <div className="ui-tooltip-wrapper">
      {triggerEl}
      {isVisible && (
        <div
          id={tooltipId}
          className={`ui-tooltip-bubble ui-tooltip-bubble--${position}`}
          role="tooltip"
        >
          {content}
          <div className="ui-tooltip-arrow" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
