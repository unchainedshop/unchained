import Link from 'next/link';
import { useIntl } from 'react-intl';
import FormWrapper from '../../common/components/FormWrapper';
import ImageWithFallback from '../../common/components/ImageWithFallback';

import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import PasswordField from '../../forms/components/PasswordField';
import TextField from '../../forms/components/TextField';

import useForm from '../../forms/hooks/useForm';
import Toggle from '../../common/components/Toggle';
import { useEffect, useState } from 'react';
const SignUpForm = ({
  onSubmit,
  onSubmitSuccess,
  authenticateWithDevice,
  onAuthenticateWithDeviceChange,
  disableLoginRedirectLink = false,
  submitButtonText = null,
  formHeaderText = null,
}) => {
  const { formatMessage } = useIntl();
  const [webauthnSupported, setWebauthnSupported] = useState(false);

  const form = useForm({
    getSubmitErrorMessage: (error) => {
      if (error?.message?.toLowerCase().includes('email already exists')) {
        form.formik.setFieldError(
          'email',
          formatMessage({
            id: 'email_exists_error',
            defaultMessage: 'Email already exists',
          }),
        );
        return formatMessage({
          id: 'email_exists_error',
          defaultMessage: 'Email already exists',
        });
      }
      if (
        error?.message?.includes('challenge mismatch') ||
        error?.message?.includes('already exists')
      ) {
        form.formik.setFieldError(
          'username',
          formatMessage({
            id: 'username_or_email_taken',
            defaultMessage:
              'Username taken, Please provided different username',
          }),
        );
        return formatMessage({
          id: 'username_or_email_taken',
          defaultMessage: 'Username taken, Please provided different username',
        });
      }
      if (error?.extensions?.code.includes('PasswordInvalidError')) {
        form.formik.setFieldError(
          'plainPassword',
          formatMessage({
            id: 'password_insecure',
            defaultMessage: 'Password is invalid, maybe too insecure',
          }),
        );
        return formatMessage({
          id: 'password_insecure',
          defaultMessage: 'Password is invalid, maybe too insecure',
        });
      }

      return error?.message || '';
    },
    submit: onSubmit,
    onSubmitSuccess,
    initialValues: {
      username: null,
      email: null,
      plainPassword: null,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setWebauthnSupported(true);
    }
  }, []);

  return (
    <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div>
          <ImageWithFallback
            className="mx-auto"
            src={process.env.NEXT_PUBLIC_LOGO}
            width={160}
            height={100}
            alt={formatMessage({
              id: 'unchained_logo',
              defaultMessage: 'Unchained Logo',
            })}
          />
          <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
            {formHeaderText ||
              formatMessage({
                id: 'sign_up_header',
                defaultMessage: 'Create new account',
              })}
          </h2>
        </div>
        <FormWrapper>
          <Form
            form={form}
            className="mt-8 space-y-6 pt-4 pb-8 shadow-sm sm:rounded-lg sm:px-10"
          >
            <input type="hidden" name="remember" value="true" />
            <div className="space-y-6 rounded-md shadow-xs">
              <div>
                <TextField
                  id="username"
                  name="username"
                  required={authenticateWithDevice}
                  type="text"
                  label={formatMessage({
                    id: 'username',
                    defaultMessage: 'Username',
                  })}
                />
              </div>
              {!authenticateWithDevice && (
                <>
                  <div>
                    <TextField
                      id="email"
                      name="email"
                      type="email"
                      required
                      label={formatMessage({
                        id: 'email',
                        defaultMessage: 'Email',
                      })}
                    />
                  </div>
                  <div>
                    <PasswordField
                      id="plainPassword"
                      name="plainPassword"
                      autoComplete="current-password"
                      required
                      label={formatMessage({
                        id: 'password',
                        defaultMessage: 'Password',
                      })}
                    />
                  </div>
                </>
              )}
              {webauthnSupported && (
                <Toggle
                  onToggle={onAuthenticateWithDeviceChange}
                  toggleText={formatMessage({
                    id: 'use_authenticator',
                    defaultMessage: 'Use authenticator',
                  })}
                  className="ml-2 my-3"
                  active={authenticateWithDevice}
                />
              )}
            </div>
            <FormErrors />

            <div className="my-2">
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 py-2 px-4 text-sm font-medium text-white hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-slate-900 group-hover:text-slate-800"
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

                {submitButtonText ||
                  formatMessage({
                    id: 'sign_up',
                    defaultMessage: 'Sign up',
                  })}
              </button>
            </div>
            {!disableLoginRedirectLink && (
              <div className="text-sm text-slate-400 dark:text-slate-200">
                {formatMessage({
                  id: 'already_got_a_user',
                  defaultMessage: 'Already got a user?',
                })}
                <Link
                  href="/log-in"
                  className=" ml-2 font-medium text-slate-950 hover:text-slate-900 dark:text-slate-800 dark:hover:text-slate-400"
                >
                  {formatMessage({
                    id: 'log_in',
                    defaultMessage: 'Log in',
                  })}
                </Link>
              </div>
            )}
          </Form>
        </FormWrapper>
      </div>
    </div>
  );
};

export default SignUpForm;
