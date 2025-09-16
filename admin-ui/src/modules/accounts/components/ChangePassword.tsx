import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import PasswordField from '../../forms/components/PasswordField';
import SubmitButton from '../../forms/components/SubmitButton';

import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useChangePassword from '../hooks/useChangePassword';

const ChangePassword = () => {
  const { changePassword } = useChangePassword();
  const { formatMessage } = useIntl();

  const onSubmit: OnSubmitType = async ({ oldPassword, newPassword }) => {
    const { data } = await changePassword({ oldPassword, newPassword });

    return { success: data?.changePassword?.success };
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
      return true;
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
    validate: ({ newPassword, oldPassword }) => {
      if (newPassword === oldPassword) {
        return {
          misMatchError: formatMessage({
            id: 'password_identical',
            defaultMessage:
              'Provided new password identical to previous password',
          }),
        };
      }
      return {};
    },
    initialValues: {
      oldPassword: '',
      newPassword: '',
    },
  });

  return (
    <Form form={form}>
      <div className="relative max-w-full mb-4 p-3 space-y-6 sm:p-6">
        <PasswordField
          label={formatMessage({
            id: 'current_password',
            defaultMessage: 'Current password',
          })}
          name="oldPassword"
          id="oldPassword"
          required
          className="text-sm"
        />
        <PasswordField
          label={formatMessage({
            id: 'new_password',
            defaultMessage: 'New password',
          })}
          name="newPassword"
          id="newPassword"
          required
          className="text-sm"
        />
      </div>
      <FormErrors displayFieldErrors />
      <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-800 text-right p-6">
        <SubmitButton
          label={formatMessage({
            id: 'change_password',
            defaultMessage: 'Change password',
          })}
        />
      </div>
    </Form>
  );
};

export default ChangePassword;
