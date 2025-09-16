import useOrders from '../../order/hooks/useOrders';
import useUsersCount from '../../accounts/hooks/useUsersCount';
import useAssortmentsCount from '../../assortment/hooks/useAssortmentsCount';
import useProductsCount from '../../product/hooks/useProductsCount';

const useDashboardMetrics = () => {
  const { ordersCount, loading: ordersLoading } = useOrders({ limit: 1 });
  const { usersCount, loading: usersLoading } = useUsersCount();
  const { assortmentsCount, loading: assortmentsLoading } = useAssortmentsCount(
    {},
  );
  const { productsCount, loading: productsLoading } = useProductsCount({});

  const metrics = {
    orders: {
      value: ordersCount || 0,
      loading: ordersLoading,
    },
    products: {
      value: productsCount || 0,
      loading: productsLoading,
    },
    customers: {
      value: usersCount,
      loading: usersLoading,
    },
    categories: {
      value: assortmentsCount || 0,
      loading: assortmentsLoading,
    },
  };

  const isLoading =
    ordersLoading || usersLoading || assortmentsLoading || productsLoading;

  return {
    metrics,
    isLoading,
  };
};

export default useDashboardMetrics;
