import { UnchainedCore } from '../core-index.js';

export const deleteUserCartsService = async (
  userId: string,
  unchainedAPI: UnchainedCore & { countryContext?: string },
) => {
  try {
    const carts = await unchainedAPI.modules.orders.findOrders({ userId, status: null });

    for (const userCart of carts) {
      await unchainedAPI.modules.orders.positions.deleteOrderPositions(userCart?._id);
      await unchainedAPI.modules.orders.payments.deleteOrderPayments(userCart?._id);
      await unchainedAPI.modules.orders.deliveries.deleteOrderDeliveries(userCart?._id);
      await unchainedAPI.modules.orders.discounts.deleteOrderDiscounts(userCart?._id);
      await unchainedAPI.modules.orders.delete(userCart?._id);
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
