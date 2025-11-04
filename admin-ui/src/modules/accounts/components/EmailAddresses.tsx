import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import classNames from 'classnames';
import Form from '../../forms/components/Form';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useAddEmail from '../hooks/useAddEmail';
import useRemoveEmail from '../hooks/useRemoveEmail';
import useSendVerificationEmail from '../hooks/useSendVerificationEmail';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import ActiveInActive from '../../common/components/ActiveInActive';
import DeleteButton from '../../common/components/DeleteButton';
import useAuth from '../../Auth/useAuth';

const EmailAddresses = ({
  emails,
  userId,
  enableVerification,
  emailBodyContainer,
}) => {
  const { removeEmail } = useRemoveEmail();
  const { sendVerificationEmail } = useSendVerificationEmail();
  const { addEmail } = useAddEmail();
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { hasRole } = useAuth();

  const onAddEmail: OnSubmitType = async ({ email }) => {
    await addEmail({ email, userId });
    return { success: true };
  };

  const onRemoveEmail = async ({ email }) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_email_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this email? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeEmail({ email, userId });
          toast.success(
            formatMessage(
              {
                id: 'email_deleted',
                defaultMessage: 'email {id} deleted successfully',
              },
              {
                id: userId,
              },
            ),
          );
        }}
        okText={formatMessage({
          id: 'delete_email',
          defaultMessage: 'Delete email',
        })}
      />,
    );
  };

  const onSendVerification = async ({ email }) => {
    const { data } = await sendVerificationEmail({ email });
    if (data.sendVerificationEmail.success)
      toast.success(
        formatMessage({
          id: 'verification_sent_success',
          defaultMessage: 'Verification email sent successfully ',
        }),
      );
    else
      toast.error(
        formatMessage({
          id: 'verification_sent_error',
          defaultMessage:
            'Error occurred while sending verification email, please try again',
        }),
      );
  };

  const successMessage = formatMessage({
    id: 'email_added',
    defaultMessage: 'Email added successfully!',
  });
  const form = useForm({
    submit: onAddEmail,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      email: '',
    },
  });
  return (
    <div
      className={classNames(
        'rounded-md shadow-sm px-4 py-5 sm:p-6 bg-white dark:bg-slate-800',
        emailBodyContainer,
      )}
    >
      <ul className="-my-5 divide-y divide-slate-200 dark:divide-slate-700">
        {(emails || []).map(({ address, verified }) => (
          <li className="py-4" key={address}>
            <div className="flex flex-wrap items-center justify-between">
              <div className="mr-2 flex max-w-md flex-wrap items-center space-x-2">
                <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">
                  {address}
                </div>
                <ActiveInActive isActive={verified} />
              </div>
              <div className="my-1 flex items-center cursor-pointer">
                {enableVerification && !verified && hasRole('sendEmail') && (
                  <a
                    id="send_verification_mail"
                    onClick={async () => {
                      await onSendVerification({ email: address });
                    }}
                    className="inline-flex items-center rounded-md dark:text-slate-500 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
                  >
                    {formatMessage({
                      id: 'send_verification_mail',
                      defaultMessage: 'Send verification mail',
                    })}
                  </a>
                )}

                {hasRole('updateUser') && (
                  <DeleteButton
                    className="ml-2 inline-flex items-center rounded-full hover:bg-rose-50"
                    onClick={() =>
                      onRemoveEmail({
                        email: address,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hasRole('updateUser') && (
        <Form form={form}>
          <div className="mt-4 border-t dark:border-t-slate-700">
            <div className="items-between mt-4 flex space-x-4">
              <TextField
                className="mt-0"
                name="email"
                required
                label={formatMessage({
                  id: 'email',
                  defaultMessage: 'Email',
                })}
              />
              <span className="shrink-0 flex items-end">
                <SubmitButton
                  className="py-2 leading-5"
                  label={formatMessage({
                    id: 'add_email',
                    defaultMessage: 'Add email',
                  })}
                />
              </span>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
};

export default EmailAddresses;
