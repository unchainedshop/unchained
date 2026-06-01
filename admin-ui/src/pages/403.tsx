import { LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import useCurrentUser from '../modules/accounts/hooks/useCurrentUser';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

const NotAuthorized = () => {
  const { formatMessage } = useIntl();
  const { currentUser } = useCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-text-primary">
            {formatMessage({
              id: 'unauthorized_page',
              defaultMessage: 'Access Forbidden',
            })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                <LockClosedIcon className="h-6 w-6 text-danger" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-danger">
                {formatMessage({
                  id: 'error_403',
                  defaultMessage: '403 Unauthorized',
                })}
              </p>
              <p className="mt-2 text-base text-text-muted">
                {formatMessage({
                  id: 'not_access_message',
                  defaultMessage:
                    'Sorry, the page you are trying to access has restricted access.',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {currentUser?._id ? (
                <Link
                  href="/"
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4 text-sm font-medium text-text-on-accent hover:bg-accent-hover focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
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
              ) : (
                <Link
                  href="/log-in"
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4 text-sm font-medium text-text-on-accent hover:bg-accent-hover focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
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
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {formatMessage({
                    id: 'go_to_login',
                    defaultMessage: 'Go to Login',
                  })}
                </Link>
              )}

              <button
                type="button"
                onClick={() => window.history.back()}
                className="group relative flex w-full justify-center rounded-md border border-slate-300 bg-surface-raised dark:border-slate-600 py-2 px-4 text-sm font-medium text-text-secondary hover:bg-surface-raised focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:focus:ring-focus-ring focus:ring-offset-2"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-text-muted group-hover:text-slate-600 dark:group-hover:text-slate-300"
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

export default NotAuthorized;

NotAuthorized.getLayout = (page) => page;
