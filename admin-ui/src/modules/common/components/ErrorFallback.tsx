import Link from 'next/link';
import { useIntl } from 'react-intl';
import Button from './Button';
import FormWrapper from './FormWrapper';
import ImageWithFallback from './ImageWithFallback';

const ErrorFallback = ({ error = null, resetError = null }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'internal_server_error',
              defaultMessage: '500 Internal Server Error',
            })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                {formatMessage({
                  id: 'error_500',
                  defaultMessage: '500 Error',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'internal_server_error_message',
                  defaultMessage:
                    'Sorry, something went wrong on our end. We are working to fix this.',
                })}
              </p>
              {error?.message && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300">
                    {formatMessage({
                      id: 'show_error_details',
                      defaultMessage: 'Show error details',
                    })}
                  </summary>
                  <pre className="mt-2 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-all">
                    {error?.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Link
                href="/"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 py-2 px-4 text-sm font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-white group-hover:text-slate-200"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {formatMessage({
                  id: 'back_to_home',
                  defaultMessage: 'Back to Home',
                })}
              </Link>
              {resetError && (
                <button
                  type="button"
                  onClick={resetError}
                  className="group relative flex w-full justify-center rounded-md border border-slate-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2"
                >
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {formatMessage({
                    id: 'try_again',
                    defaultMessage: 'Try Again',
                  })}
                </button>
              )}
            </div>
          </div>
        </FormWrapper>
      </div>
    </div>
  );
};

export default ErrorFallback;
