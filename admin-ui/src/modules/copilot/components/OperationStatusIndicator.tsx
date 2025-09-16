import React from 'react';
import { useIntl } from 'react-intl';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const OperationStatusIndicator = ({ success }) => {
  const { formatMessage } = useIntl();

  return success ? (
    <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-md">
      <CheckCircleIcon className="w-5 h-5" />
      <span>
        {formatMessage({
          id: 'operation_success',
          defaultMessage: 'Operation succeeded!',
        })}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2 p-3 bg-red-100 text-red-800 rounded-md">
      <XCircleIcon className="w-5 h-5" />
      <span>
        {formatMessage({
          id: 'operation_failed',
          defaultMessage: 'Operation failed!!',
        })}
      </span>
    </div>
  );
};

export default OperationStatusIndicator;
