import chainedUpsert from './utils/chainedUpsert.js';

export const SimplePaymentProvider = {
  _id: 'simple-payment-provider',
  adapterKey: 'shop.unchained.invoice',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'INVOICE',
};

export const PrePaidPaymentProvider = {
  _id: 'prepaid-payment-provider',
  adapterKey: 'shop.unchained.invoice-prepaid',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'INVOICE',
};

export const GenericPaymentProvider = {
  _id: 'generic-payment-provider',
  adapterKey: 'shop.unchained.datatrans',
  created: new Date('2019-10-04T13:52:57.938+0000'),
  configuration: [],
  type: 'GENERIC',
};

export const SimplePaymentCredential = {
  paymentProviderId: SimplePaymentProvider._id,
  _id: 'simple-payment-credential',
  userId: 'admin',
  isPreferred: true,
  created: new Date(),
};

export const PrePaidPaymentCredential = {
  ...SimplePaymentCredential,
  _id: 'prepaid-payment-credential',
  paymentProviderId: PrePaidPaymentProvider._id,
  isPreferred: false,
};

export const GenericPaymentCredential = {
  ...SimplePaymentCredential,
  _id: 'generic-payment-credential',
  paymentProviderId: GenericPaymentProvider._id,
  isPreferred: false,
  userId: 'user',
};
export default async function seedPayments(db) {
  await chainedUpsert(db)
    .upsert('payment-providers', SimplePaymentProvider)
    .upsert('payment-providers', PrePaidPaymentProvider)
    .upsert('payment-providers', GenericPaymentProvider)
    .upsert('payment_credentials', SimplePaymentCredential)
    .upsert('payment_credentials', PrePaidPaymentCredential)
    .upsert('payment_credentials', GenericPaymentCredential)
    .resolve();
}
