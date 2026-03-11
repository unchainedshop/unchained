import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IGateEventsQuery,
  IGateEventsQueryVariables,
} from '../../../gql/types';

const GateEventsQuery = gql`
  query GateEvents($onlyInvalidateable: Boolean!) {
    ticketEvents(
      limit: 100
      includeDrafts: false
      onlyInvalidateable: $onlyInvalidateable
    ) {
      _id
      status
      ... on TokenizedProduct {
        texts {
          _id
          title
          subtitle
        }
        contractConfiguration {
          ercMetadataProperties
          supply
        }
        isCanceled
        tokens {
          _id
          tokenSerialNumber
          isCanceled
          invalidatedDate
          isInvalidateable
        }
      }
    }
  }
`;

const useGateEvents = ({
  onlyInvalidateable = false,
}: { onlyInvalidateable?: boolean } = {}) => {
  const { data, loading, error, refetch, previousData } = useQuery<
    IGateEventsQuery,
    IGateEventsQueryVariables
  >(GateEventsQuery, {
    variables: { onlyInvalidateable },
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
  });

  const events = (
    data?.ticketEvents ||
    previousData?.ticketEvents ||
    []
  ).filter((p: any) => p?.tokens?.length && !p.isCanceled);

  return {
    events,
    loading,
    error,
    refetch,
  };
};

export default useGateEvents;
