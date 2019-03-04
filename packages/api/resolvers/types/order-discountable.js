const OrderDiscountableTypes = {
  OrderItemDiscount: "OrderItemDiscount",
  OrderPaymentDiscount: "OrderPaymentDiscount",
  OrderDeliveryDiscount: "OrderDeliveryDiscount",
  OrderGlobalDiscount: "OrderGlobalDiscount"
};

export default {
  __resolveType(obj) {
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
  }
};
