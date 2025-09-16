import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import PasswordField from '../../forms/components/PasswordField';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';

const ResetPasswordForm = ({
  onSubmit,
  onSubmitSuccess = () => true,
}: {
  onSubmit: OnSubmitType;
  onSubmitSuccess: OnSubmitSuccessType;
}) => {
  const { formatMessage } = useIntl();

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.toLowerCase().includes('link expired')) {
        return formatMessage({
          id: 'reset_token_expired',
          defaultMessage: 'Token link invalid or has expired',
        });
      }
      return '';
    },
    validate: ({ newPassword, confirmPassword }) => {
      if (newPassword !== confirmPassword) {
        return {
          misMatchError: formatMessage({
            id: 'password_mismatch',
            defaultMessage: "Password fields don't match",
          }),
        };
      }
      return {};
    },
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  return (
    <Form form={form}>
      <div>
        <PasswordField
          required
          name="newPassword"
          id="new-password"
          placeholder={formatMessage({
            id: 'new_password',
            defaultMessage: 'New password',
          })}
          label={formatMessage({
            id: 'new_password',
            defaultMessage: 'New password',
          })}
        />
      </div>
      <div>
        <PasswordField
          required
          name="confirmPassword"
          id="confirm-password"
          placeholder={formatMessage({
            id: 'confirm_password',
            defaultMessage: 'Confirm password',
          })}
          label={formatMessage({
            id: 'confirm_password',
            defaultMessage: 'Confirm password',
          })}
        />
      </div>
      <div className="p-3 pl-0 text-left ">
        <FormErrors displayFieldErrors />
      </div>
      <SubmitButton
        label={formatMessage({
          id: 'rest_password',
          defaultMessage: 'Reset password',
        })}
      />
    </Form>
  );
};

export default ResetPasswordForm;
