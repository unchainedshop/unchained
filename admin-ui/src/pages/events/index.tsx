import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { VariableIcon } from '@heroicons/react/24/outline';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';

import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import EventList from '../../modules/event/components/EventList';
import useEvents from '../../modules/event/hooks/useEvents';
import useEventTypes from '../../modules/event/hooks/useEventTypes';
import MultipleSelect from '../../modules/common/components/MultipleSelect';
import { extractQuery } from '../../modules/common/utils/normalizeFilterKeys';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import ListHeader from '../../modules/common/components/ListHeader';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import EventDetailPage from './EventDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import DateRangeFilterInput from '../../modules/common/components/DateRangeFilterInput';
import { useMemo } from 'react';

const Events = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';

  const { queryString, eventId, ...restQuery } = query;

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

  const typeChangeHandler = (selectedTypes) => {
    const { types, ...rest } = query;
    if (selectedTypes?.length) {
      push({
        query: normalizeQuery(rest, selectedTypes?.join(','), 'types'),
      });
    } else {
      push({
        query: normalizeQuery(rest),
      });
    }
  };
  const created = useMemo(() => {
    return {
      start: query?.start,
      end: query?.end,
    };
  }, [query?.start, query?.end]);
  const { events, eventsCount, loading, loadMore, hasMore } = useEvents({
    limit,
    types: (query?.types as string)?.split(','),
    offset,
    queryString: queryString as string,
    sort: sortKeys,
    created,
  });

  const { eventsType } = useEventTypes();

  if (eventId) return <EventDetailPage eventId={eventId} />;

  const headerText =
    eventsCount === 1
      ? formatMessage({
          id: 'event_header',
          defaultMessage: '1 Event',
        })
      : formatMessage(
          {
            id: 'event_count_header',
            defaultMessage: '{count} Events',
          },
          { count: <AnimatedCounter value={eventsCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <div className="w-full">
        <PageHeader
          title={formatMessage(
            {
              id: 'event_page_title',
              defaultMessage: '{count, plural, one {# Event} other {# Events}}',
            },
            { count: eventsCount },
          )}
          headerText={headerText}
        />
        <div>
          <div className="mt-3">
            <DateRangeFilterInput />
          </div>
          <div className="mt-4">
            <MultipleSelect
              label={formatMessage({
                id: 'select_type',
                defaultMessage: 'Select type',
              })}
              tagList={extractQuery(query?.types)}
              onChange={typeChangeHandler}
              options={eventsType}
            />
          </div>
        </div>
      </div>
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
            {loading && events?.length === 0 ? (
              <Loading />
            ) : (
              <EventList events={events} sortable />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Events;
