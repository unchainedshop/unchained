import Link from 'next/link';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import FormWrapper from '../../common/components/FormWrapper';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import PasswordField from '../../forms/components/PasswordField';
import TextField from '../../forms/components/TextField';

import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';
import useGenerateLoginCredentials from '../hooks/useGenerateLoginCredentials';
import useLoginWithPassword from '../hooks/useLoginWithPassword';
import useLoginWithWebAuthn from '../hooks/useLoginWithWebAuthn';
import { useCallback, useState } from 'react';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';

const GetCurrentStep = ({ step }) => {
  const { formatMessage } = useIntl();

  switch (step) {
    case 2:
      return (
        <>
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
            label={formatMessage({
              id: 'password',
              defaultMessage: 'Password',
            })}
          />

          <div className="my-1 text-sm sm:my-0 text-left">
            <Link
              href="/account/forgot-password"
              className="font-medium text-slate-950 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
            >
              {formatMessage({
                id: 'forget_password',
                defaultMessage: 'Forgot your password?',
              })}
            </Link>
          </div>
        </>
      );
    default:
      return (
        <TextField
          id="username-or-email"
          name="usernameOrEmail"
          className="mt-1"
          type="text"
          autoComplete="on"
          autoFocus
          required
          label={formatMessage({
            id: 'username_or_email',
            defaultMessage: 'Username/Email',
          })}
        />
      );
  }
};

const LogInForm = () => {
  const intl = useIntl();
  const { logInWithPassword } = useLoginWithPassword();
  const { loginWithWebAuthn } = useLoginWithWebAuthn();
  const { singleSignOnURL } = useUnchainedContext();

  const [step, setStep] = useState(1);

  const router = useRouter();

  const nextStep = useCallback(() => {
    setStep(step + 1);
  }, [step]);

  const previousStep = useCallback(() => {
    setStep(step - 1);
  }, [step]);

  const { generateLoginCredentials } = useGenerateLoginCredentials();

  const { formatMessage } = useIntl();

  const logInWithWebAuth = async (username) => {
    const webAuthnPublicKeyCredentials = await generateLoginCredentials({
      username,
    });
    if (webAuthnPublicKeyCredentials) {
      const { data, error } = await loginWithWebAuthn({
        webAuthnPublicKeyCredentials,
      });
      if (data && data?.loginWithWebAuthn) {
        return { success: true, error };
      }
    }
    return { success: false, error: null };
  };

  const onSubmit: OnSubmitType = async ({ usernameOrEmail, password }) => {
    if (step === 1) {
      const { success, error } = await logInWithWebAuth(usernameOrEmail);
      if (error) return { success: true, error };
      if (!success) nextStep();
    }
    if (step === 2) {
      const { data, error } = await logInWithPassword({
        usernameOrEmail,
        password,
      });
      if (!error) {
        const { _id } = data.loginWithPassword;
        return { success: Boolean(_id), ...data.loginWithPassword };
      }

      if (error?.message?.includes('2FA code required')) {
        nextStep();
      } else {
        return { success: false, error };
      }
    }
    if (step === 3) {
      const { data, error } = await logInWithPassword({
        usernameOrEmail,
        password,
      });
      if (!error) {
        const { _id } = data.loginWithPassword;
        return { success: Boolean(_id), ...data.loginWithPassword };
      }
      return { success: false, error };
    }
    return { success: false };
  };

  const onSubmitSuccess: OnSubmitSuccessType = async (success, userData) => {
    // Show personalized welcome message
    const userName =
      userData?.username ||
      userData?.displayName ||
      userData?.profile?.displayName ||
      'there';
    toast.success(
      formatMessage(
        {
          id: 'welcome_user',
          defaultMessage: 'Welcome back, {name}!',
        },
        { name: userName },
      ),
    );

    router.push('/');
    return true;
  };

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.includes('Invalid credentials'))
        return formatMessage({
          id: 'invalid_credential_error',
          defaultMessage: 'Invalid credential, please try again',
        });
      if (error?.message?.toLowerCase().includes('no password set')) {
        return formatMessage({
          id: 'user_password_not_set',
          defaultMessage: 'User password not set',
        });
      }
      if (error?.message?.toLowerCase().includes('is not valid json')) {
        return formatMessage({
          id: 'connection_to_server_error',
          defaultMessage:
            'Currently not connected to unchained engine, please check your connection to server and try again.',
        });
      }

      return '';
    },
    initialValues: {
      usernameOrEmail: null,
      password: null,
    },
  });

  return (
    <>
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div>
            <h2 className="text-center text-3xl text-slate-900 dark:text-slate-200">
              {formatMessage({
                id: 'login_header',
                defaultMessage: 'Log in to your account',
              })}
            </h2>
          </div>
          <FormWrapper>
            <Form
              form={form}
              className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10"
            >
              <GetCurrentStep step={step} />

              <FormErrors />
              <div className="flex items-center gap-4 mt-4">
                {step !== 1 && (
                  <button
                    type="button"
                    id="previous-button"
                    name="previous-button"
                    onClick={previousStep}
                    className="group relative flex w-full justify-center rounded-md border border-slate-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-hidden focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2"
                  >
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3" />
                    {formatMessage({
                      id: 'previous',
                      defaultMessage: 'Previous',
                    })}
                  </button>
                )}
                <button
                  type="submit"
                  id="submit"
                  disabled={!form.formik.isValid}
                  name="submit"
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
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {formatMessage({
                    id: 'continue',
                    defaultMessage: 'Continue',
                  })}
                </button>
                {singleSignOnURL && step !== 2 && (
                  <a
                    type="button"
                    href={singleSignOnURL}
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
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    {formatMessage({
                      id: 'continue_with_sso',
                      defaultMessage: 'Login with SSO',
                    })}
                  </a>
                )}
              </div>

              <div className="text-sm text-slate-400 dark:text-slate-200">
                {formatMessage({
                  id: 'create_new_account',
                  defaultMessage: 'Create new account?',
                })}
                <Link
                  href="/sign-up"
                  className="ml-2 font-medium text-slate-950 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-400"
                >
                  {intl.formatMessage({
                    id: 'sign_up',
                    defaultMessage: 'Sign up',
                  })}
                </Link>
              </div>
            </Form>
          </FormWrapper>
        </div>
      </div>
    </>
  );
};

export default LogInForm;
