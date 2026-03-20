import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ActiveWorkTypesQuery = gql`
  query ActiveWorkTypes {
    activeWorkTypes
  }
`;

const useRegisteredWorkTypes = () => {
  const { data, loading, error } = useQuery(ActiveWorkTypesQuery);

  const workTypes = (data?.activeWorkTypes || []).map((value: string) => ({
    value,
    label: value,
  }));

  return {
    workTypes,
    loading,
    error,
  };
};

export default useRegisteredWorkTypes;
