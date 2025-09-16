import { XMarkIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';

const HeaderDeleteButton = ({ onClick, text = null, Icon = null }) => {
  const { formatMessage } = useIntl();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-describedby="header-delete-button"
      className="inline-flex items-center gap-2 justify-center rounded-md border border-rose-500 px-4 py-2 text-sm font-medium leading-5 text-rose-600 dark:text-rose-200 shadow-sm hover:border-rose-600 hover:bg-rose-600 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 h-[38px]"
    >
      <span>{Icon || <XMarkIcon className="h-5 w-5" />}</span>
      {text ||
        formatMessage({
          id: 'delete',
          defaultMessage: 'Delete',
        })}
    </button>
  );
};

export default HeaderDeleteButton;
