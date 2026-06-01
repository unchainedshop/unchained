import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import useSystemRoles from '../../common/hooks/useSystemRoles';
import ChoicesField from '@/components/ui/form/ChoicesField';
import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';

import SubmitButton from '@/components/ui/form/SubmitButton';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

import useSetRoles from '../hooks/useSetRoles';

const UserRolesView = ({ roles, userId }) => {
  const { formatMessage } = useIntl();

  const { setRoles } = useSetRoles();
  const { hasRole } = useAuth();
  const { systemRoles } = useSystemRoles();
  const onSubmit: OnSubmitType = async ({ updatedRoles }) => {
    await setRoles({ roles: updatedRoles, userId });
    return { success: true };
  };

  const successMessage = formatMessage({
    id: 'role_updated',
    defaultMessage: 'Role updated successfully!',
  });
  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      updatedRoles: [...(roles || [])],
    },
  });

  return (
    <Form form={form} className="flex justify-between align-top gap-4">
      <ChoicesField
        key="user-roles"
        name="updatedRoles"
        labelClassName="flex items-center mt-1"
        choiceContainerClassName="flex flex-wrap"
        inputClassName="ml-2"
        options={Object.fromEntries(
          (systemRoles || []).map((role) => [role, role]),
        )}
        label={formatMessage({
          id: 'select_role',
          defaultMessage: 'Select role',
        })}
        placeholder={formatMessage({
          id: 'select_role',
          defaultMessage: 'Select role',
        })}
        multiple
      />
      <FormErrors />
      {hasRole(IRoleAction.ManageUsers) && (
        <SubmitButton
          disabled={!hasRole(IRoleAction.ManageUsers)}
          label={formatMessage({
            id: 'update_role',
            defaultMessage: 'Update role',
          })}
        />
      )}
    </Form>
  );
};

export default UserRolesView;
