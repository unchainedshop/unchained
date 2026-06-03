import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Loading from '@/components/ui/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
import BulkActionsToolbar from '../../common/components/BulkActionsToolbar';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkFilterOperations from '../hooks/useBulkFilterOperations';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import useFilters from '../hooks/useFilters';
import FilterListItem from './FilterListItem';
import useApp from '../../common/hooks/useApp';

const FilterList = ({
  onRemoveFilter,
  sortKeys,
  queryString,
  limit,
  includeInactive,
  offset,
}) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { filters, loading, loadMore, hasMore } = useFilters({
    queryString,
    limit,
    includeInactive,
    offset,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });

  const {
    selectedIds,
    selectedCount,
    toggle,
    clearAll,
    isSelected,
    toggleAll,
  } = useBulkSelection();

  const { bulkRemoveFilters, bulkSetFilterActive } = useBulkFilterOperations();

  const allIds = filters?.map((f) => f._id) || [];
  const canManage = hasRole(IRoleAction.ManageFilters);

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
            const result = await bulkSetFilterActive(ids, true);
            handleBulkResult(result, 'bulkSetFilterActive');
          },
        },
        {
          key: 'deactivate',
          label: formatMessage({
            id: 'bulk_deactivate',
            defaultMessage: 'Deactivate',
          }),
          onAction: async (ids: string[]) => {
            const result = await bulkSetFilterActive(ids, false);
            handleBulkResult(result, 'bulkSetFilterActive');
          },
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
                      id: 'bulk_delete_filters_warning',
                      defaultMessage:
                        'This will permanently delete {count} filters. Are you sure?',
                    },
                    { count: ids.length },
                  )}
                  onOkClick={async () => {
                    setModal('');
                    const result = await bulkRemoveFilters(ids);
                    handleBulkResult(result, 'bulkRemoveFilters');
                    resolve();
                  }}
                  okText={formatMessage({
                    id: 'delete_filters',
                    defaultMessage: 'Delete Filters',
                  })}
                />,
              );
            });
          },
        },
      ]
    : [];

  if (loading && filters?.length === 0) {
    return <Loading />;
  }

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        onClear={clearAll}
        actions={bulkActions}
      />
      <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
        <Table className="min-w-full ">
          {filters?.map((filter) => (
            <Table.Row key={filter._id} header>
              {canManage && (
                <Table.Cell>
                  <input
                    type="checkbox"
                    checked={
                      allIds.length > 0 && selectedCount === allIds.length
                    }
                    onChange={() => toggleAll(allIds)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Table.Cell>
              )}
              <Table.Cell>
                {formatMessage({
                  id: 'filter_key',
                  defaultMessage: 'Key',
                  description: 'Filter form key',
                })}
              </Table.Cell>

              <Table.Cell name="type">
                {formatMessage({ id: 'type', defaultMessage: 'Type' })}
              </Table.Cell>

              <Table.Cell name="isActive">
                {formatMessage({ id: 'active', defaultMessage: 'Active' })}
              </Table.Cell>

              <Table.Cell>
                {formatMessage({
                  id: 'options',
                  defaultMessage: 'Options',
                })}
              </Table.Cell>
              <Table.Cell>
                <span className="sr-only">
                  {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
                </span>
              </Table.Cell>
            </Table.Row>
          ))}
          {filters?.map((filter) => (
            <FilterListItem
              key={`${filter?._id}-body`}
              filter={filter}
              onRemove={onRemoveFilter}
              isSelected={isSelected(filter._id)}
              onToggleSelect={() => toggle(filter._id)}
              showCheckbox={canManage}
            />
          ))}
        </Table>
      </InfiniteScroll>
    </>
  );
};

export default FilterList;
