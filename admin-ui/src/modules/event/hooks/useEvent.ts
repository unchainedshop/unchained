import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IEventQuery, IEventQueryVariables } from '../../../gql/types';
import EventFragment from '../fragments/EventFragment';

const EventQuery = gql`
  query Event($eventId: ID!) {
    event(eventId: $eventId) {
      ...EventFragment
    }
  }
  ${EventFragment}
`;

const useEvent = ({ eventId = null }: IEventQueryVariables) => {
  const { data, loading, error } = useQuery<IEventQuery, IEventQueryVariables>(
    EventQuery,
    {
      skip: !eventId,
      variables: { eventId },
    },
  );
  const event = data?.event || [];

  return {
    event,
    loading,
    error,
  };
};

export default useEvent;
