import React from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import {
  CheckIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  CreditCardIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  FolderIcon,
  FunnelIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Step } from '../../common/utils/getSetupStepsConfigurationsMeta';

interface SetupStepCardProps {
  step: Step;
  onStepClick?: (step: Step) => void;
}

const iconMap = {
  globe: GlobeAltIcon,
  currency: CurrencyDollarIcon,
  language: LanguageIcon,
  'credit-card': CreditCardIcon,
  truck: TruckIcon,
  warehouse: BuildingStorefrontIcon,
  cube: CubeIcon,
  folder: FolderIcon,
  funnel: FunnelIcon,
};

const SetupStepCard: React.FC<SetupStepCardProps> = ({ step, onStepClick }) => {
  const { formatMessage } = useIntl();
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || CubeIcon;

  const handleClick = () => {
    if (onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div
      className={classNames(
        'relative p-4 rounded-lg border transition-all duration-200',
        step.isComplete
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/50'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
        !step.isComplete && 'cursor-pointer',
      )}
      onClick={!step.isComplete ? handleClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            step.isComplete
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-slate-100 dark:bg-slate-700',
          )}
        >
          {step.isComplete ? (
            <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <IconComponent
              className={classNames(
                'w-5 h-5',
                step.isRequired
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-slate-500 dark:text-slate-500',
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={classNames(
                  'font-medium text-sm',
                  step.isComplete
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-900 dark:text-slate-100',
                )}
              >
                {step.title}
                {step.isRequired && !step.isComplete && (
                  <span className="text-rose-500 ml-1">*</span>
                )}
              </h4>
              <p
                className={classNames(
                  'text-xs mt-1',
                  step.isComplete
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400',
                )}
              >
                {step.description}
              </p>
            </div>

            {/* Time estimate and status */}
            <div className="flex flex-col items-end gap-1 text-xs">
              {!step.isComplete && (
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-500">
                  <ClockIcon className="w-3 h-3" />
                  <span>{step.estimatedTime}</span>
                </div>
              )}
              {step.isComplete && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatMessage({
                    id: 'setup_complete',
                    defaultMessage: 'Complete',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Action button for incomplete steps */}
          {!step.isComplete && (
            <div className="mt-3">
              <Link href={step.setupUrl}>
                <span
                  className={classNames(
                    'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    step.isRequired
                      ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
                  )}
                >
                  {formatMessage({
                    id: 'setup_now',
                    defaultMessage: 'Setup Now',
                  })}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Required indicator */}
      {step.isRequired && !step.isComplete && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default SetupStepCard;
