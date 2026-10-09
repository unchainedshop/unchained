import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IMediasQuery,
  IMediasQueryVariables,
} from '../../../gql/types';
import MediaFragment from '../fragments/MediaFragment';

const MediasQuery = gql`
  query Medias(
    $limit: Int
    $offset: Int
    $path: String
    $types: [String!]
    $queryString: String
    $sort: [SortOptionInput!]
  ) {
    medias(
      limit: $limit
      offset: $offset
      path: $path
      types: $types
      queryString: $queryString
      sort: $sort
    ) {
      ...MediaFragment
    }
    mediasCount(path: $path, types: $types, queryString: $queryString)
  }
  ${MediaFragment}
`;

const useMedias = ({
  limit = 20,
  offset = 0,
  path = null,
  types = null,
  queryString = null,
  sort: sortOptions = [],
} = {}) => {
  const { data, loading, error, fetchMore, previousData } = useQuery<
    IMediasQuery,
    IMediasQueryVariables
  >(
    MediasQuery,
    {
      variables: {
        limit,
        offset,
        path,
        types,
        queryString,
        sort: sortOptions?.length
          ? sortOptions
          : [{ key: 'created', value: 'DESC' }],
      },
    },
  );
  const medias = data?.medias || previousData?.medias || [];
  const mediasCount = data?.mediasCount;

  const hasMore = medias?.length < mediasCount;
  const loadMore = () => {
    fetchMore({
      variables: { offset: medias.length },
    });
  };

  return {
    medias,
    hasMore,
    mediasCount,
    loadMore,
    loading,
    error,
  };
};

export default useMedias;
