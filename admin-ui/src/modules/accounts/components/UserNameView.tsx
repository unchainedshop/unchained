import React, { useState } from 'react';
import { IRoleAction } from '../../../gql/types';

import clsx from 'clsx';
import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';
import TextField from '@/components/ui/form/TextField';
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
          <div className="flex flex-wrap justify-between items-center sm:gap-4 text-sm text-text-muted">
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
                <div className="text-base font-medium text-text-primary">
                  {username}
                </div>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4 text-sm sm:col-span-2 sm:mt-0 sm:gap-0">
            <FormErrors />
            {hasRole(IRoleAction.ManageUsers) && (
              <span className="flex shrink-0 items-center space-x-4">
                <button
                  data-id="cancel_update"
                  onClick={() => setIsEdit(!isEdit)}
                  type="button"
                  className={clsx(
                    isEdit ? '' : 'focus:ring-focus-ring',
                    'inline-flex items-center rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-xs hover:bg-surface-raised focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2',
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
                    className="inline-flex items-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-text-on-accent shadow-xs hover:bg-accent-hover focus:outline-hidden focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
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
