import Link from 'next/link';

import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Badge from '@/components/ui/Badge';
import MiniUserAvatar from '../../common/components/MiniUserAvatar';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import formatUsername from '../../common/utils/formatUsername';
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

const UserListItem = ({
  user,
  isSelected = false,
  onToggleSelect = undefined,
  showCheckbox = false,
}) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const isVerified = !!user?.primaryEmail?.verified;

  const handleEdit = () => {
    router.push(`/users?userId=${user._id}`);
  };

  return (
    <Table.Row className="group">
      {showCheckbox && (
        <Table.Cell>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </Table.Cell>
      )}
      <Table.Cell>
        <Link
          href={`/users?userId=${user._id}`}
          className="flex items-center text-sm text-text-primary group-hover:text-slate-700 dark:group-hover:text-slate-100"
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
          <div className="text-sm text-text-primary">
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
        <TableActionsMenu onEdit={handleEdit} showDelete={false} />
      </Table.Cell>
    </Table.Row>
  );
};

export default UserListItem;
