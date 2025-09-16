import { useIntl } from 'react-intl';
import Loading from '../../common/components/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
import useProducts from '../hooks/useProducts';
import ProductListItem from './ProductListItem';
import useApp from '../../common/hooks/useApp';

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
  const { products, loading, loadMore, hasMore } = useProducts({
    queryString,
    includeDrafts,
    limit,
    offset,
    tags,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });

  if (loading && products?.length === 0) {
    return <Loading />;
  }

  return (
    <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
      <Table className="min-w-full ">
        {products?.map((product) => (
          <Table.Row key={product._id} header enablesort={sortable}>
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
          />
        ))}
      </Table>
    </InfiniteScroll>
  );
};

export default ProductList;
