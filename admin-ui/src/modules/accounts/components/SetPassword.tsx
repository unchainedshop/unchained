import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import useAuth from '../../Auth/useAuth';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import PasswordField from '../../forms/components/PasswordField';
import SubmitButton from '../../forms/components/SubmitButton';
import useSendEnrollmentEmail from '../../enrollment/hooks/useSendEnrollmentEmail';

import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useSetPassword from '../hooks/useSetPassword';
import Button from '../../common/components/Button';

const SetPassword = ({ userId, isInitialPassword, primaryEmail }) => {
  const { hasRole } = useAuth();
  const { setPassword } = useSetPassword();
  const { formatMessage } = useIntl();
  const { sendEnrollmentEmail } = useSendEnrollmentEmail();

  const onSubmit: OnSubmitType = async ({ newPassword: newPlainPassword }) => {
    const { data } = await setPassword({
      newPlainPassword,
      userId,
    });

    return { success: true, data: data?.setPassword };
  };

  const onSendEnrollmentEmail = async () => {
    const { data } = await sendEnrollmentEmail({ email: primaryEmail.address });
    if (data?.sendEnrollmentEmail?.success)
      toast.success(
        formatMessage({
          id: 'enrollment_success',
          defaultMessage: 'Email sent to the user successfully',
        }),
      );
    else
      toast.error(
        formatMessage({
          id: 'enrollment_error',
          defaultMessage: 'Failed sending email, please try again',
        }),
      );
  };

  const form = useForm({
    submit: onSubmit,
    enableReinitialize: true,
    onSubmitSuccess: () => {
      toast.success(
        formatMessage({
          id: 'password_success',
          defaultMessage: 'Password changed successfully.',
        }),
      );
      return null;
    },
    getSubmitErrorMessage: (error) => {
      toast.error(
        formatMessage(
          {
            id: 'password_change_failed',
            defaultMessage: 'Password change failed, try again later',
          },
          { error: error.message },
        ),
      );
      return formatMessage(
        {
          id: 'password_change_failed',
          defaultMessage: 'Password change failed, try again later',
        },
        { error: error.message },
      );
    },
    initialValues: {
      newPassword: '',
    },
  });

  return (
    <Form form={form}>
      <div className="relative max-w-full mb-4 p-3 space-y-6 sm:p-6">
        <PasswordField
          label={formatMessage({
            id: 'new_password',
            defaultMessage: 'New password',
          })}
          placeholder={formatMessage({
            id: 'new_password',
            defaultMessage: 'New password',
          })}
          name="newPassword"
          id="newPassword"
          required
          className="text-sm"
        />
      </div>
      <FormErrors />
      <div className="border-t-slate-100 border-t align-baseline flex items-center justify-between dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-800 text-right sm:p-6">
        {isInitialPassword && (
          <Button
            text={formatMessage({
              id: 'send__enrollment_email_button',
              defaultMessage: 'Send enrollment Email',
            })}
            className="mt-4"
            onClick={onSendEnrollmentEmail}
          />
        )}
        <SubmitButton
          label={formatMessage({
            id: 'change_password',
            defaultMessage: 'Change password',
          })}
          disabled={!hasRole('manageUsers') && !hasRole('manageUsers')}
        />
      </div>
    </Form>
  );
};

export default SetPassword;
