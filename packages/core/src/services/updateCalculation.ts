import { OrderDiscountTrigger } from '@unchainedshop/core-orders';
import { initCartProvidersService } from './initCartProviders.js';
import { Modules } from '../modules.js';
import { updateSchedulingService } from './updateScheduling.js';
import {
  OrderDiscountDirector,
  OrderPricingDirector,
  DeliveryPricingDirector,
  ProductPricingDirector,
  PaymentPricingDirector,
} from '../directors/index.js';

export const updateCalculationService = async (orderId: string, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;

  const order = await modules.orders.findOrder({ orderId });

  // Don't recalculate orders, only carts
  if (order.status !== null) return order;

  // 1. go through existing order-discounts and check if discount still valid,
  // those who are not valid anymore should get removed
  const discounts = await modules.orders.discounts.findOrderDiscounts({
    orderId: order._id,
  });

  await Promise.all(
    discounts.map(async (orderDiscount) => {
      const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
      if (!Adapter) return null;
      const adapter = await Adapter.actions({
        context: { order, orderDiscount, code: orderDiscount.code, ...unchainedAPI },
      });

      const isValid =
        orderDiscount.trigger === OrderDiscountTrigger.SYSTEM
          ? await adapter.isValidForSystemTriggering()
          : await adapter.isValidForCodeTriggering({
              code: orderDiscount.code,
            });

      if (!isValid) {
        if (orderDiscount.trigger === OrderDiscountTrigger.USER) {
          // Release
          await adapter.release();
        }
        await modules.orders.discounts.delete(orderDiscount._id);
      }
    }),
  );

  // 2. run auto-system discount
  const cleanedDiscounts = await modules.orders.discounts.findOrderDiscounts({
    orderId: order._id,
  });

  const currentDiscountKeys = cleanedDiscounts.map(({ discountKey }) => discountKey);
  const director = await OrderDiscountDirector.actions({ order, code: null }, unchainedAPI);
  const systemDiscounts = await director.findSystemDiscounts();
  await Promise.all(
    systemDiscounts
      .filter((key) => currentDiscountKeys.indexOf(key) === -1)
      .map(async (discountKey) =>
        modules.orders.discounts.create({
          orderId: order._id,
          discountKey,
          trigger: OrderDiscountTrigger.SYSTEM,
        }),
      ),
  );

  let orderPositions = await modules.orders.positions.findOrderPositions({
    orderId,
  });
  orderPositions = await Promise.all(
    orderPositions.map(async (orderPosition) => {
      const positionCalculation = await ProductPricingDirector.rebuildCalculation(
        {
          currency: order.currency,
          quantity: orderPosition.quantity,
          item: orderPosition,
          configuration: orderPosition.configuration,
        },
        unchainedAPI,
      );
      return modules.orders.positions.updateCalculation(orderPosition._id, positionCalculation);
    }),
  );

  let orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });
  if (orderDelivery) {
    const deliveryCalculation = await DeliveryPricingDirector.rebuildCalculation(
      {
        currency: order.currency,
        item: orderDelivery,
      },
      unchainedAPI,
    );
    orderDelivery = await modules.orders.deliveries.updateCalculation(
      orderDelivery._id,
      deliveryCalculation,
    );
  }
  let orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  if (orderPayment) {
    const paymentCalculation = await PaymentPricingDirector.rebuildCalculation(
      {
        currency: order.currency,
        item: orderPayment,
      },
      unchainedAPI,
    );
    orderPayment = await modules.orders.payments.updateCalculation(orderPayment._id, paymentCalculation);
  }

  orderPositions = await updateSchedulingService(
    {
      order,
      orderPositions,
      orderDelivery,
    },
    unchainedAPI,
  );

  const calculation = await OrderPricingDirector.rebuildCalculation(
    { currency: order.currency, order, orderPositions, orderDelivery, orderPayment },
    unchainedAPI,
  );

  const updatedOrder = await modules.orders.updateCalculationSheet(orderId, calculation);

  /*
       // We have to do initCartProviders after calculation, only then filterSupportedProviders will work correctly and has access to recent pricing
       // initCartProviders calls updateCalculation anyways recursively when a new payment or delivery provider gets set
       // Thus, if for example a discount change leads to a free delivery and free payment due to free items amount, the following happens in the stack:
        // 1. create discount
        // 2. update calculation -> order pricing updated to items 0
        // 3. initCartProviders with updated order -> filterSupportedProviders -> delivery provider is invalid -> set new delivery provider
        // 4. update calculation -> order pricing updated to items 0 and delivery 0
        // 5. initCartProviders with updated order -> filterSupportedProviders -> payment provider is invalid -> set new payment provider
        // 6. update calculation -> order pricing updated to items 0, delivery 0, payment 0
        // 7. initCartProviders with updated order -> all providers are valid -> return order
    */
  return initCartProvidersService(updatedOrder, unchainedAPI);
};
