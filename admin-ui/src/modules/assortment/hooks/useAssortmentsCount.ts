import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentsCountQuery,
  IAssortmentsCountQueryVariables,
} from '../../../gql/types';

const AssortmentsCountQuery = gql`
  query AssortmentsCount(
    $queryString: String
    $tags: [LowerCaseString!]
    $includeInactive: Boolean
    $includeLeaves: Boolean
  ) {
    assortmentsCount(
      tags: $tags
      includeInactive: $includeInactive
      includeLeaves: $includeLeaves
      queryString: $queryString
    )
  }
`;

const useAssortmentsCount = ({
  queryString = '',
  tags = null,
  includeInactive = true,
  includeLeaves = false,
}: IAssortmentsCountQueryVariables) => {
  const { data, loading, error } = useQuery<
    IAssortmentsCountQuery,
    IAssortmentsCountQueryVariables
  >(AssortmentsCountQuery, {
    variables: {
      queryString,
      tags,
      includeInactive,
      includeLeaves,
    },
  });
  const assortmentsCount = data?.assortmentsCount;

  return {
    loading,
    error,
    assortmentsCount,
  };
};

export default useAssortmentsCount;
