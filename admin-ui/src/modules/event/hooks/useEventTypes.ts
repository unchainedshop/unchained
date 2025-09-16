import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IEventsTypeQuery,
  IEventsTypeQueryVariables,
} from '../../../gql/types';

const EventsTypeQuery = gql`
  query EventsType {
    eventTypes: __type(name: "EventType") {
      options: enumValues {
        value: name
        label: name
      }
    }
  }
`;

const useEventTypes = () => {
  const { data, loading, error } = useQuery<
    IEventsTypeQuery,
    IEventsTypeQueryVariables
  >(EventsTypeQuery);

  const eventsType = data?.eventTypes?.options || [];

  return {
    eventsType,
    loading,
    error,
  };
};

export default useEventTypes;
