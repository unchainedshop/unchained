import { useIntl } from 'react-intl';

const DangerMessage = ({
  onOkClick,
  onCancelClick,
  okText = null,
  cancelText = null,
  headerText = null,
  message = null,
  icon = null,
  close = null,
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <div className="sm:flex sm:items-start">
        {icon || (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <svg
              className="h-6 w-6 text-rose-600 dark:text-rose-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <h3
            className="text-lg text-slate-900 dark:text-slate-200"
            id="modal-title"
          >
            {headerText ||
              formatMessage({ id: 'warning', defaultMessage: 'Warning!' })}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-200">
              {message ||
                formatMessage({
                  id: 'are_you_sure',
                  defaultMessage: 'Are you sure?',
                })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          id="danger_continue"
          onClick={onOkClick}
          type="button"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-rose-600 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
        >
          {okText ||
            formatMessage({ id: 'continue', defaultMessage: 'Continue' })}
        </button>
        <button
          id="danger_cancel"
          onClick={onCancelClick || close}
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        >
          {cancelText ||
            formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        </button>
      </div>
    </>
  );
};

export default DangerMessage;
