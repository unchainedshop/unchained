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
import useBulkAssortmentOperations from '../hooks/useBulkAssortmentOperations';
import useBulkActionConfirmation from '../../common/hooks/useBulkActionConfirmation';
import AssortmentListItem from './AssortmentListItem';

const AssortmentList = ({ assortments, showAvatar = true, sortable }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const allIds = assortments?.map((assortment) => assortment._id) || [];

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

  const {
    bulkRemoveAssortments,
    bulkUpdateAssortmentTags,
    bulkSetAssortmentActive,
  } = useBulkAssortmentOperations();
  const handleBulkResult = useBulkResultHandler();
  const confirmBulkAction = useBulkActionConfirmation();

  const canSetActive = hasRole(IRoleAction.BulkSetAssortmentActive);
  const canUpdateTags = hasRole(IRoleAction.BulkUpdateAssortmentTags);
  const canRemove = hasRole(IRoleAction.BulkRemoveAssortments);
  const bulkActions: BulkAction[] = [
    ...(canSetActive
      ? [
          {
            key: 'activate',
            label: formatMessage({
              id: 'bulk_activate',
              defaultMessage: 'Activate',
            }),
            onAction: (ids: string[]) =>
              handleBulkResult(
                () => bulkSetAssortmentActive(ids, true),
                'bulkSetAssortmentActive',
              ),
          },
          {
            key: 'deactivate',
            label: formatMessage({
              id: 'bulk_deactivate',
              defaultMessage: 'Deactivate',
            }),
            onAction: (ids: string[]) =>
              handleBulkResult(
                () => bulkSetAssortmentActive(ids, false),
                'bulkSetAssortmentActive',
              ),
          },
        ]
      : []),
    ...(canUpdateTags
      ? [
          {
            key: 'update-tags',
            label: formatMessage({
              id: 'bulk_update_tags',
              defaultMessage: 'Update Tags',
            }),
            renderForm: ({ onSubmit, onCancel, loading: formLoading }) => (
              <BulkTagForm
                onSubmit={onSubmit}
                onCancel={onCancel}
                loading={formLoading}
              />
            ),
            onAction: (ids: string[], data?: unknown) => {
              const { add, remove } = (data || {}) as BulkTagData;
              return handleBulkResult(
                () => bulkUpdateAssortmentTags(ids, add, remove),
                'bulkUpdateAssortmentTags',
              );
            },
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
                    id: 'bulk_delete_assortments_warning',
                    defaultMessage:
                      'This will permanently delete {count} assortments. Are you sure?',
                  },
                  { count: ids.length },
                ),
                okText: formatMessage({
                  id: 'delete_assortments',
                  defaultMessage: 'Delete Assortments',
                }),
                onConfirm: () =>
                  handleBulkResult(
                    () => bulkRemoveAssortments(ids),
                    'bulkRemoveAssortments',
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
        {assortments?.map((assortment) => (
          <Table.Row key={assortment._id} header enablesort={sortable}>
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
            showCheckbox={canSelect}
          />
        ))}
      </Table>
    </>
  );
};

export default AssortmentList;
