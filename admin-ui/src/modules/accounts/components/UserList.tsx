import React from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { IRoleAction } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import BulkActionsToolbar from '../../common/components/BulkActionsToolbar';
import BulkTagForm from '../../common/components/BulkTagForm';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkUserOperations from '../hooks/useBulkUserOperations';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import UserListItem from './UserListItem';

const UserList = ({ users }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();

  const {
    selectedIds,
    selectedCount,
    toggle,
    clearAll,
    isSelected,
    toggleAll,
  } = useBulkSelection();

  const { bulkUpdateUserTags, bulkRemoveUsers, bulkSetUserRoles } =
    useBulkUserOperations();

  const allIds = users?.map((u) => u._id) || [];
  const canManage = hasRole(IRoleAction.RemoveUser);

  const handleBulkResult = (result: any, operationName: string) => {
    const data = result?.data?.[operationName];
    if (data) {
      toast.success(
        formatMessage(
          {
            id: 'bulk_operation_result',
            defaultMessage: '{successCount} succeeded, {failedCount} failed',
          },
          {
            successCount: data.successCount,
            failedCount: data.failedCount,
          },
        ),
      );
    }
  };

  const bulkActions = canManage
    ? [
        {
          key: 'update-tags',
          label: formatMessage({
            id: 'bulk_update_tags',
            defaultMessage: 'Update Tags',
          }),
          renderForm: ({ onCancel }) => (
            <BulkTagForm
              onSubmit={async ({ add, remove }) => {
                const result = await bulkUpdateUserTags(
                  selectedIds,
                  add,
                  remove,
                );
                handleBulkResult(result, 'bulkUpdateUserTags');
                clearAll();
              }}
              onCancel={onCancel}
            />
          ),
        },
        {
          key: 'set-roles',
          label: formatMessage({
            id: 'bulk_set_roles',
            defaultMessage: 'Set Roles',
          }),
          renderForm: ({ onCancel }) => (
            <BulkRolesForm
              onSubmit={async (roles) => {
                const result = await bulkSetUserRoles(selectedIds, roles);
                handleBulkResult(result, 'bulkSetUserRoles');
                clearAll();
              }}
              onCancel={onCancel}
            />
          ),
        },
        {
          key: 'delete',
          label: formatMessage({
            id: 'bulk_delete',
            defaultMessage: 'Delete',
          }),
          variant: 'danger' as const,
          onAction: async (ids: string[]) => {
            await new Promise<void>((resolve) => {
              setModal(
                <DangerMessage
                  onCancelClick={async () => {
                    setModal('');
                    resolve();
                  }}
                  message={formatMessage(
                    {
                      id: 'bulk_delete_users_warning',
                      defaultMessage:
                        'This will permanently delete {count} users. Are you sure?',
                    },
                    { count: ids.length },
                  )}
                  onOkClick={async () => {
                    setModal('');
                    const result = await bulkRemoveUsers(ids);
                    handleBulkResult(result, 'bulkRemoveUsers');
                    resolve();
                  }}
                  okText={formatMessage({
                    id: 'delete_users',
                    defaultMessage: 'Delete Users',
                  })}
                />,
              );
            });
          },
        },
      ]
    : [];

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        onClear={clearAll}
        actions={bulkActions}
      />
      <Table className="min-w-full">
        {users?.map((user) => (
          <Table.Row key={user._id} header>
            {canManage && (
              <Table.Cell>
                <input
                  type="checkbox"
                  checked={allIds.length > 0 && selectedCount === allIds.length}
                  onChange={() => toggleAll(allIds)}
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
            showCheckbox={canManage}
          />
        ))}
      </Table>
    </>
  );
};

const BulkRolesForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (roles: string[]) => void;
  onCancel: () => void;
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
        if (parsed.length) onSubmit(parsed);
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
          onChange={(e) => setRoles(e.target.value)}
          placeholder="admin, editor"
          className="text-sm px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
        />
      </div>
      <button
        type="submit"
        disabled={!roles.trim()}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50"
      >
        {formatMessage({ id: 'apply', defaultMessage: 'Apply' })}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300"
      >
        {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
      </button>
    </form>
  );
};

export default UserList;
