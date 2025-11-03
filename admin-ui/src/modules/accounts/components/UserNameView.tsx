import React, { useState } from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useSetUserName from '../hooks/useSetUsername';
import useAuth from '../../Auth/useAuth';

const UserNameView = ({ _id: userId, username }) => {
  const { setUserName } = useSetUserName();
  const [isEdit, setIsEdit] = useState(false);
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const onUpdateUserName: OnSubmitType = async ({ username: newUsername }) => {
    const result = await setUserName({ username: newUsername, userId });
    setIsEdit(false);
    return { success: true, data: result };
  };

  const successMessage = formatMessage({
    id: 'username_updated',
    defaultMessage: 'Username updated successfully!',
  });
  const form = useForm({
    submit: onUpdateUserName,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.toLowerCase().includes('duplicate'))
        return formatMessage({
          id: 'username_exists_error',
          defaultMessage: 'Username is taken please provide another',
        });
      return error?.message || '';
    },
    successMessage,
    initialValues: {
      username,
    },
  });

  return (
    <Form form={form}>
      <dl className="divide-y divide-slate-200">
        <div className="flex flex-wrap justify-between items-center sm:gap-4">
          <div className="flex flex-wrap justify-between items-center sm:gap-4 text-sm text-slate-400 dark:text-slate-200">
            {!isEdit &&
              formatMessage({ id: 'username', defaultMessage: 'Username' })}
            <span className="grow">
              {isEdit ? (
                <TextField
                  className="mt-0"
                  name="username"
                  required
                  label={formatMessage({
                    id: 'username',
                    defaultMessage: 'Username',
                  })}
                />
              ) : (
                <div className="text-base font-medium text-slate-900 dark:text-white">
                  {username}
                </div>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4 text-sm sm:col-span-2 sm:mt-0 sm:gap-0">
            <FormErrors />
            {hasRole('manageUsers') && (
              <span className="flex shrink-0 items-center space-x-4">
                <button
                  data-id="cancel_update"
                  onClick={() => setIsEdit(!isEdit)}
                  type="button"
                  className={classNames(
                    isEdit ? '' : 'focus:ring-slate-800',
                    'inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2',
                  )}
                >
                  {isEdit
                    ? formatMessage({
                        id: 'cancel',
                        defaultMessage: 'Cancel',
                      })
                    : formatMessage({
                        id: 'update',
                        defaultMessage: 'Update',
                      })}
                </button>
                {isEdit && (
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:ring-offset-2"
                  >
                    {formatMessage({
                      id: 'save',
                      defaultMessage: 'Save',
                    })}
                  </button>
                )}
              </span>
            )}
          </div>
        </div>
      </dl>
    </Form>
  );
};

export default UserNameView;
