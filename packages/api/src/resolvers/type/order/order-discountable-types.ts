import { Order, OrderPosition } from '@unchainedshop/core-orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { OrderPrice } from '@unchainedshop/types/orders.pricing.js';

export const OrderDiscountableType = {
  OrderItemDiscount: 'OrderItemDiscount',
  OrderPaymentDiscount: 'OrderPaymentDiscount',
  OrderDeliveryDiscount: 'OrderDeliveryDiscount',
  OrderGlobalDiscount: 'OrderGlobalDiscount',
};

export const OrderDiscountable = {
  __resolveType(obj: {
    _id: string;
    delivery?: OrderDelivery;
    item?: OrderPosition;
    order?: Order;
    orderDiscount: OrderDiscount;
    payment?: OrderPayment;
    total: OrderPrice;
  }) {
    if (obj.delivery) {
      return OrderDiscountableType.OrderDeliveryDiscount;
    }
    if (obj.payment) {
      return OrderDiscountableType.OrderPaymentDiscount;
    }
    if (obj.item) {
      return OrderDiscountableType.OrderItemDiscount;
    }
    return OrderDiscountableType.OrderGlobalDiscount;
  },
};
