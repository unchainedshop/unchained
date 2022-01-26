import { Order } from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { OrderPrice } from '@unchainedshop/types/orders.pricing';

enum OrderDiscountableTypes {
  OrderItemDiscount = 'OrderItemDiscount',
  OrderPaymentDiscount = 'OrderPaymentDiscount',
  OrderDeliveryDiscount = 'OrderDeliveryDiscount',
  OrderGlobalDiscount = 'OrderGlobalDiscount',
}

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
      return OrderDiscountableTypes.OrderDeliveryDiscount;
    }
    if (obj.payment) {
      return OrderDiscountableTypes.OrderPaymentDiscount;
    }
    if (obj.item) {
      return OrderDiscountableTypes.OrderItemDiscount;
    }
    return OrderDiscountableTypes.OrderGlobalDiscount;
  },
};
