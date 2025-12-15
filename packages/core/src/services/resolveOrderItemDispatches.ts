import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { OrderPosition } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import type { Modules } from '../modules.ts';

export interface OrderItemDispatch {
  _id: string;
  deliveryProvider: DeliveryProvider;
  warehousingProvider: WarehousingProvider;
  product: Product;
  quantity: number;
  countryCode: string;
  userId: string;
  shipping: Date;
  earliestDelivery: Date;
}

export async function resolveOrderItemDispatchesService(
  this: Modules,
  {
    orderPosition,
  }: {
    orderPosition: OrderPosition;
  },
): Promise<OrderItemDispatch[] | null> {
  const scheduling = orderPosition.scheduling || [];
  if (!scheduling.length) return [];

  const order = await this.orders.findOrder({ orderId: orderPosition.orderId });
  if (!order) return null;

  const { countryCode, userId, deliveryId } = order;

  if (!deliveryId) return null;

  const orderDelivery = await this.orders.deliveries.findDelivery({
    orderDeliveryId: deliveryId,
  });
  if (!orderDelivery) return null;

  const deliveryProvider = await this.delivery.findProvider({
    deliveryProviderId: orderDelivery.deliveryProviderId,
  });
  if (!deliveryProvider) return null;

  const product = await this.products.findProduct({ productId: orderPosition.productId });
  if (!product) return null;

  return Promise.all(
    scheduling.map(async (schedule) => {
      const warehousingProvider = await this.warehousing.findProvider({
        warehousingProviderId: schedule.warehousingProviderId,
      });

      return {
        warehousingProvider,
        deliveryProvider,
        product,
        quantity: orderPosition.quantity,
        countryCode,
        userId,
        ...schedule,
      };
    }),
  );
}
