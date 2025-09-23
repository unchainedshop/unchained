import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import UserListItem from './UserListItem';

const UserList = ({ users }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  return (
    <Table className="min-w-full">
      {users?.map((user) => (
        <Table.Row key={user._id} header>
          <Table.Cell>
            {formatMessage({
              id: 'name',
              defaultMessage: 'Name',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'email',
              defaultMessage: 'Email',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'status',
              defaultMessage: 'Status',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'last_login',
              defaultMessage: 'Last Login:',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'tags',
              defaultMessage: 'Tags',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'cart',
              defaultMessage: 'Cart',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'orders',
              defaultMessage: 'Orders',
            })}
          </Table.Cell>

          <Table.Cell className="text-right">&nbsp;</Table.Cell>
        </Table.Row>
      ))}

      {users?.map((user) => (
        <UserListItem key={`${user?._id}-body`} user={user} />
      ))}
    </Table>
  );
};

export default UserList;
