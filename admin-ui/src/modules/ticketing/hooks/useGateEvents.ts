import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IGateEventsQuery,
  IGateEventsQueryVariables,
} from '../../../gql/types';

const GateEventsQuery = gql`
  query GateEvents {
    ticketEvents(limit: 100, includeDrafts: false) {
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
          ercMetadata
          user {
            _id
            username
            isGuest
            primaryEmail {
              address
              verified
            }
            avatar {
              _id
              url
            }
            profile {
              displayName
              address {
                firstName
                lastName
              }
            }
            lastContact {
              emailAddress
              telNumber
            }
          }
        }
      }
    }
  }
`;

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const today = new Date().toLocaleDateString();
  const target = new Date(dateStr).toLocaleDateString();
  return today === target;
};

const useGateEvents = () => {
  const { data, loading, error, refetch } = useQuery<
    IGateEventsQuery,
    IGateEventsQueryVariables
  >(GateEventsQuery, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
  });

  const allEvents = data?.ticketEvents || [];
  const todayEvents = allEvents.filter(
    (p: any) =>
      p?.tokens?.length &&
      !p.isCanceled &&
      isToday(p?.contractConfiguration?.ercMetadataProperties?.slot),
  );

  return {
    todayEvents,
    allEvents,
    loading,
    error,
    refetch,
  };
};

export default useGateEvents;
