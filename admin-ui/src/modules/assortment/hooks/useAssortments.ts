import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentsQuery,
  IAssortmentsQueryVariables,
  ISortOptionInput,
} from '../../../gql/types';
import AssortmentFragment from '../fragments/AssortmentFragment';

const AssortmentsQuery = gql`
  query Assortments(
    $queryString: String
    $tags: [LowerCaseString!]
    $slugs: [String!]
    $limit: Int
    $offset: Int
    $includeInactive: Boolean
    $includeLeaves: Boolean
    $sort: [SortOptionInput!]
  ) {
    assortments(
      queryString: $queryString
      tags: $tags
      slugs: $slugs
      limit: $limit
      offset: $offset
      includeInactive: $includeInactive
      includeLeaves: $includeLeaves
      sort: $sort
    ) {
      ...AssortmentFragment
      linkedAssortments {
        child {
          _id
        }
      }
    }
    assortmentsCount(
      tags: $tags
      slugs: $slugs
      includeInactive: $includeInactive
      includeLeaves: $includeLeaves
      queryString: $queryString
    )
  }
  ${AssortmentFragment}
`;

const useAssortments = ({
  queryString = '',
  tags = null,
  slugs = null,
  limit = 20,
  offset = 0,
  includeInactive = true,
  includeLeaves = false,
  sort: sortOptions = [],
  forceLocale = '',
}: IAssortmentsQueryVariables & { forceLocale?: string } = {}) => {
  const { data, loading, error, fetchMore, client } = useQuery<
    IAssortmentsQuery,
    IAssortmentsQueryVariables
  >(AssortmentsQuery, {
    variables: {
      queryString,
      tags,
      slugs: slugs || null,
      limit,
      offset,
      includeInactive,
      includeLeaves,
      sort: (sortOptions as ISortOptionInput[]).length
        ? sortOptions
        : ([{ key: 'sequence', value: 'ASC' }] as ISortOptionInput[]),
    },
    context: {
      headers: { forceLocale },
    },
  });
  const assortments = data?.assortments || [];
  const assortmentsCount = data?.assortmentsCount;
  const hasMore = assortments?.length < assortmentsCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: assortments?.length },
    });
  };

  return {
    loading,
    error,
    assortmentsCount,
    hasMore,
    assortments: data?.assortments || [],
    loadMore,
    client,
  };
};

export default useAssortments;
