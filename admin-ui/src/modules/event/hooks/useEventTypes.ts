import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const RegisteredEventTypesQuery = gql`
  query RegisteredEventTypes {
    registeredEventTypes
  }
`;

const useEventTypes = () => {
  const { data, loading, error } = useQuery<{
    registeredEventTypes: string[];
  }>(RegisteredEventTypesQuery);

  const eventsType = (data?.registeredEventTypes || []).map((type) => ({
    value: type,
    label: type,
  }));

  return {
    eventsType,
    loading,
    error,
  };
};

export default useEventTypes;
