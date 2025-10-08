import { SimpleDeliveryProvider } from './deliveries.js';
import { GenericPaymentProvider, SimplePaymentProvider } from './payments.js';
import chainedUpsert from './utils/chainedUpsert.js';

export const SimpleOrder = {
  _id: 'simple-order',
  created: new Date('2019-10-11T11:52:25.433+0000'),
  status: null,
  userId: 'user',
  currencyCode: 'CHF',
  countryCode: 'CH',
  contact: {
    emailAddress: 'info@unchained.local',
  },
  billingAddress: {
    addressLine: 'Bahnhofplatz 2',
    city: 'Zurich',
    postalCode: '8001',
  },
  calculation: [
    {
      category: 'ITEMS',
      amount: 30000,
    },
    { category: 'TAXES', amount: 2144.8467966573808 },
    {
      category: 'PAYMENT',
      amount: 0,
    },
    {
      category: 'DELIVERY',
      amount: 0,
    },
    {
      category: 'DISCOUNTS',
      amount: 0,
    },
  ],
  updated: new Date('2019-10-11T12:48:01.611+0000'),
  paymentId: 'simple-order-payment',
  deliveryId: 'simple-order-delivery',
};

export const SimplePayment = {
  _id: 'simple-order-payment',
  created: new Date('2019-10-11T11:52:25.446+0000'),
  status: null,
  orderId: 'simple-order',
  paymentProviderId: SimplePaymentProvider._id,
  context: {},
  updated: new Date('2019-10-11T12:48:01.537+0000'),
  calculation: [],
};

export const GenericPayment = {
  _id: 'generic-order-payment',
  created: new Date('2019-10-11T11:52:25.446+0000'),
  status: null,
  orderId: 'simple-order',
  paymentProviderId: GenericPaymentProvider._id,
  context: {},
  updated: new Date('2019-10-11T12:48:01.537+0000'),
  calculation: [],
};

export const SimpleDelivery = {
  _id: 'simple-order-delivery',
  created: new Date('2019-10-11T11:52:25.563+0000'),
  status: null,
  orderId: 'simple-order',
  deliveryProviderId: SimpleDeliveryProvider._id,
  context: {},
  calculation: [],
  updated: new Date('2019-10-11T12:48:01.523+0000'),
};

export const PickupDelivery = {
  _id: 'pickup-order-delivery',
  created: new Date('2019-10-11T11:52:25.563+0000'),
  status: null,
  orderId: 'simple-order',
  deliveryProviderId: 'pickup-delivery-provider',
  context: {},
  calculation: [],
  updated: new Date('2019-10-11T12:48:01.523+0000'),
};

export const SimplePosition = {
  _id: 'simple-order-position',
  orderId: 'simple-order',
  productId: 'simpleproduct',
  originalProductId: 'simpleproduct',
  quantity: 3,
  created: new Date('2019-10-11T12:15:42.456+0000'),
  calculation: [
    {
      category: 'ITEM',
      amount: 30000, // CHF 300
      isTaxable: true,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-price',
      },
    },
    {
      category: 'ITEM',
      amount: -2144.8467966573808,
      isTaxable: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
      isNetPrice: false,
    },
    {
      category: 'TAX',
      amount: 2144.8467966573808,
      isTaxable: false,
      isNetPrice: false,
      rate: 0.077,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
    },
  ],
  scheduling: [],
  updated: new Date('2019-10-11T12:17:49.529+0000'),
};

export const ConfirmedOrder = {
  ...SimpleOrder,
  _id: 'confirmed-order',
  paymentId: 'confirmed-order-payment',
  deliveryId: 'confirmed-order-delivery',
  status: 'CONFIRMED',
  orderNumber: 'O0011',
  contact: {
    emailAddress: 'info@unchained.local',
    telNumber: '+41999999999',
  },
  billingAddress: {
    firstName: 'Hallo',
    lastName: 'Velo',
    addressLine: 'Strasse 1',
    addressLine2: 'Postfach',
    postalCode: '8000',
    city: 'Zürich',
  },
  context: {
    hi: 'there',
  },
  ordered: new Date('2020-03-13T12:28:10.371+0000'),
  confirmed: new Date('2020-03-13T12:28:10.371+0000'),
  log: [
    {
      date: new Date('2020-03-13T12:28:10.371+0000'),
      status: 'CONFIRMED',
      info: 'before delivery',
    },
  ],
};

export const ConfirmedOrderPayment = {
  ...SimplePayment,
  _id: 'confirmed-order-payment',
  orderId: 'confirmed-order',
};

