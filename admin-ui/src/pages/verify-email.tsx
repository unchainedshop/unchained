import React, { useEffect, useState } from 'react';
import { ClockIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import useVerifyEmail from '../modules/accounts/hooks/useVerifyEmail';
import Loading from '../modules/common/components/Loading';
import CustomError from '../modules/common/CustomError';
import useValidateEmailVerificationToken from '../modules/accounts/hooks/useValidateEmailVerificationToken';
import FormWrapper from '../modules/common/components/FormWrapper';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';

const VerifyEmail = () => {
  const { query } = useRouter();
  const { verifyEmail } = useVerifyEmail();
  const { formatMessage } = useIntl();
  const { token } = query;
  const [result, setResult] = useState({ success: null, message: null });
  const { isValid, loading } = useValidateEmailVerificationToken({ token });

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail({ token: token as string });
        setResult({
          ...result,
          success: true,
        });
      } catch (e: unknown) {
        if (e instanceof CustomError && e.message.includes('expired'))
          setResult({
            success: false,
            message: formatMessage({
              id: 'verification_token_expired',
              defaultMessage: 'Verification token expired',
            }),
          });
        else
          setResult({
            success: false,
            message: formatMessage({
              id: 'email_verification_failed',
              defaultMessage: 'Email verification failed',
            }),
          });
      }
    };
    if (query.token) verify();
  }, [query.token]);

  if (loading || typeof isValid !== 'boolean') return <Loading />;

  return !isValid ? (
    // Error state: Token invalid/expired
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formatMessage({
              id: 'email_verification_error',
              defaultMessage: 'Verification Error',
            })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                <ClockIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                {formatMessage({
                  id: 'token_invalid_expired',
                  defaultMessage: 'Token Invalid/Expired',
                })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {formatMessage({
                  id: 'verify_email_token_invalid_error',
                  defaultMessage:
                    'The email verification token is either invalid or expired.',
                })}
              </p>
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {formatMessage({
                  id: 'use_latest_verification_link',
                  defaultMessage:
                    'Please use the latest verification link sent to your email.',
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
                  id: 'request_new_verification',
                  defaultMessage: 'Request New Verification',
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
      </div>
    </div>
  ) : (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {result.success
              ? formatMessage({
                  id: 'email_verified_successfully',
                  defaultMessage: 'Email Verified',
                })
              : formatMessage({
                  id: 'verification_failed',
                  defaultMessage: 'verification failed',
                })}
          </h2>
        </div>
        <FormWrapper>
          <div className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                  result.success
                    ? 'bg-emerald-100 dark:bg-emerald-900'
                    : 'bg-rose-100 dark:bg-rose-900'
                }`}
              >
                {result.success ? (
                  <EnvelopeOpenIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ClockIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <p
                className={`mt-4 text-sm font-semibold uppercase tracking-wide ${
                  result.success
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {result.success
                  ? formatMessage({
                      id: 'verification_successful',
                      defaultMessage: 'Verification Successful',
                    })
                  : formatMessage({
                      id: 'verification_failed_status',
                      defaultMessage: 'Verification Failed',
                    })}
              </p>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                {result.success
                  ? formatMessage({
                      id: 'thank_you_for_verifying',
                      defaultMessage:
                        'Thank you for verifying your email address.',
                    })
                  : result.message}
              </p>
              {!result.success && (
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                  {formatMessage({
                    id: 'use_another_verification_token',
                    defaultMessage:
                      'Please resend another verification email and try again.',
                  })}
                </p>
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
                  id: 'continue_to_app',
                  defaultMessage: 'Continue to App',
                })}
              </Link>

              {!result.success && (
                <Link
                  href="/account/forgot-password"
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
                        d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.94-1.696l-6-3.75a2 2 0 00-2.12 0l-6 3.75zm2.615 2.423a1 1 0 10-1.11 1.664l5 3.333a1 1 0 001.11 0l5-3.333a1 1 0 00-1.11-1.664L10 11.798 5.555 8.835z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {formatMessage({
                    id: 'request_new_verification',
                    defaultMessage: 'Request New Verification',
                  })}
                </Link>
              )}
            </div>
          </div>
        </FormWrapper>
      </div>
    </div>
  );
};

export default VerifyEmail;

VerifyEmail.getLayout = (page) => page;
