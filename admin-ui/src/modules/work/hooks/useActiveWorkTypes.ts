import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IActiveWorkTypesQuery,
  IActiveWorkTypesQueryVariables,
} from '../../../gql/types';

const ActiveWorkTypesQuery = gql`
  query ActiveWorkTypes {
    activeWorkTypes
  }
`;

const useActiveWorkTypes = () => {
  const { data, loading, error } = useQuery<
    IActiveWorkTypesQuery,
    IActiveWorkTypesQueryVariables
  >(ActiveWorkTypesQuery);

  const activeWorkTypes = data?.activeWorkTypes || [];

  return {
    activeWorkTypes,
    loading,
    error,
  };
};

export default useActiveWorkTypes;
