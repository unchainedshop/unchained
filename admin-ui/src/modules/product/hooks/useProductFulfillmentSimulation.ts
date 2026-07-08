import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import {
  IProductFulfillmentSimulationQuery,
  IProductFulfillmentSimulationQueryVariables,
} from '../../../gql/types';

const ProductFulfillmentSimulationQuery = gql`
  query ProductFulfillmentSimulation(
    $productId: ID
    $deliveryProviderType: DeliveryProviderType
    $quantity: Int
    $referenceDate: Timestamp
  ) {
    product(productId: $productId) {
      _id
      ... on SimpleProduct {
        simulatedDispatches(
          deliveryProviderType: $deliveryProviderType
          quantity: $quantity
          referenceDate: $referenceDate
        ) {
          shipping
          earliestDelivery
          deliveryProvider {
            _id
            type
            isActive
            interface {
              _id
              label
              version
            }
          }
          warehousingProvider {
            _id
            type
            isActive
            interface {
              _id
              label
              version
            }
          }
        }
        simulatedStocks(
          deliveryProviderType: $deliveryProviderType
          referenceDate: $referenceDate
        ) {
          quantity
          deliveryProvider {
            _id
            type
            interface {
              _id
              label
            }
          }
          warehousingProvider {
            _id
            interface {
              _id
              label
            }
          }
        }
      }
    }
  }
`;

const matchesProviderPair = (a, b) =>
  a?.deliveryProvider?._id === b?.deliveryProvider?._id &&
  a?.warehousingProvider?._id === b?.warehousingProvider?._id;

const useProductFulfillmentSimulation = ({
  productId,
  deliveryProviderType = null,
  quantity = null,
  referenceDate = null,
}: IProductFulfillmentSimulationQueryVariables) => {
  const { data, loading, error } = useQuery<
    IProductFulfillmentSimulationQuery,
    IProductFulfillmentSimulationQueryVariables
  >(ProductFulfillmentSimulationQuery, {
    skip: !productId,
    variables: {
      productId,
      deliveryProviderType,
      quantity,
      referenceDate,
    },
    errorPolicy: 'all',
  });

  // The engine currently returns dispatches for all delivery provider types
  // regardless of the deliveryProviderType argument, so filter here as well.
  const { dispatches, unroutedStocks } = useMemo(() => {
    const product: any = data?.product || {};
    const simulatedDispatches = (product?.simulatedDispatches || []).filter(
      (dispatch) =>
        !deliveryProviderType ||
        dispatch?.deliveryProvider?.type === deliveryProviderType,
    );
    const simulatedStocks = (product?.simulatedStocks || []).filter(
      (stock) =>
        !deliveryProviderType ||
        !stock?.deliveryProvider?.type ||
        stock?.deliveryProvider?.type === deliveryProviderType,
    );

    return {
      dispatches: simulatedDispatches.map((dispatch) => ({
        ...dispatch,
        stockQuantity:
          simulatedStocks.find((stock) => matchesProviderPair(stock, dispatch))
            ?.quantity ?? null,
      })),
      unroutedStocks: simulatedStocks.filter(
        (stock) =>
          !simulatedDispatches.some((dispatch) =>
            matchesProviderPair(stock, dispatch),
          ),
      ),
    };
  }, [data, deliveryProviderType]);

  return {
    dispatches,
    unroutedStocks,
    loading,
    error,
  };
};

export default useProductFulfillmentSimulation;
