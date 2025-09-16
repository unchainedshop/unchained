import Link from 'next/link';
import { useIntl } from 'react-intl';
import FormWrapper from '../../common/components/FormWrapper';
import EmailField from '../../forms/components/EmailField';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';

const ForgotPasswordForm = ({
  onSubmit,
  onSubmitSuccess,
}: {
  onSubmit: OnSubmitType;
  onSubmitSuccess: OnSubmitSuccessType;
}) => {
  const { formatMessage } = useIntl();

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    getSubmitErrorMessage: () => {
      form.formik.setFieldError(
        'email',
        formatMessage({
          id: 'email_address_not_exist',
          defaultMessage: 'Provided email does not exist',
        }),
      );
      return null;
    },
    initialValues: {
      email: '',
    },
  });
  return (
    <FormWrapper>
      <Form
        form={form}
        className="mt-8 space-y-6 px-4 pt-3 pb-8 shadow-sm sm:rounded-lg sm:px-10"
      >
        <div>
          <p className="py-4">
            {formatMessage({
              id: 'forgot_password_header_description',
              defaultMessage:
                "Enter your email address below and we'll send you a link to reset your password!",
            })}
          </p>
          <EmailField
            name="email"
            id="email-address"
            label={formatMessage({
              id: 'email_address',
              defaultMessage: 'Email Address',
            })}
            placeholder={formatMessage({
              id: 'email_address',
              defaultMessage: 'Email Address',
            })}
            required
          />
        </div>
        <FormErrors />
        <div className="mb-6">
          <SubmitButton
            className="w-full "
            label={formatMessage({
              id: 'send_reset_link',
              defaultMessage: 'Send reset link',
            })}
          />
        </div>
        <p className="text-center text-sm text-slate-400">
          {formatMessage({
            id: 'dont_have_account',
            defaultMessage: "Don't have an account yet?",
          })}
          {'  '}
          <Link
            href="/sign-up"
            className="font-semibold text-slate-900 dark:text-slate-800 focus:text-slate-950 dark:hover:text-slate-400 focus:underline focus:outline-hidden"
          >
            {formatMessage({ id: 'sign_up', defaultMessage: 'Sign up' })}
          </Link>
          .
        </p>
      </Form>
    </FormWrapper>
  );
};

export default ForgotPasswordForm;
