import React from 'react';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import BulkActionsToolbar, {
  type BulkAction,
} from '../../common/components/BulkActionsToolbar';
import BulkTagForm, {
  type BulkTagData,
} from '../../common/components/BulkTagForm';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkResultHandler from '../../common/hooks/useBulkResultHandler';
import useBulkUserOperations from '../hooks/useBulkUserOperations';
import useBulkActionConfirmation from '../../common/hooks/useBulkActionConfirmation';
import UserListItem from './UserListItem';

const UserList = ({ users }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const allIds = users?.map((user) => user._id) || [];

  const {
    selectedIds,
    selectedCount,
    allSelected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    toggleAll,
  } = useBulkSelection(allIds);

  const { bulkUpdateUserTags, bulkRemoveUsers, bulkSetUserRoles } =
    useBulkUserOperations();
  const handleBulkResult = useBulkResultHandler();
  const confirmBulkAction = useBulkActionConfirmation();

  const canUpdateTags = hasRole(IRoleAction.BulkUpdateUserTags);
  const canSetRoles = hasRole(IRoleAction.BulkSetUserRoles);
  const canRemove = hasRole(IRoleAction.BulkRemoveUsers);
  const bulkActions: BulkAction[] = [
    ...(canUpdateTags
      ? [
          {
            key: 'update-tags',
            label: formatMessage({
              id: 'bulk_update_tags',
              defaultMessage: 'Update Tags',
            }),
            renderForm: ({ onSubmit, onCancel, loading }) => (
              <BulkTagForm
                onSubmit={onSubmit}
                onCancel={onCancel}
                loading={loading}
              />
            ),
            onAction: (ids: string[], data?: unknown) => {
              const { add, remove } = (data || {}) as BulkTagData;
              return handleBulkResult(
                () => bulkUpdateUserTags(ids, add, remove),
                'bulkUpdateUserTags',
              );
            },
          },
        ]
      : []),
    ...(canSetRoles
      ? [
          {
            key: 'set-roles',
            label: formatMessage({
              id: 'bulk_set_roles',
              defaultMessage: 'Set Roles',
            }),
            renderForm: ({ onSubmit, onCancel, loading }) => (
              <BulkRolesForm
                onSubmit={(roles) => onSubmit(roles)}
                onCancel={onCancel}
                loading={loading}
              />
            ),
            onAction: (ids: string[], data?: unknown) =>
              handleBulkResult(
                () => bulkSetUserRoles(ids, data as string[]),
                'bulkSetUserRoles',
              ),
          },
        ]
      : []),
    ...(canRemove
      ? [
          {
            key: 'delete',
            label: formatMessage({
              id: 'bulk_delete',
              defaultMessage: 'Delete',
            }),
            variant: 'danger' as const,
            onAction: (ids: string[]) =>
              confirmBulkAction({
                message: formatMessage(
                  {
                    id: 'bulk_delete_users_warning',
                    defaultMessage:
                      'This will permanently delete {count} users. Are you sure?',
                  },
                  { count: ids.length },
                ),
                okText: formatMessage({
                  id: 'delete_users',
                  defaultMessage: 'Delete Users',
                }),
                onConfirm: () =>
                  handleBulkResult(
                    () => bulkRemoveUsers(ids),
                    'bulkRemoveUsers',
                  ),
              }),
          },
        ]
      : []),
  ];
  const canSelect = bulkActions.length > 0;

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        onClear={clearAll}
        onSelectionChange={selectAll}
        actions={bulkActions}
      />
      <Table className="min-w-full">
        {users?.map((user) => (
          <Table.Row key={user._id} header>
            {canSelect && (
              <Table.Cell>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </Table.Cell>
            )}
            <Table.Cell>
              {formatMessage({ id: 'name', defaultMessage: 'Name' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'email', defaultMessage: 'Email' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'status', defaultMessage: 'Status' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({
                id: 'last_login',
                defaultMessage: 'Last Login:',
              })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'cart', defaultMessage: 'Cart' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'orders', defaultMessage: 'Orders' })}
            </Table.Cell>
            <Table.Cell className="text-right">&nbsp;</Table.Cell>
          </Table.Row>
        ))}

        {users?.map((user) => (
          <UserListItem
            key={`${user?._id}-body`}
            user={user}
            isSelected={isSelected(user._id)}
            onToggleSelect={() => toggle(user._id)}
            showCheckbox={canSelect}
          />
        ))}
      </Table>
    </>
  );
};

const BulkRolesForm = ({
  onSubmit,
  onCancel,
  loading,
}: {
  onSubmit: (roles: string[]) => void | Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) => {
  const { formatMessage } = useIntl();
  const [roles, setRoles] = React.useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = roles
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        if (parsed.length && !loading) void onSubmit(parsed);
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="bulk-roles"
          className="text-xs text-slate-500 dark:text-slate-300"
        >
          {formatMessage({
            id: 'bulk_roles',
            defaultMessage: 'Roles (comma-separated)',
          })}
        </label>
        <input
          id="bulk-roles"
          type="text"
          value={roles}
          disabled={loading}
          onChange={(e) => setRoles(e.target.value)}
          placeholder="admin, editor"
          className="text-sm px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !roles.trim()}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50"
      >
        {formatMessage({ id: 'apply', defaultMessage: 'Apply' })}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onCancel}
        className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300"
      >
        {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
      </button>
    </form>
  );
};

export default UserList;
