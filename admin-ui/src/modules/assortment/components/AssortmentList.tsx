import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { IRoleAction } from '../../../gql/types';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import BulkActionsToolbar from '../../common/components/BulkActionsToolbar';
import BulkTagForm from '../../common/components/BulkTagForm';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkAssortmentOperations from '../hooks/useBulkAssortmentOperations';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import AssortmentListItem from './AssortmentListItem';

const AssortmentList = ({ assortments, showAvatar = true, sortable }) => {
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

  const {
    bulkRemoveAssortments,
    bulkUpdateAssortmentTags,
    bulkSetAssortmentActive,
  } = useBulkAssortmentOperations();

  const allIds = assortments?.map((a) => a._id) || [];
  const canManage = hasRole(IRoleAction.ManageAssortments);

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
          key: 'activate',
          label: formatMessage({
            id: 'bulk_activate',
            defaultMessage: 'Activate',
          }),
          onAction: async (ids: string[]) => {
            const result = await bulkSetAssortmentActive(ids, true);
            handleBulkResult(result, 'bulkSetAssortmentActive');
          },
        },
        {
          key: 'deactivate',
          label: formatMessage({
            id: 'bulk_deactivate',
            defaultMessage: 'Deactivate',
          }),
          onAction: async (ids: string[]) => {
            const result = await bulkSetAssortmentActive(ids, false);
            handleBulkResult(result, 'bulkSetAssortmentActive');
          },
        },
        {
          key: 'update-tags',
          label: formatMessage({
            id: 'bulk_update_tags',
            defaultMessage: 'Update Tags',
          }),
          renderForm: ({ onCancel }) => (
            <BulkTagForm
              onSubmit={async ({ add, remove }) => {
                const result = await bulkUpdateAssortmentTags(
                  selectedIds,
                  add,
                  remove,
                );
                handleBulkResult(result, 'bulkUpdateAssortmentTags');
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
                      id: 'bulk_delete_assortments_warning',
                      defaultMessage:
                        'This will permanently delete {count} assortments. Are you sure?',
                    },
                    { count: ids.length },
                  )}
                  onOkClick={async () => {
                    setModal('');
                    const result = await bulkRemoveAssortments(ids);
                    handleBulkResult(result, 'bulkRemoveAssortments');
                    resolve();
                  }}
                  okText={formatMessage({
                    id: 'delete_assortments',
                    defaultMessage: 'Delete Assortments',
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
        {assortments?.map((assortment) => (
          <Table.Row key={assortment._id} header enablesort={sortable}>
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
            <Table.Cell sortKey="isActive">
              {formatMessage({ id: 'active', defaultMessage: 'Active' })}
            </Table.Cell>
            <Table.Cell sortKey="isRoot">
              {formatMessage({ id: 'root', defaultMessage: 'Root' })}
            </Table.Cell>
            <Table.Cell sortKey="sequence" defaultSortDirection="ASC">
              {formatMessage({
                id: 'sequence',
                defaultMessage: 'Display Order',
              })}
            </Table.Cell>
            <Table.Cell>&nbsp;</Table.Cell>
          </Table.Row>
        ))}
        {assortments?.map((assortment) => (
          <AssortmentListItem
            showAvatar={showAvatar}
            key={`${assortment?._id}-body`}
            assortment={assortment}
            isSelected={isSelected(assortment._id)}
            onToggleSelect={() => toggle(assortment._id)}
            showCheckbox={canManage}
          />
        ))}
      </Table>
    </>
  );
};

export default AssortmentList;
