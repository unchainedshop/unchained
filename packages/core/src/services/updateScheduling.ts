import { OrderPosition } from '@unchainedshop/core-orders';
import { WarehousingDirector } from '../directors/index.js';
import { Modules } from '../modules.js';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.js';

export const updateSchedulingService = async (
  { orderPositions, order, orderDelivery },
  unchainedAPI: { modules: Modules },
): Promise<Array<OrderPosition>> => {
  const { modules } = unchainedAPI;

  const deliveryProvider =
    orderDelivery &&
    (await modules.delivery.findProvider({
      deliveryProviderId: orderDelivery.deliveryProviderId,
    }));

  return await Promise.all(
    orderPositions.map(async (orderPosition) => {
      // scheduling (store in db for auditing)
      const product = await modules.products.findProduct({
        productId: orderPosition.productId,
      });

      const { countryCode, userId } = order;

      const scheduling = await Promise.all(
        (
          await supportedWarehousingProvidersService(
            {
              product,
              deliveryProvider,
            },
            unchainedAPI,
          )
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

          const director = await WarehousingDirector.actions(warehousingProvider, context, unchainedAPI);
          const dispatch = await director.estimatedDispatch();

          return {
            warehousingProviderId: warehousingProvider._id,
            ...dispatch,
          };
        }),
      );

      return modules.orders.positions.updateScheduling(orderPosition._id, scheduling);
    }),
  );
};
