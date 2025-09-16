import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import {
  ArrowRightEndOnRectangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import logOut from '../modules/accounts/hooks/logOut';
import { useApolloClient } from '@apollo/client/react';
import { toast } from 'react-toastify';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';
import Button from '../modules/common/components/Button';

const Locked = () => {
  const { formatMessage } = useIntl();
  const apollo = useApolloClient();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut(apollo, router);
    toast.success(
      formatMessage({
        id: 'goodbye_simple',
        defaultMessage: 'Goodbye!',
      }),
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'access_restricted',
              defaultMessage: 'Access Restricted',
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
                {formatMessage({
                  id: 'error_423',
                  defaultMessage: '423 Locked',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'required-role-not-satisfied',
                  defaultMessage:
                    'Current account does not have access, please log in with an account that has the required role.',
                })}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {formatMessage({
                  id: 'contact_admin_help',
                  defaultMessage:
                    'Contact system administrator for further information.',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleLogout}
                icon={<ArrowRightEndOnRectangleIcon className="h-5 w-5" />}
                variant="primary"
                fullWidth
                text={formatMessage({
                  id: 'use-another-account',
                  defaultMessage: 'Use Another Account',
                })}
              />

              <Button
                onClick={() => window.history.back()}
                icon={<ArrowLeftIcon className="h-5 w-5" />}
                variant="secondary"
                fullWidth
                text={formatMessage({
                  id: 'go_back',
                  defaultMessage: 'Go Back',
                })}
              />
            </div>
          </div>
        </FormWrapper>
      </div>
    </div>
  );
};

export default Locked;

Locked.getLayout = (page) => page;
