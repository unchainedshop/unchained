import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import WorkFilter from '../../modules/work/components/WorkFilter';
import WorkList from '../../modules/work/components/WorkList';
import useWorkQueue from '../../modules/work/hooks/useWorkQueue';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import { ISortOptionInput, IWorkStatus, IWorkType } from '../../gql/types';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import WorkDetailPage from './WorkDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';

const WorkQueueView = () => {
  const { query, push } = useRouter();
  const { hasRole } = useAuth();
  const { formatMessage } = useIntl();
  const filter = {
    created: {
      start: query?.start,
      end: query?.end,
    },
    status: (query?.status as string)?.split(',') as IWorkStatus[],
    types: (query?.types as string)?.split(',') as IWorkType[],
  };
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;

  const sort = query?.sort || '';

  const { queryString, workerId, ...restQuery } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = restQuery;
    if (searchString) {
      push({
        query: normalizeQuery(withoutSkip, searchString, 'queryString'),
      });
    } else {
      push({
        query: normalizeQuery(restQuery),
      });
    }
  };
  const sortKeys = convertSortFieldsToQueryFormat(sort);

  const { workQueue, loadMore, loading, activeWorkTypes, total, hasMore } =
    useWorkQueue({
      queryString: queryString as string,
      limit,
      ...filter,
      sort: sortKeys as ISortOptionInput[],
      offset,
    });

  if (workerId) return <WorkDetailPage workerId={workerId} />;

  const headerText =
    total === 1
      ? formatMessage({
          id: 'work_header',
          defaultMessage: '1 Work Item',
        })
      : formatMessage(
          {
            id: 'work_count_header',
            defaultMessage: '{count} Work Items',
          },
          { count: <AnimatedCounter value={total} /> },
        );
  return (
    <>
      <BreadCrumbs
        depth={3}
        currentPageTitle={formatMessage({
          id: 'work_queue_header',
          defaultMessage: 'Work queue',
        })}
      />
      <PageHeader
        title={formatMessage(
          {
            id: 'work_page_title',
            defaultMessage:
              '{count, plural, one {# Work Item} other {# Work Items}}',
          },
          { count: total },
        )}
        headerText={headerText}
        addPath={
          (hasRole('allocateWork') || hasRole('addWork')) && '/works/management'
        }
        addButtonText={formatMessage({
          id: 'manage',
          defaultMessage: 'Manage',
        })}
      />
      <WorkFilter workTypes={activeWorkTypes} />
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader />

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && workQueue?.length === 0 ? (
              <Loading />
            ) : (
              <WorkList workQueue={workQueue} sortable />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default WorkQueueView;
