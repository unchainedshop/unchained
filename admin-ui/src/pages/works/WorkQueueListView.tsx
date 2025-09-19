import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { useMemo, useCallback, useState } from 'react';

import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import WorkFilter from '../../modules/work/components/WorkFilter';
import WorkList from '../../modules/work/components/WorkList';
import MessagesList from '../../modules/work/components/MessagesList';
import Tab from '../../modules/common/components/Tab';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import useWorkQueue from '../../modules/work/hooks/useWorkQueue';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import { ISortOptionInput, IWorkStatus, IWorkType } from '../../gql/types';
import groupMessageWorks from '../../modules/work/utils/groupMessageWorks';
import { EnvelopeIcon, RectangleStackIcon } from '@heroicons/react/24/outline';

const WorkQueueListView = () => {
  const { query, push } = useRouter();
  const { formatMessage } = useIntl();
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

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
  const sortKeys = convertSortFieldsToQueryFormat(sort);

  const { workQueue, loadMore, loading, activeWorkTypes, total, hasMore } =
    useWorkQueue({
      queryString: queryString as string,
      limit,
      ...filter,
      sort: sortKeys as ISortOptionInput[],
      offset,
    });

  const { messageGroups } = useMemo(
    () => ({
      messageGroups: groupMessageWorks(workQueue),
    }),
    [workQueue],
  );

  const tabItems = useMemo(
    () => [
      {
        id: 'all',
        title: formatMessage({
          id: 'all_workers',
          defaultMessage: 'All Workers',
        }),
        Icon: <RectangleStackIcon className="h-5 w-5" />,
      },
      {
        id: 'messages',
        title: formatMessage({ id: 'messages', defaultMessage: 'Messages' }),
        Icon: <EnvelopeIcon className="h-5 w-5" />,
      },
    ],
    [formatMessage],
  );

  const setQueryStringCallback = useCallback(
    (searchString) => {
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
    },
    [restQuery, push],
  );

  const toggleExpanded = useCallback((messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const WorkQueueContent = useCallback(
    ({ selectedView = 'all' }) => (
      <InfiniteScroll loading={loading} hasMore={hasMore} onLoadMore={loadMore}>
        {loading && workQueue?.length === 0 ? (
          <Loading />
        ) : selectedView === 'messages' ? (
          <MessagesList
            messageGroups={messageGroups}
            sortable
            expandedMessages={expandedMessages}
            onToggleExpanded={toggleExpanded}
          />
        ) : (
          <WorkList workQueue={workQueue} sortable />
        )}
      </InfiniteScroll>
    ),
    [
      loading,
      hasMore,
      loadMore,
      workQueue,
      messageGroups,
      expandedMessages,
      toggleExpanded,
    ],
  );

  return (
    <>
      <WorkFilter workTypes={activeWorkTypes} />
      <SearchWithTags
        onSearchChange={setQueryStringCallback}
        defaultSearchValue={queryString}
      >
        <Tab tabItems={tabItems} defaultTab="all">
          <WorkQueueContent />
        </Tab>
      </SearchWithTags>
    </>
  );
};

export default WorkQueueListView;
