import Link from 'next/link';
import { useIntl } from 'react-intl';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';

const NotFound = () => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'page_not_found',
              defaultMessage: 'Page Not Found',
            })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
                {formatMessage({
                  id: 'error_404',
                  defaultMessage: '404 Error',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'not_found_message',
                  defaultMessage:
                    "Sorry, we couldn't find the page you're looking for.",
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Link
                href="/"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 py-2 px-4 text-sm font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2"
              >
                {formatMessage({
                  id: 'back_to_home',
                  defaultMessage: 'Back to Home',
                })}
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="group relative flex w-full justify-center rounded-md border border-slate-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2"
              >
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

export default NotFound;

NotFound.getLayout = (page) => page;
