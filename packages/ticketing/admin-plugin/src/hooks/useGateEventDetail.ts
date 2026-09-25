import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const GateEventDetailQuery = gql`
  query GateEventDetail($productId: ID!) {
    product(productId: $productId) {
      _id
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
          attendee {
            name
            email
          }
        }
      }
    }
  }
`;

const useGateEventDetail = (productId: string | null) => {
  const { data, loading, error, refetch, previousData } = useQuery(GateEventDetailQuery, {
    variables: { productId },
    skip: !productId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
  });

  return {
    event: (data as any)?.product || (previousData as any)?.product || null,
    loading,
    error,
    refetch,
  };
};

export default useGateEventDetail;
