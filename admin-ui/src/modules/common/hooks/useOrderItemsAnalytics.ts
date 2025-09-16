import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import OrderDetailFragment from '../../order/fragments/OrderDetailFragment';
import {
  IOrdersWithItemsQuery,
  IOrdersWithItemsQueryVariables,
} from '../../../gql/types';

const ORDERS_WITH_ITEMS_QUERY = gql`
  query OrdersWithItems($limit: Int, $includeCarts: Boolean) {
    orders(limit: $limit, includeCarts: $includeCarts) {
      ...OrderDetailFragment
    }
  }
  ${OrderDetailFragment}
`;

interface ProductSales {
  productId: string;
  productName: string;
  productImage?: string;
  product?: any; // Full product object for URL generation
  totalQuantity: number;
  totalRevenue: number;
}

interface OrderItemsAnalytics {
  topProducts: ProductSales[];
  loading: boolean;
  error: any;
}

const useOrderItemsAnalytics = (): OrderItemsAnalytics => {
  const { data, loading, error } = useQuery<
    IOrdersWithItemsQuery,
    IOrdersWithItemsQueryVariables
  >(ORDERS_WITH_ITEMS_QUERY, {
    variables: {
      limit: 500, // Get recent orders to analyze
      includeCarts: false,
    },
    errorPolicy: 'all', // Continue even if there are errors
  });

  const topProducts = useMemo(() => {
    if (!data?.orders) {
      return [];
    }

    const orders = data.orders.filter((order: any) => order.status !== 'CART');

    // Group products by sales
    const productSalesMap = new Map<string, ProductSales>();

    orders.forEach((order: any) => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const productId = item.product?._id;
          // Get product name - texts is an object, not array
          const productName =
            item.product?.texts?.title ||
            item.product?.texts?.subtitle ||
            `Product ${productId?.slice(-6)}` ||
            'Unknown Product';

          // Get product image URL
          const productImage = item.product?.media?.[0]?.file?.url;

          if (productId) {
            const existing = productSalesMap.get(productId);
            if (existing) {
              existing.totalQuantity += item.quantity || 0;
              existing.totalRevenue += (item.total?.amount || 0) / 100; // Convert from cents
              // Update image if we don't have one yet
              if (!existing.productImage && productImage) {
                existing.productImage = productImage;
              }
            } else {
              productSalesMap.set(productId, {
                productId,
                productName,
                productImage,
                product: item.product, // Store full product object
                totalQuantity: item.quantity || 0,
                totalRevenue: (item.total?.amount || 0) / 100, // Convert from cents
              });
            }
          }
        });
      }
    });

    // Sort products by quantity sold and take top 5
    return Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  }, [data]);

  return {
    topProducts,
    loading,
    error,
  };
};

export default useOrderItemsAnalytics;
