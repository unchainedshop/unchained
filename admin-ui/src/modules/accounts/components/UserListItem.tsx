import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import MiniUserAvatar from '../../common/components/MiniUserAvatar';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import formatUsername from '../../common/utils/formatUsername';
import useCurrentUser from '../hooks/useCurrentUser';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import useDeleteUser from '../hooks/useDeleteUser';
import Loading from '../../common/components/Loading';
import { ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const UserLastLogin = ({ lastLogin }) => {
  const { locale } = useIntl();
  const loginDate = new Date(lastLogin?.timestamp);
  if (!loginDate?.getTime()) return null;
  const formattedDate = loginDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const formattedTime = loginDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="text-sm text-slate-500">
      {formattedDate}, {formattedTime}
    </div>
  );
};

const UserListItem = ({ user }) => {
  const { formatMessage, locale } = useIntl();
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { deleteUser } = useDeleteUser();
  const isVerified = !!user?.primaryEmail?.verified;

  if (loading && !currentUser) return <Loading />;

  const handleEdit = () => {
    router.push(`/users?userId=${user._id}`);
  };

  const handleDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_user_warning',
          defaultMessage:
            'This action will permanently delete this user and all associated data. Are you sure you want to continue?',
        })}
        onOkClick={async () => {
          setModal('');
          await deleteUser({ userId: user._id });
        }}
        okText={formatMessage({
          id: 'delete_user',
          defaultMessage: 'Delete User',
        })}
      />,
    );
  };

  return (
    <Table.Row className="group">
      <Table.Cell>
        <Link
          href={`/users?userId=${user._id}`}
          className="flex items-center text-sm text-slate-900 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-100"
        >
          <MiniUserAvatar
            showName={false}
            name={user.username}
            className="mr-3"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatUsername(user)}</span>
              {user.isGuest && (
                <Badge
                  text={formatMessage({
                    id: 'guest',
                    defaultMessage: 'Guest',
                  })}
                  color="blue"
                />
              )}
            </div>
          </div>
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/users?userId=${user._id}`} className="block">
          <div className="text-sm text-slate-900 dark:text-slate-300">
            {user?.primaryEmail?.address}
          </div>
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/users?userId=${user._id}`} className="block">
          <Badge
            text={
              isVerified
                ? formatMessage({
                    id: 'verified',
                    defaultMessage: 'Verified',
                  })
                : formatMessage({
                    id: 'unverified',
                    defaultMessage: 'Unverified',
                  })
            }
            color={isVerified ? 'green' : 'yellow'}
            square
          />
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/users?userId=${user._id}`} className="block">
          <UserLastLogin lastLogin={user?.lastLogin} />
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/users?userId=${user._id}`} className="block">
          <div className="flex flex-wrap gap-2">
            {user.tags?.map((tag) => (
              <Badge key={tag} text={tag} color="slate" />
            ))}
          </div>
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link
          href={`/users?userId=${user._id}&tab=orders&includeCarts=true`}
          className="block"
        >
          <div className="flex items-center gap-1">
            <ShoppingCartIcon className="w-4 h-4 text-slate-500" />
            <span className="text-sm">{user?.cart?.items?.length || 0}</span>
          </div>
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/users?userId=${user._id}&tab=orders`} className="block">
          <div className="flex items-center gap-1">
            <ShoppingBagIcon className="w-4 h-4 text-slate-500" />
            <span className="text-sm">{user?.orders?.length || 0}</span>
          </div>
        </Link>
      </Table.Cell>

      <Table.Cell className="text-right">
        <TableActionsMenu
          onEdit={handleEdit}
          onDelete={handleDelete}
          showEdit={true}
          showDelete={hasRole('removeUser')}
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default UserListItem;