export const ConfirmedOrderDelivery = {
  ...SimpleDelivery,
  _id: 'confirmed-order-delivery',
  orderId: 'confirmed-order',
};

export const ConfirmedOrderPosition = {
  ...SimplePosition,
  _id: 'confirmed-order-position',
  orderId: 'confirmed-order',
};

export const PendingOrder = {
  ...ConfirmedOrder,
  orderNumber: null,
  _id: 'pending-order',
  paymentId: 'pending-order-payment',
  deliveryId: 'pending-order-delivery',
  status: 'PENDING',
  confirmed: null,
};

export const PendingOrderPayment = {
  ...SimplePayment,
  _id: 'pending-order-payment',
  orderId: 'pending-order',
  paymentProviderId: 'prepaid-payment-provider',
};

export const PendingOrderDelivery = {
  ...SimpleDelivery,
  _id: 'pending-order-delivery',
  orderId: 'pending-order',
};

export const PendingOrderPosition = {
  ...SimplePosition,
  _id: 'pending-order-position',
  orderId: 'pending-order',
};

export const DiscountedOrder = {
  ...SimpleOrder,
  _id: 'discounted-order',
  paymentId: 'discounted-order-payment',
  deliveryId: 'discounted-order-delivery',
  calculation: [
    {
      category: 'ITEMS',
      amount: 100000,
    },
    {
      category: 'TAXES',
      amount: 7149.489322191272,
    },
    {
      category: 'PAYMENT',
      amount: 0,
    },
    {
      category: 'DELIVERY',
      amount: 0,
    },
    {
      category: 'DISCOUNTS',
      amount: -10000,
      discountId: 'discounted-order-discount',
    },
    {
      category: 'TAXES',
      amount: -714.9489322191266,
    },
  ],
};

export const DiscountedPayment = {
  ...SimplePayment,
  _id: 'discounted-order-payment',
  orderId: 'discounted-order',
};

export const DiscountedDelivery = {
  ...SimpleDelivery,
  _id: 'discounted-order-delivery',
  orderId: 'discounted-order',
};

export const DiscountedDiscount = {
  _id: 'discounted-order-discount',
  code: '100OFF',
  trigger: 'USER',
  orderId: 'discounted-order',
  discountKey: 'shop.unchained.discount.100-off',
  created: new Date('2019-10-11T12:07:27.123+0000'),
};

export const DiscountedProductDiscount = {
  _id: 'discounted-order-product-discount',
  code: 'HALFPRICE',
  trigger: 'USER',
  orderId: 'discounted-order',
  discountKey: 'shop.unchained.discount.half-price-manual',
  created: new Date('2019-10-11T12:48:01.435+0000'),
};

export const DiscountedPosition = {
  ...SimplePosition,
  _id: 'discounted-order-position',
  orderId: 'discounted-order',
  calculation: [
    {
      category: 'ITEM',
      amount: 120000,
      isTaxable: true,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-price',
      },
    },
    {
      category: 'DISCOUNT',
      amount: -60000,
      isTaxable: true,
      discountId: 'discounted-order-product-discount',
      meta: {
        adapter: 'shop.unchained.pricing.product-discount',
      },
    },
    {
      category: 'ITEM',
      amount: -8579.387186629523,
      isTaxable: false,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
    },
    {
      category: 'TAX',
      amount: 8579.387186629523,
      rate: 0.077,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
    },
    {
      category: 'DISCOUNT',
      amount: 4289.6935933147615,
      isTaxable: false,
      discountId: 'discounted-order-product-discount',
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
    },
    {
      category: 'TAX',
      amount: -4289.6935933147615,
      rate: 0.077,
      meta: {
        adapter: 'shop.unchained.pricing.product-swiss-tax',
      },
    },
  ],
};

// Cart test orders - one for each delivery/payment type combination
export const ShippingOrder = {
  ...SimpleOrder,
  _id: 'shipping-order',
  userId: 'user',
  paymentId: 'shipping-order-payment',
  deliveryId: 'shipping-order-delivery',
};

export const ShippingOrderPayment = {
  ...SimplePayment,
  _id: 'shipping-order-payment',
  orderId: 'shipping-order',
  paymentProviderId: SimplePaymentProvider._id,
};

export const ShippingOrderDelivery = {
  ...SimpleDelivery,
  _id: 'shipping-order-delivery',
  orderId: 'shipping-order',
  deliveryProviderId: SimpleDeliveryProvider._id,
};

export const ShippingOrderPosition = {
  ...SimplePosition,
  _id: 'shipping-order-position',
  orderId: 'shipping-order',
};

