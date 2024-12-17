import { Order, OrderDelivery, OrderPosition } from '@unchainedshop/core-orders';
import { WarehousingDirector } from '../directors/index.js';
import { Modules } from '../modules.js';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.js';

export async function updateSchedulingService(
  this: Modules,
  {
    orderPositions,
    order,
    orderDelivery,
  }: { orderPositions: OrderPosition[]; order: Order; orderDelivery: OrderDelivery },
) {
  const deliveryProvider =
    orderDelivery &&
    (await this.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    }));

  return (await Promise.all(
    orderPositions.map(async (orderPosition) => {
      // scheduling (store in db for auditing)
      const product = await this.products.findProduct({
        productId: orderPosition.productId,
      });

      const { countryCode, userId } = order;

      const scheduling = await Promise.all(
        (
          await supportedWarehousingProvidersService.bind(this)({
            product,
            deliveryProvider,
          })
        ).map(async (warehousingProvider) => {
          const context = {
            warehousingProvider,
            deliveryProvider,
            product,
            item: orderPosition,
            delivery: deliveryProvider,
            order,
            userId,
            country: countryCode,
            referenceDate: order.ordered,
            quantity: orderPosition.quantity,
          };

          const director = await WarehousingDirector.actions(warehousingProvider, context, {
            modules: this,
          });
          const dispatch = await director.estimatedDispatch();

          return {
            warehousingProviderId: warehousingProvider._id,
            ...dispatch,
          };
        }),
      );

      return this.orders.positions.updateScheduling(orderPosition._id, scheduling);
    }),
  )) as Array<OrderPosition>;
}
