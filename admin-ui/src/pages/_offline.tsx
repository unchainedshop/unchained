import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';

const Offline = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'offline_mode',
              defaultMessage: "You're Offline",
            })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <svg
                  className="h-6 w-6 text-orange-600 dark:text-orange-400"
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
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25v15M21 12H3"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                {formatMessage({
                  id: 'connection_status',
                  defaultMessage: 'No Connection',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'no_internet_access',
                  defaultMessage:
                    "You aren't connected to a working internet connection.",
                })}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {formatMessage({
                  id: 'offline_help_message',
                  defaultMessage: 'Please check your connection and try again.',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                onClick={() => router.reload()}
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
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {formatMessage({
                  id: 'retry',
                  defaultMessage: 'Retry Connection',
                })}
              </button>

              <button
                type="button"
                onClick={() => window.history.back()}
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
                      d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414V13a1 1 0 11-2 0V9a1 1 0 011-1h4a1 1 0 110 2H4.414l3.293 3.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {formatMessage({
                  id: 'go_back',
                  defaultMessage: 'Go Back',
                })}
              </button>
            </div>
          </div>
        </FormWrapper>
      </div>
    </div>
  );
};

export default Offline;

Offline.getLayout = (page) => page;
