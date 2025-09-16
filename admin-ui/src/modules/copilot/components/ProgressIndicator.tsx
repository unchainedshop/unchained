import React from 'react';
import classNames from 'classnames';

interface ProgressIndicatorProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  size = 'md',
  showPercentage = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-rose-500';
    if (progress < 99) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressColorBg = (progress: number) => {
    if (progress < 30) return 'bg-rose-100 dark:bg-rose-900/20';
    if (progress < 99) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-emerald-100 dark:bg-emerald-900/20';
  };

  return (
    <div className={classNames('flex items-center gap-3', className)}>
      <div className="flex-1">
        <div
          className={classNames(
            'w-full rounded-full overflow-hidden',
            sizeClasses[size],
            getProgressColorBg(progress),
          )}
        >
          <div
            className={classNames(
              'h-full transition-all duration-500 ease-out rounded-full',
              getProgressColor(progress),
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      {showPercentage && (
        <span
          className={classNames(
            'font-medium tabular-nums',
            textSizeClasses[size],
            progress === 100
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          {progress}%
        </span>
      )}
    </div>
  );
};

export default ProgressIndicator;
