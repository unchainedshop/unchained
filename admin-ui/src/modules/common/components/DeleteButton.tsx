import { TrashIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { useIntl } from 'react-intl';

const DeleteButton = ({
  onClick,
  className: classes = '',
  icon = null,
  textRight = '',
  textLeft = '',
  ariaLabel = '',
}) => {
  const { formatMessage } = useIntl();
  return (
    <button
      aria-label={
        ariaLabel || formatMessage({ id: 'delete', defaultMessage: 'Delete' })
      }
      id="delete_button"
      type="button"
      onClick={onClick}
      className={classNames(
        'flex justify-center items-center rounded-full dark:bg-slate-800 p-2 w-8 h-8 text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
        classes,
      )}
    >
      {textLeft || ''}
      {icon || <TrashIcon className="h-5 w-5" />}
      {textRight || ''}
    </button>
  );
};

export default DeleteButton;
