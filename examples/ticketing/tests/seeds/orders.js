import { SimpleDeliveryProvider } from './deliveries.js';
import { SimplePaymentProvider } from './payments.js';
import { TokenizedProduct } from './products.js';
import chainedUpsert from './utils/chainedUpsert.js';
import { VirtualWarehousingProvider } from './warehousings.js';

const Orders = [
  {
    _id: 'token-order-id-12345',
    created: '2025-12-29T18:15:21.889Z',
    status: 'CONFIRMED',
    billingAddress: {
      firstName: 'Mikael Araya',
      lastName: 'Test',
      company: 'sad',
      addressLine: 'Addis Ababa',
      postalCode: '5351',
      regionCode: 'Addis Ababa',
      city: 'Addis Ababa',
      countryCode: 'ET',
    },
    contact: {
      emailAddress: 'mikaeldd12@unchained.shop',
      telNumber: '+251912669988',
    },
    userId: '9558711abb067a866ba38a2e',
    currencyCode: 'CHF',
    countryCode: 'CH',
    calculation: [
      {
        category: 'ITEMS',
        amount: 240000,
        meta: {
          adapter: 'shop.unchained.pricing.order-items',
        },
      },
      {
        category: 'DELIVERY',
        amount: 0,
        meta: {
          adapter: 'shop.unchained.post',
        },
      },
      {
        category: 'PAYMENT',
        amount: 0,
        meta: {
          adapter: 'shop.unchained.pricing.order-payment',
        },
      },
    ],
    log: [
      {
        date: '2025-12-29T18:16:00.109Z',
        status: 'CONFIRMED',
        info: null,
      },
    ],
    orderNumber: 'DZENE86',
    context: {},
    deliveryId: '0db44978baac919b13623fee',
    updated: '2025-12-29T18:16:00.109Z',
    paymentId: 'd9c0d8497962d41ed89d718c',
    confirmed: '2025-12-29T18:16:00.109Z',
    ordered: '2025-12-29T18:16:00.109Z',
  },
];

const SimplePayment = {
  _id: 'd9c0d8497962d41ed89d718c',
  created: new Date('2025-12-29T18:15:21.897Z'),
  calculation: [
    {
      category: 'PAYMENT',
      amount: 0,
      isTaxable: false,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.payment-free',
      },
    },
  ],
  paymentProviderId: SimplePaymentProvider._id,
  log: [],
  orderId: Orders[0]._id,
  status: null,
  context: {},
  updated: new Date('2025-12-29T18:15:57.907Z'),
};
const SimpleOrderDelivery = {
  _id: '0db44978baac919b13623fee',
  created: new Date('2025-12-29T18:15:27.846Z'),
  calculation: [
    {
      amount: 0,
      category: 'DELIVERY',
      isNetPrice: false,
      isTaxable: false,
      meta: {
        adapter: 'shop.unchained.pricing.delivery-free',
      },
    },
  ],
  deliveryProviderId: SimpleDeliveryProvider._id,
  orderId: Orders[0]._id,
  status: 'DELIVERED',
  context: {
    address: {
      firstName: 'Mikael Araya',
      lastName: 'Test',
      company: 'sad',
      addressLine: 'Addis Ababa',
      addressLine2: '',
      postalCode: '5351',
      regionCode: 'Addis Ababa',
      city: 'Addis Ababa',
      countryCode: 'ET',
    },
    meta: null,
  },
  updated: new Date('2025-12-29T18:16:00.115Z'),
  delivered: new Date('2025-12-29T18:16:00.115Z'),
};

const SimplePosition = {
  _id: '3e25fb74b7cd2e1b7cfe01d7',
  configuration: null,
  productId: TokenizedProduct._id,
  originalProductId: TokenizedProduct._id,
  orderId: Orders[0]._id,
  calculation: [
    {
      category: 'ITEM',
      amount: 240000,
      isTaxable: false,
      isNetPrice: false,
      meta: {
        adapter: 'shop.unchained.pricing.product-price',
      },
    },
  ],
  created: new Date('2025-12-29T18:15:21.898Z'),
  quantity: 3,
  scheduling: [
    {
      warehousingProviderId: VirtualWarehousingProvider._id,
      shipping: new Date('2025-12-29T18:15:57.911Z'),
      earliestDelivery: new Date('2025-12-29T18:15:57.911Z'),
    },
  ],
  updated: new Date('2025-12-29T18:15:23.876Z'),
};

export default async function seedOrders(db) {
  return chainedUpsert(db)
    .upsert('orders', Orders)
    .upsert('order_payments', SimplePayment)
    .upsert('order_deliveries', SimpleOrderDelivery)
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
