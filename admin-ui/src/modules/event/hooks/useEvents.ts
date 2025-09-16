import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IEventsQuery,
  IEventsQueryVariables,
  ISortDirection,
} from '../../../gql/types';
import EventFragment from '../fragments/EventFragment';

const EventQuery = gql`
  query Events(
    $types: [String!]
    $limit: Int
    $offset: Int
    $sort: [SortOptionInput!]
    $queryString: String
    $created: DateFilterInput
  ) {
    events(
      types: $types
      limit: $limit
      offset: $offset
      sort: $sort
      queryString: $queryString
      created: $created
    ) {
      ...EventFragment
    }
    eventsCount(types: $types, created: $created, queryString: $queryString)
  }
  ${EventFragment}
`;

const useEvents = ({
  types = null,
  limit = 20,
  offset = 0,
  sort: sortOptions = [],
  queryString = null,
  created = null,
}: IEventsQueryVariables = {}) => {
  const { data, loading, error, fetchMore, previousData } = useQuery<
    IEventsQuery,
    IEventsQueryVariables
  >(EventQuery, {
    variables: {
      types,
      limit,
      offset,
      sort: sortOptions?.length
        ? sortOptions
        : [{ key: 'created', value: ISortDirection.Desc }],
      queryString,
      created,
    },
  });
  const events = data?.events || previousData?.events || [];
  const eventsCount = data?.eventsCount;

  const hasMore = events?.length < eventsCount;
  const loadMore = () => {
    fetchMore({
      variables: { offset: events.length },
    });
  };

  return {
    events,
    hasMore,
    eventsCount,
    loadMore,
    loading,
    error,
  };
};

export default useEvents;
