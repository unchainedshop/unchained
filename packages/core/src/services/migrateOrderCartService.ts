import { Order, OrdersModule } from '@unchainedshop/core-orders';
import { updateCalculationService } from './updateCalculationService.js';
import { ProductsModule } from '@unchainedshop/core-products';
import { BookmarksModule } from '@unchainedshop/core-bookmarks';
import { AssortmentsModule } from '@unchainedshop/core-assortments';
import { DeliveryModule } from '@unchainedshop/core-delivery';
import { PaymentModule } from '@unchainedshop/core-payment';

export type MigrateOrderCartsService = (
  params: {
    fromUserId: string;
    toUserId: string;
    shouldMerge: boolean;
    countryContext: string;
  },
  unchainedAPI: {
    modules: {
      products: ProductsModule;
      bookmarks: BookmarksModule;
      assortments: AssortmentsModule;
      orders: OrdersModule;
      delivery: DeliveryModule;
      payment: PaymentModule;
    };
  },
) => Promise<Order>;

export const migrateOrderCartsService: MigrateOrderCartsService = async (
  { fromUserId, toUserId, shouldMerge, countryContext },
  unchainedAPI,
) => {
  const fromCart = await unchainedAPI.modules.orders.cart({
    countryContext,
    userId: fromUserId,
  });
  const toCart = await unchainedAPI.modules.orders.cart({
    countryContext,
    userId: toUserId,
  });

  if (!fromCart) {
    // No cart, don't copy
    return toCart;
  }

  if (!toCart || !shouldMerge) {
    // No destination cart, move whole cart
    unchainedAPI.modules.orders.setCartOwner({ orderId: fromCart._id, userId: toUserId });
    return updateCalculationService(fromCart._id, unchainedAPI as any);
  }

  // Move positions
  unchainedAPI.modules.orders.moveCartPositions({ fromOrderId: fromCart._id, toOrderId: toCart._id });

  // Move billing address if target order has none
  if (fromCart.billingAddress && !toCart.billingAddress) {
    await unchainedAPI.modules.orders.updateBillingAddress(toCart._id, fromCart.billingAddress);
  }

  // Move contact data if target order has none
  if (fromCart.contact && !toCart.contact) {
    await unchainedAPI.modules.orders.updateContact(toCart._id, fromCart.contact);
  }

  return updateCalculationService(toCart._id, unchainedAPI as any);
};
