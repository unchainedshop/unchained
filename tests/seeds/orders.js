export const DiscountedOrder = {
  _id: 'discounted-order',
  created: new Date('2019-10-11T11:52:25.433+0000'),
  status: null,
  userId: 'user',
  currency: 'CHF',
  countryCode: 'CH',
  calculation: [
    {
      category: 'ITEMS',
      amount: 100000
    },
    {
      category: 'TAXES',
      amount: 7149.489322191272
    },
    {
      category: 'PAYMENT',
      amount: 0
    },
    {
      category: 'DELIVERY',
      amount: 0
    },
    {
      category: 'DISCOUNTS',
      amount: -10000,
      discountId: 'discounted-order-discount'
    },
    {
      category: 'TAXES',
      amount: -714.9489322191266
    }
  ],
  updated: new Date('2019-10-11T12:48:01.611+0000'),
  paymentId: 'discounted-order-payment',
  deliveryId: 'discounted-order-delivery'
};

export const DiscountedOrderPayment = {
  _id: 'discounted-order-payment',
  created: new Date('2019-10-11T11:52:25.446+0000'),
  status: null,
  orderId: 'discounted-order',
  paymentProviderId: 'simple-payment-provider',
  context: {},
  updated: new Date('2019-10-11T12:48:01.537+0000'),
  calculation: []
};

export const DiscountedOrderDelivery = {
  _id: 'discounted-order-delivery',
  created: new Date('2019-10-11T11:52:25.563+0000'),
  status: null,
  orderId: 'discounted-order',
  deliveryProviderId: 'simple-delivery-provider',
  context: {},
  calculation: [],
  updated: new Date('2019-10-11T12:48:01.523+0000')
};

export const DiscountedOrderDiscount = {
  _id: 'discounted-order-discount',
  code: '100OFF',
  trigger: 'USER',
  orderId: 'discounted-order',
  discountKey: 'shop.unchained.discount.100-off',
  created: new Date('2019-10-11T12:07:27.123+0000')
};

export const DiscountedOrderProductDiscount = {
  _id: 'discounted-order-product-discount',
  code: 'HALFPRICE',
  trigger: 'USER',
  orderId: 'discounted-order',
  discountKey: 'shop.unchained.discount.half-price-manual',
  created: new Date('2019-10-11T12:48:01.435+0000')
};

export const OrderPosition = {
  _id: 'discounted-order-position',
  orderId: 'discounted-order',
  productId: 'simple-product',
  originalProductId: 'simple-product',
  quantity: 3,
  created: new Date('2019-10-11T12:15:42.456+0000'),
  calculation: [
    {
      category: 'ITEM',
      amount: 120000,
      isTaxable: true,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-price'
      }
    },
    {
      category: 'DISCOUNT',
      amount: -60000,
      isTaxable: true,
      discountId: 'discounted-order-product-discount',
      meta: {
        adapter: 'shop.unchained.pricing.product-discount'
      }
    },
    {
      category: 'ITEM',
      amount: -8579.387186629523,
      isTaxable: false,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax'
      }
    },
    {
      category: 'TAX',
      amount: 8579.387186629523,
      rate: 0.077,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax'
      }
    },
    {
      category: 'DISCOUNT',
      amount: 4289.6935933147615,
      isTaxable: false,
      discountId: 'discounted-order-product-discount',
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax'
      }
    },
    {
      category: 'TAX',
      amount: -4289.6935933147615,
      rate: 0.077,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax'
      }
    }
  ],
  scheduling: [],
  updated: new Date('2019-10-11T12:17:49.529+0000')
};

export default async function seedOrders(db) {
  await db.collection('orders').findOrInsertOne(DiscountedOrder);
  await db.collection('order_payments').findOrInsertOne(DiscountedOrderPayment);
  await db
    .collection('order_deliveries')
    .findOrInsertOne(DiscountedOrderDelivery);
  await db
    .collection('order_discounts')
    .findOrInsertOne(DiscountedOrderDiscount);
  await db
    .collection('order_discounts')
    .findOrInsertOne(DiscountedOrderProductDiscount);

  await db.collection('order_positions').findOrInsertOne(OrderPosition);
}
