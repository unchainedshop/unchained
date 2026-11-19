import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import FormWrapper from '../../common/components/FormWrapper';
import Form from '../../forms/components/Form';
import EmailField from '@/components/ui/form/EmailField';
import FormErrors from '@/components/ui/form/FormErrors';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TextField from '@/components/ui/form/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useRequestLoginCode from '../hooks/useRequestLoginCode';
import useLoginWithLoginCode from '../hooks/useLoginWithLoginCode';

const LogInWithCodeForm = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const token =
    typeof router.query.token === 'string' ? router.query.token : null;
  const [requestedFor, setRequestedFor] = useState<string | null>(null);
  const { requestLoginCode } = useRequestLoginCode();
  const { loginWithLoginCode } = useLoginWithLoginCode();

  const requestForm = useForm({
    submit: async ({ email }) => {
      await requestLoginCode({ email });
      setRequestedFor(email);
      return { success: true };
    },
    initialValues: { email: '' },
  });

  const logIn: OnSubmitType = async ({ code }) => {
    const { data, error } = await loginWithLoginCode(
      token ? { token } : { email: requestedFor, code },
    );
    return { success: Boolean(data?.loginWithLoginCode?._id), error };
  };

  const logInForm = useForm({
    submit: logIn,
    onSubmitSuccess: async () => {
      await router.push('/');
      return true;
    },
    getSubmitErrorMessage: () =>
      formatMessage({
        id: 'login_code_invalid',
        defaultMessage: 'The code or the link is wrong, used or expired',
      }),
    initialValues: { code: '' },
  });

  const requestNewCode = async () => {
    setRequestedFor(null);
    if (token) await router.replace('/login-code');
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="text-center text-3xl text-text-primary">
          {formatMessage({
            id: 'login_with_code',
            defaultMessage: 'Log in with a code',
          })}
        </h2>
        <FormWrapper>
          {token || requestedFor ? (
            <Form
              form={logInForm}
              className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10"
            >
              <p className="text-sm text-text-secondary">
                {token
                  ? formatMessage({
                      id: 'login_code_link_description',
                      defaultMessage: 'Log in with the link from your email.',
                    })
                  : formatMessage(
                      {
                        id: 'login_code_sent',
                        defaultMessage:
                          'If {email} belongs to an account, we have sent a link and a code to it.',
                      },
                      { email: requestedFor },
                    )}
              </p>
              {!token && (
                <TextField
                  id="code"
                  name="code"
                  autoFocus
                  required
                  label={formatMessage({ id: 'code', defaultMessage: 'Code' })}
                />
              )}
              <FormErrors />
              <SubmitButton
                className="w-full"
                label={formatMessage({
                  id: 'log_in',
                  defaultMessage: 'Log in',
                })}
              />
              <button
                type="button"
                onClick={requestNewCode}
                className="text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {formatMessage({
                  id: 'request_new_login_code',
                  defaultMessage: 'Request a new code',
                })}
              </button>
            </Form>
          ) : (
            <Form
              form={requestForm}
              className="space-y-6 px-4 pb-5 pt-3 sm:rounded-lg sm:px-10"
            >
              <EmailField
                id="email-address"
                name="email"
                autoFocus
                required
                label={formatMessage({
                  id: 'email_address',
                  defaultMessage: 'Email Address',
                })}
              />
              <FormErrors />
              <SubmitButton
                className="w-full"
                label={formatMessage({
                  id: 'send_login_code',
                  defaultMessage: 'Send login code',
                })}
              />
            </Form>
          )}
        </FormWrapper>
        <Link
          href="/log-in"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          {formatMessage({
            id: 'back_to_log_in',
            defaultMessage: 'Back to log in',
          })}
        </Link>
      </div>
    </div>
  );
};

export default LogInWithCodeForm;
