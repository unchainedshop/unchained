import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useIntl } from 'react-intl';

const ActiveInActive = ({
  isActive,
  activeText = null,
  activeClassName = '',
  inActiveClassName = '',
  inActiveText = null,
  containerClassName = '',
}) => {
  const { formatMessage } = useIntl();
  return (
    <span className={classNames('', containerClassName)}>
      {isActive ? (
        <span
          className={classNames(
            'inline-flex items-center border rounded-full px-2.5 py-0.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 uppercase',
            activeClassName,
          )}
        >
          {activeText ||
            formatMessage({
              id: 'active',
              defaultMessage: 'Active',
            })}
        </span>
      ) : (
        <span
          className={classNames(
            'inline-flex items-center border rounded-full px-2.5 py-0.5 text-sm font-medium bg-amber-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-amber-400 dark:border-yellow-800 uppercase',
            inActiveClassName,
          )}
        >
          {inActiveText ||
            formatMessage({
              id: 'inactive',
              defaultMessage: 'In-Active',
            })}
        </span>
      )}
    </span>
  );
};

export default ActiveInActive;
