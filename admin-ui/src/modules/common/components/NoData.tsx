import { NoSymbolIcon } from '@heroicons/react/24/outline';
import classnames from 'classnames';
import { FormattedMessage } from 'react-intl';

const NoData = ({ message, className = '', Icon = null }) => {
  return (
    <div
      className={classnames(
        'rounded-md flex w-full flex-col items-center justify-center min-h-[176px] py-8 border-1 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-600',
        className,
      )}
    >
      <div className="grid items-center justify-center">
        <div className="flex items-center justify-center text-slate-400 dark:text-slate-600">
          {Icon || <NoSymbolIcon className="h-6 w-6" />}
        </div>

        <FormattedMessage
          id="no_data_message"
          defaultMessage="<p>No <span>  {message}  available</span> </p>"
          values={{
            p: (chunks) => (
              <p className="mt-2 m-auto flex items-center justify-center">
                {chunks}
              </p>
            ),
            span: (chunks) => (
              <span className="capitalize ml-1"> {chunks} </span>
            ),
            message,
          }}
        />
      </div>
    </div>
  );
};

export default NoData;
