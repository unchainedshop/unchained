import type { Order, OrderDiscount } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import {
  OrderPricingRowCategory,
  OrderPricingSheet,
  DeliveryPricingRowCategory,
  DeliveryPricingSheet,
  ProductPricingRowCategory,
  ProductPricingSheet,
  PaymentPricingRowCategory,
  PaymentPricingSheet,
} from '../directors/index.ts';

export async function calculateDiscountTotalService(
  this: Modules,
  order: Order,
  orderDiscount: OrderDiscount,
  { useNetPrice = false }: { useNetPrice?: boolean } = {},
) {
  const discountId = orderDiscount._id;

  const orderDelivery = await this.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId!,
  });
  const orderPayment = await this.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId!,
  });
  const orderPositions = await this.orders.positions.findOrderPositions({
    orderId: order._id,
  });

  // The discount is spread over the delivery, payment, position and order pricing sheets
  const discountedSheets = [
    {
      category: DeliveryPricingRowCategory.Discount,
      sheet: DeliveryPricingSheet({
        calculation: orderDelivery?.calculation || [],
        currencyCode: order.currencyCode,
      }),
    },
    {
      category: PaymentPricingRowCategory.Discount,
      sheet: PaymentPricingSheet({
        calculation: orderPayment?.calculation || [],
        currencyCode: order.currencyCode,
      }),
    },
    ...orderPositions.map((orderPosition) => ({
      category: ProductPricingRowCategory.Discount,
      sheet: ProductPricingSheet({
        calculation: orderPosition.calculation || [],
        currencyCode: order.currencyCode,
        quantity: orderPosition.quantity,
      }),
    })),
    {
      category: OrderPricingRowCategory.Discounts,
      sheet: OrderPricingSheet({
        calculation: order.calculation,
        currencyCode: order.currencyCode,
      }),
    },
  ];

  const amount = discountedSheets.reduce(
    (sum, { category, sheet }) => sum + (sheet.total({ category, discountId, useNetPrice }).amount || 0),
    0,
  );
  const taxAmount = discountedSheets.reduce(
    (sum, { category, sheet }) => sum + sheet.taxSum({ baseCategory: category, discountId }),
    0,
  );

  return {
    amount,
    currencyCode: order.currencyCode,
    isTaxable: taxAmount !== 0,
    isNetPrice: useNetPrice,
  };
}
