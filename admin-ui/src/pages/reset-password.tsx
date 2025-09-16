import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import ResetPasswordForm from '../modules/accounts/components/ResetPasswordForm';
import useValidateResetPasswordToken from '../modules/accounts/hooks/useValidateResetPasswordToken';
import useResetPassword from '../modules/accounts/hooks/useResetPassword';
import { OnSubmitSuccessType } from '../modules/forms/hooks/useForm';
import Link from 'next/link';
import Loading from '../modules/common/components/Loading';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';

const PasswordReset = () => {
  const { query, push } = useRouter();
  const { formatMessage } = useIntl();
  const { resetPassword } = useResetPassword();
  const { token } = query;

  const { isValid, loading } = useValidateResetPasswordToken({
    token,
  });

  const onPasswordChangedSuccessfully: OnSubmitSuccessType = () => {
    toast.success(
      formatMessage({
        id: 'password_changed_success',
        defaultMessage: 'Password changed successfully.',
      }),
    );
    push('/');
    return true;
  };

  const onSubmit = async (variables) => {
    const { newPassword: newPlainPassword } = variables;
    const data = await resetPassword({
      newPlainPassword,
      token: token as string,
    });
    return { success: true, data };
  };

  if (loading || typeof isValid !== 'boolean') return <Loading />;

  return !isValid ? (
    // Error state: Invalid/expired token
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'reset_token_error',
              defaultMessage: 'Reset Token Error',
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                {formatMessage({
                  id: 'token_invalid_expired',
                  defaultMessage: 'Token Invalid/Expired',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'reset_token_invalid_warning',
                  defaultMessage:
                    'The reset token is either invalid or expired.',
                })}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {formatMessage({
                  id: 'use_latest_reset_link',
                  defaultMessage:
                    'Please use the latest reset link sent to your email or request a new one.',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Link
                href="/account/forgot-password"
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
                      d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.94-1.696l-6-3.75a2 2 0 00-2.12 0l-6 3.75zm2.615 2.423a1 1 0 10-1.11 1.664l5 3.333a1 1 0 001.11 0l5-3.333a1 1 0 00-1.11-1.664L10 11.798 5.555 8.835z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {formatMessage({
                  id: 'request_new_reset_link',
                  defaultMessage: 'Request New Reset Link',
                })}
              </Link>

              <Link
                href="/"
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
            </div>
          </div>
        </FormWrapper>
        <div className="flex justify-center dark:brightness-0 dark:invert">
          <ImageWithFallback
            src={process.env.NEXT_PUBLIC_LOGO}
            width={60}
            height={37}
            alt={formatMessage({
              id: 'unchained_logo',
              defaultMessage: 'Unchained Logo',
            })}
          />
        </div>
      </div>
    </div>
  ) : (
    // Valid token state: Show reset password form
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'reset_password',
              defaultMessage: 'Reset Password',
            })}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {formatMessage({
              id: 'reset_password_header_description',
              defaultMessage:
                "Enter your new password and make sure you don't forget it this time.",
            })}
          </p>
        </div>
        <ResetPasswordForm
          onSubmit={onSubmit}
          onSubmitSuccess={onPasswordChangedSuccessfully}
        />
        <div className="flex justify-center dark:brightness-0 dark:invert">
          <ImageWithFallback
            src={process.env.NEXT_PUBLIC_LOGO}
            width={60}
            height={37}
            alt={formatMessage({
              id: 'unchained_logo',
              defaultMessage: 'Unchained Logo',
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;

PasswordReset.getLayout = (page) => page;
