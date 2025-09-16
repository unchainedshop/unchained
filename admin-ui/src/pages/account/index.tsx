import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import useCurrentUser from '../../modules/accounts/hooks/useCurrentUser';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';

import UserSettings from '../../modules/accounts/components/UserSettings';
import useDeleteUser from '../../modules/accounts/hooks/useDeleteUser';
import useModal from '../../modules/modal/hooks/useModal';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import { toast } from 'react-toastify';
import { useApollo } from '../../modules/apollo/apolloClient';
import logOut from '../../modules/accounts/hooks/logOut';

const Profile = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { currentUser, extendedData } = useCurrentUser();
  const { deleteUser } = useDeleteUser();
  const { setModal } = useModal();
  const apollo = useApollo({});

  const onDeleteUser = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_account_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it ',
        })}
        onOkClick={async () => {
          setModal('');
          await deleteUser();
          toast.success(
            formatMessage({
              id: 'account_deleted',
              defaultMessage: 'Account deleted successfully',
            }),
          );
          await logOut(apollo, router);
          // No goodbye message needed for account deletion
        }}
        okText={formatMessage({
          id: 'delete_account',
          defaultMessage: 'Delete account',
        })}
      />,
    );
  };

  return (
    <div className=" max-w-6xl">
      <BreadCrumbs />
      <PageHeader
        headerText={formatMessage({
          id: 'account',
          defaultMessage: 'Account',
        })}
        onDelete={onDeleteUser}
      />
      <UserSettings user={currentUser} extendedData={extendedData} />
    </div>
  );
};

export default Profile;
