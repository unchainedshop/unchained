import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Loading from '../../common/components/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import Table from '../../common/components/Table';
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
  const { filters, filtersCount, loading, loadMore, hasMore } = useFilters({
    queryString,
    limit,
    includeInactive,
    offset,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });

  if (loading && filters?.length === 0) {
    return <Loading />;
  }

  return (
    <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
      <Table className="min-w-full ">
        {filters?.map((filter) => (
          <Table.Row key={filter._id} header>
            <Table.Cell>
              {formatMessage({
                id: 'filter_key',
                defaultMessage: 'Key',
                description: 'Filter form key',
              })}
            </Table.Cell>

            <Table.Cell name="type">
              {formatMessage({
                id: 'type',
                defaultMessage: 'Type',
              })}
            </Table.Cell>

            <Table.Cell name="isActive">
              {formatMessage({
                id: 'active',
                defaultMessage: 'Active',
              })}
            </Table.Cell>

            <Table.Cell>
              {formatMessage({
                id: 'options',
                defaultMessage: 'Options',
              })}
            </Table.Cell>
            {hasRole(IRoleAction.ManageFilters) && (
              <Table.Cell>
                <span className="sr-only">
                  {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
                </span>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
        {filters?.map((filter) => (
          <FilterListItem
            key={`${filter?._id}-body`}
            filter={filter}
            onRemove={onRemoveFilter}
          />
        ))}
      </Table>
    </InfiniteScroll>
  );
};

export default FilterList;
