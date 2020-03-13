import chainedUpsert from './utils/chainedUpsert';

export const SimplePaymentProvider = {
  _id: 'simple-payment-provider',
  adapterKey: 'shop.unchained.invoice',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'INVOICE'
};

export const PrePaidPaymentProvider = {
  _id: 'prepaid-payment-provider',
  adapterKey: 'shop.unchained.invoice-prepaid',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'INVOICE'
};

export default async function seedPayments(db) {
  await chainedUpsert(db)
    .upsert('payment-providers', SimplePaymentProvider)
    .upsert('payment-providers', PrePaidPaymentProvider)
    .resolve();
}
