import { Order, OrderDelivery, OrderPosition } from '@unchainedshop/core-orders';
import { WarehousingDirector } from '../directors/index.js';
import { Modules } from '../modules.js';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.js';
import { Product } from '@unchainedshop/core-products';

export async function updateSchedulingService(
  this: Modules,
  {
    orderPositions,
    order,
    orderDelivery,
  }: { orderPositions: OrderPosition[]; order: Order; orderDelivery: OrderDelivery | null },
) {
  const deliveryProvider =
    orderDelivery &&
    (await this.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    }));

  if (!deliveryProvider) return [];

  return (await Promise.all(
    orderPositions.map(async (orderPosition) => {
      // scheduling (store in db for auditing)
      const product = (await this.products.findProduct({
        productId: orderPosition.productId,
      })) as Product;

      const scheduling = await Promise.all(
        (
          await supportedWarehousingProvidersService.bind(this)({
            product,
            deliveryProvider,
          })
        ).map(async (warehousingProvider) => {
          const director = await WarehousingDirector.actions(
            warehousingProvider,
            {
              deliveryProvider,
              product,
              orderPosition,
              order,
              referenceDate: order.ordered,
              quantity: orderPosition.quantity,
            },
            {
              modules: this,
            },
          );
          const dispatch = await director.estimatedDispatch();

          return {
            warehousingProviderId: warehousingProvider._id,
            ...dispatch,
          };
        }),
      );

      return this.orders.positions.updateScheduling(orderPosition._id, scheduling);
    }),
  )) as OrderPosition[];
}
