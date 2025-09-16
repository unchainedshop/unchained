import Loading from '../../common/components/Loading';
import InfiniteScroll from '../../common/components/InfiniteScroll';
import { convertSortFieldsToQueryFormat } from '../../common/utils/utils';
import useAssortments from '../hooks/useAssortments';
import AssortmentList from './AssortmentList';
import useApp from '../../common/hooks/useApp';

const AssortmentListView = ({ options, queryString, sortable }) => {
  const { includeInactive, includeLeaves, limit, offset, tags, slug, sort } =
    options;
  const { selectedLocale } = useApp();
  const sortKeys = convertSortFieldsToQueryFormat(sort);

  const { assortments, loading, loadMore, hasMore } = useAssortments({
    queryString,
    includeInactive,
    includeLeaves,
    limit,
    offset,
    tags,
    slugs: slug,
    sort: sortKeys,
    forceLocale: selectedLocale,
  });

  if (loading && assortments?.length === 0) {
    return <Loading />;
  }

  return (
    <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
      <AssortmentList assortments={assortments} sortable={sortable} />
    </InfiniteScroll>
  );
};

export default AssortmentListView;
