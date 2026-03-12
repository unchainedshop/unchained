import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ActiveWorkTypesQuery = gql`
  query ActiveWorkTypes {
    activeWorkTypes
  }
`;

const useRegisteredWorkTypes = () => {
  const { data, loading, error } = useQuery<{
    activeWorkTypes: string[];
  }>(ActiveWorkTypesQuery);

  const workTypes = (data?.activeWorkTypes || []).map((type) => ({
    value: type,
    label: type,
  }));

  return {
    workTypes,
    loading,
    error,
  };
};

export default useRegisteredWorkTypes;
