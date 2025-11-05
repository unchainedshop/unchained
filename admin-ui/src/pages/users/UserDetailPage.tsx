import { useRouter } from 'next/router';
import { IRoleAction } from '../../gql/types';

import { useIntl } from 'react-intl';
import useUser from '../../modules/accounts/hooks/useUser';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';

import PageHeader from '../../modules/common/components/PageHeader';
import UserSettings from '../../modules/accounts/components/UserSettings';
import useDeleteUser from '../../modules/accounts/hooks/useDeleteUser';
import { useCallback } from 'react';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import { toast } from 'react-toastify';
import useAuth from '../../modules/Auth/useAuth';
import formatUsername from '../../modules/common/utils/formatUsername';

const UserDetailPage = ({ userId }) => {
  const { formatMessage } = useIntl();

  const { setModal } = useModal();
  const { deleteUser } = useDeleteUser();
  const { user, extendedData } = useUser({ userId: userId as string });
  const router = useRouter();
  const { hasRole } = useAuth();

  const onDeleteUser = useCallback(async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_user_account_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it ',
        })}
        onOkClick={async () => {
          setModal('');
          await deleteUser(user._id);
          toast.success(
            formatMessage({
              id: 'user_deleted',
              defaultMessage: 'User deleted successfully',
            }),
          );
          router.push('/users');
        }}
        okText={formatMessage({
          id: 'delete_user_account',
          defaultMessage: 'Delete user',
        })}
      />,
    );
  }, [user]);
  return (
    <div className=" max-w-6xl">
      <BreadCrumbs currentPageTitle={user ? `${user?.name}` : ''} />
      <PageHeader
        headerText={
          formatUsername(user) ||
          formatMessage({
            id: 'users_setting_list_header',
            defaultMessage: 'User settings',
          })
        }
        onDelete={
          !user?.deleted && hasRole(IRoleAction.RemoveUser)
            ? onDeleteUser
            : null
        }
        title={formatMessage(
          {
            id: 'user_detail_title',
            defaultMessage: 'User {id}',
          },
          { id: user?.username },
        )}
      />
      <UserSettings user={user} extendedData={extendedData} />
    </div>
  );
};

export default UserDetailPage;
