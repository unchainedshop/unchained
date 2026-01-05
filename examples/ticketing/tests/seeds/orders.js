import { SimpleDeliveryProvider } from './deliveries.js';
import { SimplePaymentProvider } from './payments.js';
import { TokenizedProduct } from './products.js';
import chainedUpsert from './utils/chainedUpsert.js';
import { VirtualWarehousingProvider } from './warehousings.js';

export const Orders = [
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

export const SimplePayment = {
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

export const SimpleOrderDelivery = {
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

export const SimplePosition = {
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

    .resolve();
}
