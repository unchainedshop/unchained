import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';

interface HelpTextProps {
  messageKey: string;
  defaultMessage?: string;
  values?: Record<string, any>;
  className?: string;
  showIcon?: boolean;
}

const HelpText: React.FC<HelpTextProps> = ({
  messageKey,
  defaultMessage,
  values,
  className = '',
  showIcon = true,
}) => {
  const { formatMessage } = useIntl();

  const helpText = formatMessage(
    {
      id: messageKey,
      defaultMessage,
    },
    values,
  );

  if (!helpText) return null;

  return (
    <div
      className={`flex items-start space-x-1 text-sm text-slate-600 dark:text-slate-400 ${className}`}
    >
      {showIcon && (
        <QuestionMarkCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{helpText}</span>
    </div>
  );
};

export default HelpText;
