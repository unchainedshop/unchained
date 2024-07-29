import { Order, OrderPosition } from '@unchainedshop/core-orders';
import { OrderDelivery } from '@unchainedshop/core-orders';
import { OrderDiscount } from '@unchainedshop/core-orders';
import { OrderPayment } from '@unchainedshop/core-orders';
import { OrderPrice } from '@unchainedshop/core-orders';

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
