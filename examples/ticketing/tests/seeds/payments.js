import chainedUpsert from './utils/chainedUpsert.js';

export const SimplePaymentProvider = {
  _id: 'simple-payment-provider',
  adapterKey: 'shop.unchained.invoice',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'INVOICE',
};

export const SimplePaymentCredential = {
  paymentProviderId: SimplePaymentProvider._id,
  _id: 'simple-payment-credential',
  userId: 'admin',
  isPreferred: true,
  created: new Date(),
};

export default async function seedPayments(db) {
  await chainedUpsert(db)
    .upsert('payment-providers', SimplePaymentProvider)
    .upsert('payment_credentials', SimplePaymentCredential)
    .resolve();
}
