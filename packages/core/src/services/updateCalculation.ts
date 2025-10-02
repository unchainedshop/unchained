import {
  OrderDelivery,
  OrderDiscountTrigger,
  OrderPayment,
  Order,
  OrderPosition,
} from '@unchainedshop/core-orders';
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

export async function updateCalculationService(this: Modules, orderId: string) {
  let order = await this.orders.findOrder({ orderId });
  if (!order) throw new Error('Order not found');

  // Don't recalculate orders, only carts
  if (order.status !== null) return order;

  // 1. go through existing order-discounts and check if discount still valid,
  // those who are not valid anymore should get removed
  const discounts = await this.orders.discounts.findOrderDiscounts({
    orderId: order._id,
  });

  await Promise.all(
    discounts.map(async (orderDiscount) => {
      const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
      if (!Adapter) return null;
      const adapter = await Adapter.actions({
        context: { order: order!, orderDiscount, code: orderDiscount.code, modules: this },
      });

      let isValid = false;
      if (orderDiscount.trigger === OrderDiscountTrigger.SYSTEM) {
        isValid = await adapter.isValidForSystemTriggering();
      } else if (orderDiscount.trigger === OrderDiscountTrigger.USER && orderDiscount.code) {
        isValid = await adapter.isValidForCodeTriggering({
          code: orderDiscount.code,
        });
      }

      if (!isValid) {
        if (orderDiscount.trigger === OrderDiscountTrigger.USER) {
          await adapter.release();
        }
        await this.orders.discounts.delete(orderDiscount._id);
      }
    }),
  );

  // 2. run auto-system discount
  const cleanedDiscounts = await this.orders.discounts.findOrderDiscounts({
    orderId: order._id,
  });

  const currentDiscountKeys = cleanedDiscounts.map(({ discountKey }) => discountKey);
  const director = await OrderDiscountDirector.actions({ order }, { modules: this });
  const systemDiscounts = await director.findSystemDiscounts();
  await Promise.all(
    systemDiscounts
      .filter((key) => currentDiscountKeys.indexOf(key) === -1)
      .map(async (discountKey) =>
        this.orders.discounts.create({
          orderId: order!._id,
          discountKey,
          trigger: OrderDiscountTrigger.SYSTEM,
        }),
      ),
  );

  let orderPositions = await this.orders.positions.findOrderPositions({
    orderId,
  });
  orderPositions = await Promise.all(
    orderPositions.map(async (orderPosition) => {
      const positionCalculation = await ProductPricingDirector.rebuildCalculation(
        {
          currencyCode: order!.currencyCode,
          quantity: orderPosition.quantity,
          item: orderPosition,
        },
        { modules: this },
      );
      return (await this.orders.positions.updateCalculation(
        orderPosition._id,
        positionCalculation,
      )) as OrderPosition;
    }),
  );

  let orderDelivery = await this.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId!,
  });
  if (orderDelivery) {
    const deliveryCalculation = await DeliveryPricingDirector.rebuildCalculation(
      {
        currencyCode: order.currencyCode,
        item: orderDelivery,
      },
      { modules: this },
    );
    orderDelivery = (await this.orders.deliveries.updateCalculation(
      orderDelivery._id,
      deliveryCalculation,
    )) as OrderDelivery;
  }
  let orderPayment = await this.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId!,
  });
  if (orderPayment) {
    const paymentCalculation = await PaymentPricingDirector.rebuildCalculation(
      {
        currencyCode: order.currencyCode,
        item: orderPayment,
      },
      { modules: this },
    );
    orderPayment = (await this.orders.payments.updateCalculation(
      orderPayment._id,
      paymentCalculation,
    )) as OrderPayment;
  }

  orderPositions = await updateSchedulingService.bind(this)({
    order,
    orderPositions,
    orderDelivery,
  });

  const calculation = await OrderPricingDirector.rebuildCalculation(
    { currencyCode: order.currencyCode, order, orderPositions, orderDelivery, orderPayment },
    { modules: this },
  );

  if (JSON.stringify(order.calculation) !== JSON.stringify(calculation)) {
    order = (await this.orders.updateCalculationSheet(orderId, calculation)) as Order;
  }

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
  return initCartProvidersService.bind(this)(order);
}
