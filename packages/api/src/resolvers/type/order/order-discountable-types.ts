import type {
  Order,
  OrderPosition,
  OrderDelivery,
  OrderDiscount,
  OrderPayment,
} from '@unchainedshop/core-orders';
import type { Price } from '@unchainedshop/utils';

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
    total: Price;
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
