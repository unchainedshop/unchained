import classnames from 'classnames';
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
      'border border-slate-800 dark:border-slate-600 bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-900 dark:hover:bg-slate-500 focus:ring-slate-800 dark:focus:ring-slate-400',
    secondary:
      'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-500',
    tertiary:
      'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400',
    quaternary:
      'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    danger:
      'border border-rose-500 dark:border-rose-400 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 focus:ring-rose-500',
    ghost:
      'bg-transparent border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    success:
      'border border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 focus:ring-emerald-500',
    neutral:
      'border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400',
    input:
      'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-slate-500 focus:border-slate-500',
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
      className={classnames(
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
