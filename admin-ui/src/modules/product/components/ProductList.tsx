import { useIntl } from 'react-intl';
import Loading from '@/components/ui/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
import BulkActionsToolbar, {
  type BulkAction,
} from '../../common/components/BulkActionsToolbar';
import BulkTagForm, {
  type BulkTagData,
} from '../../common/components/BulkTagForm';
import useProducts from '../hooks/useProducts';
import useBulkProductOperations from '../hooks/useBulkProductOperations';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkResultHandler from '../../common/hooks/useBulkResultHandler';
import useAuth from '../../Auth/useAuth';
import { IProductStatus, IRoleAction } from '../../../gql/types';
import ProductListItem from './ProductListItem';
import useApp from '../../common/hooks/useApp';
import useBulkActionConfirmation from '../../common/hooks/useBulkActionConfirmation';

const ProductList = ({
  showAvatar = true,
  queryString,
  limit,
  offset,
  tags,
  sortKeys,
  includeDrafts,
  sortable,
}) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { hasRole } = useAuth();
  const { products, loading, loadMore, hasMore } = useProducts({
    queryString,
    includeDrafts,
    limit,
    offset,
    tags,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });
  const allIds = products?.map((product) => product._id) || [];

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

  const { bulkSetProductStatus, bulkUpdateProductTags, bulkRemoveProducts } =
    useBulkProductOperations();
  const handleBulkResult = useBulkResultHandler();
  const confirmBulkAction = useBulkActionConfirmation();

  const canSetStatus = hasRole(IRoleAction.BulkSetProductStatus);
  const canUpdateTags = hasRole(IRoleAction.BulkUpdateProductTags);
  const canRemove = hasRole(IRoleAction.BulkRemoveProducts);
  const bulkActions: BulkAction[] = [
    ...(canSetStatus
      ? [
          {
            key: 'set-active',
            label: formatMessage({
              id: 'bulk_set_active',
              defaultMessage: 'Set Active',
            }),
            onAction: (ids: string[]) =>
              handleBulkResult(
                () => bulkSetProductStatus(ids, IProductStatus.Active),
                'bulkSetProductStatus',
              ),
          },
          {
            key: 'set-draft',
            label: formatMessage({
              id: 'bulk_set_draft',
              defaultMessage: 'Set Draft',
            }),
            onAction: (ids: string[]) =>
              handleBulkResult(
                () => bulkSetProductStatus(ids, IProductStatus.Draft),
                'bulkSetProductStatus',
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
                () => bulkUpdateProductTags(ids, add, remove),
                'bulkUpdateProductTags',
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
                    id: 'bulk_delete_products_warning',
                    defaultMessage:
                      'This will permanently delete {count} products. Are you sure?',
                  },
                  { count: ids.length },
                ),
                okText: formatMessage({
                  id: 'delete_products',
                  defaultMessage: 'Delete Products',
                }),
                onConfirm: () =>
                  handleBulkResult(
                    () => bulkRemoveProducts(ids),
                    'bulkRemoveProducts',
                  ),
              }),
          },
        ]
      : []),
  ];
  const canSelect = bulkActions.length > 0;

  if (loading && products?.length === 0) {
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
          {products?.map((product) => (
            <Table.Row key={product._id} header enablesort={sortable}>
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
                  id: 'name',
                  defaultMessage: 'Name',
                })}
              </Table.Cell>
              <Table.Cell sortKey="type">
                {formatMessage({
                  id: 'type',
                  defaultMessage: 'Type',
                })}
              </Table.Cell>
              <Table.Cell sortKey="status">
                {formatMessage({
                  id: 'status',
                  defaultMessage: 'Status',
                })}
              </Table.Cell>

              <Table.Cell>
                {formatMessage({
                  id: 'tags',
                  defaultMessage: 'Tags',
                })}
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

          {products?.map((product) => (
            <ProductListItem
              key={`${product?._id}-body`}
              product={product}
              showAvatar={showAvatar}
              isSelected={isSelected(product._id)}
              onToggleSelect={() => toggle(product._id)}
              showCheckbox={canSelect}
            />
          ))}
        </Table>
      </InfiniteScroll>
    </>
  );
};

export default ProductList;
