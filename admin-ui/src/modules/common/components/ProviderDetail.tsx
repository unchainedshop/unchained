import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';

import { getInterfaceLabel } from '../utils/utils';
import useFormatDateTime from '../utils/useFormatDateTime';
import { PROVIDER_TYPE_CLASSES } from '../data/miscellaneous';
import ProviderConfigurationForm from './ProviderConfigurationForm';
import ActiveInActive from './ActiveInActive';
import Badge from './Badge';
const ProviderDetail = ({
  provider,
  onSubmit,
  onSubmitSuccess,
  readOnly,
  children = null,
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <div className="my-6">
      <div className="space-y-8">
        <div className="space-y-8 sm:space-y-5">
          <div className="flex items-center">
            <h3 className="text-2xl leading-6 text-slate-900 dark:text-slate-200 mr-2">
              {getInterfaceLabel(provider?.interface)}
            </h3>
            <ActiveInActive
              containerClassName="self-end"
              isActive={provider?.isActive}
            />
          </div>

          {/* Main provider info */}
          <div className="space-y-4 max-w-xs">
            <div className="flex justify-between w-full gap-3">
              <dt className="my-auto inline-block text-sm text-slate-400 ">
                {formatMessage({ id: 'type_colon', defaultMessage: 'Type:' })}
              </dt>
              <dd>
                <Badge
                  text={provider?.type}
                  color={PROVIDER_TYPE_CLASSES[provider?.type]}
                />
              </dd>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <div className="flex items-center">
                <dt className="text-sm font-normal text-slate-400 pr-2">
                  {formatMessage({
                    id: 'created_colon',
                    defaultMessage: 'Created:',
                  })}
                </dt>
                <dd className="ml-auto text-base">
                  {formatDateTime(provider?.created, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="text-sm font-normal text-slate-400 pr-2">
                  {formatMessage({
                    id: 'last_updated',
                    defaultMessage: 'Last Updated:',
                  })}
                </dt>
                <dd className="ml-auto text-base">
                  {formatDateTime(provider?.updated, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </div>
          </div>

          {/* Children displayed full width */}
          {children && <div className="w-full">{children}</div>}

          {/* Provider configuration form */}
          <ProviderConfigurationForm
            onSubmit={onSubmit}
            onSubmitSuccess={onSubmitSuccess}
            provider={provider}
            disabled={readOnly}
          />

          {/* Configuration status */}
          <div className="mt-6 mb-3">
            <dt className="inline-block text-sm font-normal text-slate-400">
              {formatMessage({
                id: 'configuration_status',
                defaultMessage: 'Configuration status',
              })}
            </dt>
            {provider?.configurationError ? (
              <dd className="mt-2">
                <div className="flex items-start p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md">
                  <svg
                    className="h-5 w-5 text-rose-400 dark:text-rose-500 mt-0.5 mr-3 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-rose-800 dark:text-rose-200">
                      {formatMessage({
                        id: 'configuration_invalid',
                        defaultMessage: 'Invalid configuration',
                      })}
                    </h3>
                    <div className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                      {provider?.configurationError}
                    </div>
                  </div>
                </div>
              </dd>
            ) : (
              <dd className="mt-2">
                <div className="flex items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      {formatMessage({
                        id: 'configuration_valid',
                        defaultMessage: 'Valid configuration',
                      })}
                    </h3>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                      {formatMessage({
                        id: 'configuration_valid_description',
                        defaultMessage:
                          'All configuration parameters are correctly set and validated.',
                      })}
                    </p>
                  </div>
                </div>
              </dd>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;
