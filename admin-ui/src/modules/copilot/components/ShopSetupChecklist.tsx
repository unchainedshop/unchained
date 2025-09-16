import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useShopConfiguration from '../../common/hooks/useShopConfiguration';
import ProgressIndicator from './ProgressIndicator';
import SetupStepCard from './SetupStepCard';
import { Step } from '../../common/utils/getSetupStepsConfigurationsMeta';
import useApp from '../../common/hooks/useApp';

interface ShopSetupChecklistProps {
  className?: string;
}

const ShopSetupChecklist: React.FC<ShopSetupChecklistProps> = ({
  className,
}) => {
  const { formatMessage } = useIntl();
  const { configuration, loading, error } = useShopConfiguration();
  const { isSystemReady } = useApp();
  const [expandedSections, setExpandedSections] = useState({
    essential: true,
    commerce: false,
    content: false,
  });
  const [isSetupMessageDismissed, setIsSetupMessageDismissed] = useState(() => {
    // Check if the setup complete message was already dismissed
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shop_setup_message_dismissed') === 'true';
    }
    return false;
  });
  const { isFullyConfigured } = configuration;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDismissSetupMessage = () => {
    setIsSetupMessageDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shop_setup_message_dismissed', 'true');
    }
  };

  useEffect(() => {
    if (configuration)
      setExpandedSections({
        commerce: !configuration.commerceStepsComplete,
        essential: !configuration.essentialStepsComplete,
        content:
          configuration.commerceStepsComplete &&
          !configuration.contentStepsComplete,
      });
  }, [configuration]);

  if (!configuration || loading) {
    return null;
  }

  if (error) {
    return null;
  }

  // Show success message only once when setup is complete
  if (isFullyConfigured && !isSetupMessageDismissed) {
    return (
      <div
        className={classNames(
          'p-6 bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/50',
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
              {formatMessage({
                id: 'shop_setup_complete',
                defaultMessage: 'Shop Setup Complete!',
              })}
            </h3>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">
              {formatMessage({
                id: 'shop_setup_complete_description',
                defaultMessage:
                  'Congratulations! Your shop is fully configured and ready to accept orders.',
              })}
            </p>
          </div>
          <button
            onClick={handleDismissSetupMessage}
            className="flex-shrink-0 p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors"
            title={formatMessage({
              id: 'dismiss',
              defaultMessage: 'Dismiss',
            })}
          >
            <XMarkIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>
    );
  }

  // Hide entire setup checklist if setup is complete and has been acknowledged
  if (isFullyConfigured && isSetupMessageDismissed) {
    return null;
  }

  const getCategoryProgress = (steps: Step[]) => {
    if (steps.length === 0) return 100;
    const completed = steps.filter((step) => step.isComplete).length;
    return Math.round((completed / steps.length) * 100);
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'essential':
        return formatMessage({
          id: 'essential_setup',
          defaultMessage: 'Essential Setup',
        });
      case 'commerce':
        return formatMessage({
          id: 'commerce_setup',
          defaultMessage: 'Commerce Setup',
        });
      case 'content':
        return formatMessage({
          id: 'content_setup',
          defaultMessage: 'Content Setup',
        });
      default:
        return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'essential':
        return formatMessage({
          id: 'essential_setup_description',
          defaultMessage: 'Core settings required for your shop to function',
        });
      case 'commerce':
        return formatMessage({
          id: 'commerce_setup_description',
          defaultMessage: 'Payment and delivery configuration for transactions',
        });
      case 'content':
        return formatMessage({
          id: 'content_setup_description',
          defaultMessage: 'Products and categories to start selling',
        });
      default:
        return '';
    }
  };

  const renderSection = (
    category: keyof typeof expandedSections,
    steps: Step[],
    isComplete: boolean = false,
  ) => {
    const isExpanded = expandedSections[category];
    const progress = getCategoryProgress(steps);

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(category)}
          className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {getCategoryTitle(category)}
                  {!isComplete && <span className="text-rose-500 ml-1">*</span>}
                </h3>
                <ProgressIndicator
                  progress={progress}
                  size="sm"
                  className="w-24"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {getCategoryDescription(category)}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 space-y-3 bg-white dark:bg-slate-800">
            {steps.map((step) => (
              <SetupStepCard key={step.icon} step={step} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden',
        className,
      )}
    >
      <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-xl flex items-center justify-center">
              <RocketLaunchIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {formatMessage({
                id: 'complete_shop_setup',
                defaultMessage: 'Complete Your Shop Setup',
              })}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {formatMessage({
                id: 'shop_setup_description',
                defaultMessage:
                  'Follow these steps to configure your shop and start selling.',
              })}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {formatMessage({
                    id: 'overall_progress',
                    defaultMessage: 'Overall Progress',
                  })}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {configuration.completedSteps.length} of{' '}
                  {Object.keys(configuration.steps).length} complete
                </span>
              </div>
              <ProgressIndicator
                progress={configuration.overallProgress}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {renderSection(
          'essential',
          configuration.essentialSteps,
          configuration.essentialStepsComplete,
        )}
        {isSystemReady &&
          renderSection(
            'commerce',
            configuration.commerceSteps,
            configuration.commerceStepsComplete,
          )}
        {isSystemReady &&
          renderSection(
            'content',
            configuration.contentSteps,
            configuration.contentStepsComplete,
          )}

        {/* Footer note */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-rose-500 rounded-full"></span>
            {formatMessage({
              id: 'required_steps_note',
              defaultMessage: 'Required for basic shop functionality',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopSetupChecklist;
