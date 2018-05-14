const OrderDiscountableTypes = {
  OrderItemDiscount: 'OrderItemDiscount',
  OrderPaymentDiscount: 'OrderPaymentDiscount',
  OrderDeliveryDiscount: 'OrderDeliveryDiscount',
  OrderGlobalDiscount: 'OrderGlobalDiscount',
};

export default {
  __resolveType(obj) {
    if (obj.delivery) {
      return OrderDiscountableTypes.OrderDeliveryDiscount;
    } else if (obj.payment) {
      return OrderDiscountableTypes.OrderPaymentDiscount;
    } else if (obj.item) {
      return OrderDiscountableTypes.OrderItemDiscount;
    }
    return OrderDiscountableTypes.OrderGlobalDiscount;
  },
};
