import { useIntl } from 'react-intl';
import Loading from '@/components/ui/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
import BulkActionsToolbar from '../../common/components/BulkActionsToolbar';
import BulkTagForm from '../../common/components/BulkTagForm';
import useProducts from '../hooks/useProducts';
import useBulkProductOperations from '../hooks/useBulkProductOperations';
import useBulkSelection from '../../common/hooks/useBulkSelection';
import useBulkResultHandler from '../../common/hooks/useBulkResultHandler';
import useAuth from '../../Auth/useAuth';
import { IRoleAction } from '../../../gql/types';
import ProductListItem from './ProductListItem';
import useApp from '../../common/hooks/useApp';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';

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
  const { setModal } = useModal();
  const { products, loading, loadMore, hasMore } = useProducts({
    queryString,
    includeDrafts,
    limit,
    offset,
    tags,
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

  const { bulkSetProductStatus, bulkUpdateProductTags, bulkRemoveProducts } =
    useBulkProductOperations();
  const handleBulkResult = useBulkResultHandler();

  const allIds = products?.map((p) => p._id) || [];

  const bulkActions = hasRole(IRoleAction.ManageProducts)
    ? [
        {
          key: 'set-active',
          label: formatMessage({
            id: 'bulk_set_active',
            defaultMessage: 'Set Active',
          }),
          onAction: async (ids: string[]) => {
            await handleBulkResult(
              () => bulkSetProductStatus(ids, 'ACTIVE'),
              'bulkSetProductStatus',
            );
          },
        },
        {
          key: 'set-draft',
          label: formatMessage({
            id: 'bulk_set_draft',
            defaultMessage: 'Set Draft',
          }),
          onAction: async (ids: string[]) => {
            await handleBulkResult(
              () => bulkSetProductStatus(ids, 'DRAFT'),
              'bulkSetProductStatus',
            );
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
                await handleBulkResult(
                  () => bulkUpdateProductTags(selectedIds, add, remove),
                  'bulkUpdateProductTags',
                );
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
                      id: 'bulk_delete_products_warning',
                      defaultMessage:
                        'This will permanently delete {count} products. Are you sure?',
                    },
                    { count: ids.length },
                  )}
                  onOkClick={async () => {
                    setModal('');
                    await handleBulkResult(
                      () => bulkRemoveProducts(ids),
                      'bulkRemoveProducts',
                    );
                    resolve();
                  }}
                  okText={formatMessage({
                    id: 'delete_products',
                    defaultMessage: 'Delete Products',
                  })}
                />,
              );
            });
          },
        },
      ]
    : [];

  if (loading && products?.length === 0) {
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
          {products?.map((product) => (
            <Table.Row key={product._id} header enablesort={sortable}>
              {hasRole(IRoleAction.ManageProducts) && (
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
              showCheckbox={hasRole(IRoleAction.ManageProducts)}
            />
          ))}
        </Table>
      </InfiniteScroll>
    </>
  );
};

export default ProductList;
