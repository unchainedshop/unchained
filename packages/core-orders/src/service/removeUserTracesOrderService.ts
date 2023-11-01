/* eslint-disable no-case-declarations */
import { RemoveUserTracesOrderService } from '@unchainedshop/types/orders.js';

export const removeUserTracesOrderService: RemoveUserTracesOrderService = async (
  { userId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;

  const usersOrderIds = await modules.orders.findOrders(
    { userId },
    {
      projection: {
        _id: 1,
      },
    },
  );
  const orderIds = usersOrderIds.map(({ _id }) => _id);

  await modules.orders.discounts.deleteUserOrderDiscountsByOrderIds(orderIds);
  await modules.orders.payments.deleteUserOrderPaymentsByOrderIds(orderIds);
  await modules.orders.deliveries.deleteUserOrderDeliveriesByOrderIds(orderIds);
  await modules.orders.positions.deleteUserOrderPositionsByOrderIds(orderIds);
  await modules.orders.deleteUserOrders(userId);
  return true;
};
