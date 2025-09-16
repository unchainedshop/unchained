import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentPathsQuery,
  IAssortmentPathsQueryVariables,
} from '../../../gql/types';

const AssortmentPathsQuery = gql`
  query AssortmentPaths($assortmentId: ID!) {
    assortment(assortmentId: $assortmentId) {
      assortmentPaths {
        links {
          assortmentId
        }
      }
    }
  }
`;

const useAssortmentPaths = ({
  assortmentId,
}: IAssortmentPathsQueryVariables) => {
  const { data, loading, error } = useQuery<IAssortmentPathsQuery>(
    AssortmentPathsQuery,
    {
      variables: {
        assortmentId,
      },
    },
  );

  const assortmentsPaths = (data?.assortment?.assortmentPaths || [])?.flatMap(
    ({ links }) => links,
  );

  return { assortmentsPaths, loading, error };
};

export default useAssortmentPaths;
