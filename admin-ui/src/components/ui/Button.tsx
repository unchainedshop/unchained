import clsx from 'clsx';
import React from 'react';

export interface ButtonProps {
  /** Button text content */
  text?: string;
  /** Children content - takes precedence over text */
  children?: React.ReactNode;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Element ID */
  id?: string;
  /** Button variant */
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'quaternary'
    | 'danger'
    | 'ghost'
    | 'success'
    | 'neutral'
    | 'input';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Icon to display after text */
  iconRight?: React.ReactNode;
  /** Make button full width */
  fullWidth?: boolean;
  /** Rounded style */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Aria label for accessibility */
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  text,
  children,
  onClick,
  className = '',
  disabled = false,
  id = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  rounded = 'md',
  ariaLabel,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50';

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs h-6',
    sm: 'px-3 py-2 text-sm h-8',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-6 py-3 text-base h-11',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const variantClasses = {
    primary:
      'border border-accent bg-accent text-text-on-accent hover:bg-accent-hover focus:ring-focus-ring',
    secondary:
      'border border-border-default bg-surface text-text-secondary hover:bg-surface-raised focus:ring-focus-ring',
    tertiary:
      'border border-border-subtle bg-surface text-text-secondary hover:bg-surface-raised focus:ring-focus-ring',
    quaternary:
      'bg-transparent text-text-secondary hover:bg-surface-raised focus:ring-focus-ring',
    danger:
      'border border-danger bg-surface text-danger hover:bg-rose-50 dark:hover:bg-rose-900/10 focus:ring-rose-500',
    ghost:
      'bg-transparent border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised focus:ring-focus-ring',
    success:
      'border border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 focus:ring-emerald-500',
    neutral:
      'border border-border-default bg-surface-raised text-text-secondary hover:bg-surface-raised focus:ring-focus-ring',
    input:
      'border border-border-default bg-surface text-text-primary hover:border-slate-400 dark:hover:border-slate-500 focus:ring-focus-ring focus:border-slate-500',
  };

  const content = children || text;
  const hasIcon = icon || iconRight;
  const spacingClass = hasIcon && content ? 'gap-2' : '';

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        roundedClasses[rounded],
        variantClasses[variant],
        spacingClass,
        {
          'w-full': fullWidth,
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {content}
        </div>
      ) : (
        <>
          {icon}
          {content}
          {iconRight}
        </>
      )}
    </button>
  );
};

export default Button;
