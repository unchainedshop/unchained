import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Loading from '@/components/ui/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
import BulkActionsToolbar, {
  type BulkAction,
} from '../../common/components/BulkActionsToolbar';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkResultHandler from '../../common/hooks/useBulkResultHandler';
import useBulkFilterOperations from '../hooks/useBulkFilterOperations';
import useBulkActionConfirmation from '../../common/hooks/useBulkActionConfirmation';
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
  const { filters, loading, loadMore, hasMore } = useFilters({
    queryString,
    limit,
    includeInactive,
    offset,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });
  const allIds = filters?.map((filter) => filter._id) || [];

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

  const { bulkRemoveFilters, bulkSetFilterActive } = useBulkFilterOperations();
  const handleBulkResult = useBulkResultHandler();
  const confirmBulkAction = useBulkActionConfirmation();

  const canSetActive = hasRole(IRoleAction.BulkSetFilterActive);
  const canRemove = hasRole(IRoleAction.BulkRemoveFilters);
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
                () => bulkSetFilterActive(ids, true),
                'bulkSetFilterActive',
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
                () => bulkSetFilterActive(ids, false),
                'bulkSetFilterActive',
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
                    id: 'bulk_delete_filters_warning',
                    defaultMessage:
                      'This will permanently delete {count} filters. Are you sure?',
                  },
                  { count: ids.length },
                ),
                okText: formatMessage({
                  id: 'delete_filters',
                  defaultMessage: 'Delete Filters',
                }),
                onConfirm: () =>
                  handleBulkResult(
                    () => bulkRemoveFilters(ids),
                    'bulkRemoveFilters',
                  ),
              }),
          },
        ]
      : []),
  ];
  const canSelect = bulkActions.length > 0;

  if (loading && filters?.length === 0) {
    return <Loading />;
  }

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedCount}
        selectedIds={selectedIds}
        onClear={clearAll}
        onSelectionChange={selectAll}
        actions={bulkActions}
      />
      <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
        <Table className="min-w-full ">
          {filters?.map((filter) => (
            <Table.Row key={filter._id} header>
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
              showCheckbox={canSelect}
            />
          ))}
        </Table>
      </InfiniteScroll>
    </>
  );
};

export default FilterList;
