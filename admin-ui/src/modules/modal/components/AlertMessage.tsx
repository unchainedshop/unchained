import { CheckIcon } from '@heroicons/react/24/outline';

const AlertMessage = ({
  onOkClick,
  buttonText,
  headerText,
  message,
  icon = null,
}) => {
  return (
    <>
      <div>
        {icon || (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckIcon
              className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            />
          </div>
        )}

        <div className="mt-3 text-center sm:mt-5">
          <h3
            className="text-lg text-slate-900 dark:text-slate-200"
            id="modal-title"
          >
            {headerText}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-200">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6">
        <button
          id="alert_ok"
          onClick={onOkClick}
          type="button"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2 sm:text-sm"
        >
          {buttonText}
        </button>
      </div>
    </>
  );
};

export default AlertMessage;