export const PickupOrder = {
  ...SimpleOrder,
  _id: 'pickup-order',
  userId: 'user',
  paymentId: 'pickup-order-payment',
  deliveryId: 'pickup-order-delivery',
};

export const PickupOrderPayment = {
  ...SimplePayment,
  _id: 'pickup-order-payment',
  orderId: 'pickup-order',
  paymentProviderId: SimplePaymentProvider._id,
};

export const PickupOrderDelivery = {
  ...PickupDelivery,
  _id: 'pickup-order-delivery',
  orderId: 'pickup-order',
  deliveryProviderId: 'pickup-delivery-provider',
};

export const PickupOrderPosition = {
  ...SimplePosition,
  _id: 'pickup-order-position',
  orderId: 'pickup-order',
};

export const InvoicePaymentOrder = {
  ...SimpleOrder,
  _id: 'invoice-payment-order',
  userId: 'user',
  paymentId: 'invoice-payment-order-payment',
  deliveryId: 'invoice-payment-order-delivery',
};

export const InvoicePaymentOrderPayment = {
  ...SimplePayment,
  _id: 'invoice-payment-order-payment',
  orderId: 'invoice-payment-order',
  paymentProviderId: 'invoice-payment-provider',
};

export const InvoicePaymentOrderDelivery = {
  ...SimpleDelivery,
  _id: 'invoice-payment-order-delivery',
  orderId: 'invoice-payment-order',
};

export const InvoicePaymentOrderPosition = {
  ...SimplePosition,
  _id: 'invoice-payment-order-position',
  orderId: 'invoice-payment-order',
};

export const GenericPaymentOrder = {
  ...SimpleOrder,
  _id: 'generic-payment-order',
  userId: 'user',
  paymentId: 'generic-payment-order-payment',
  deliveryId: 'generic-payment-order-delivery',
};

export const GenericPaymentOrderPayment = {
  ...SimplePayment,
  _id: 'generic-payment-order-payment',
  orderId: 'generic-payment-order',
  paymentProviderId: GenericPaymentProvider._id,
};

export const GenericPaymentOrderDelivery = {
  ...SimpleDelivery,
  _id: 'generic-payment-order-delivery',
  orderId: 'generic-payment-order',
};

export const GenericPaymentOrderPosition = {
  ...SimplePosition,
  _id: 'generic-payment-order-position',
  orderId: 'generic-payment-order',
};

export default async function seedOrders(db) {
  return chainedUpsert(db)
    .upsert('orders', SimpleOrder)
    .upsert('order_payments', SimplePayment)
    .upsert('order_payments', GenericPayment)
    .upsert('order_deliveries', SimpleDelivery)
    .upsert('order_deliveries', PickupDelivery)
    .upsert('order_positions', SimplePosition)

    .upsert('orders', ConfirmedOrder)
    .upsert('order_payments', ConfirmedOrderPayment)
    .upsert('order_deliveries', ConfirmedOrderDelivery)
    .upsert('order_positions', ConfirmedOrderPosition)

    .upsert('orders', PendingOrder)
    .upsert('order_payments', PendingOrderPayment)
    .upsert('order_deliveries', PendingOrderDelivery)
    .upsert('order_positions', PendingOrderPosition)

    .upsert('orders', DiscountedOrder)
    .upsert('order_payments', DiscountedPayment)
    .upsert('order_deliveries', DiscountedDelivery)
    .upsert('order_discounts', DiscountedDiscount)
    .upsert('order_discounts', DiscountedProductDiscount)
    .upsert('order_positions', DiscountedPosition)

    .upsert('orders', ShippingOrder)
    .upsert('order_payments', ShippingOrderPayment)
    .upsert('order_deliveries', ShippingOrderDelivery)
    .upsert('order_positions', ShippingOrderPosition)

    .upsert('orders', PickupOrder)
    .upsert('order_payments', PickupOrderPayment)
    .upsert('order_deliveries', PickupOrderDelivery)
    .upsert('order_positions', PickupOrderPosition)

    .upsert('orders', InvoicePaymentOrder)
    .upsert('order_payments', InvoicePaymentOrderPayment)
    .upsert('order_deliveries', InvoicePaymentOrderDelivery)
    .upsert('order_positions', InvoicePaymentOrderPosition)

    .upsert('orders', GenericPaymentOrder)
    .upsert('order_payments', GenericPaymentOrderPayment)
    .upsert('order_deliveries', GenericPaymentOrderDelivery)
    .upsert('order_positions', GenericPaymentOrderPosition)

    .resolve();
}
