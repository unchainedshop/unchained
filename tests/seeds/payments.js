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
  adapterKey: 'shop.unchained.payment.cryptopay',
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

// All payment providers for seeding
const allPaymentProviders = [SimplePaymentProvider, PrePaidPaymentProvider, GenericPaymentProvider];

// All payment credentials for seeding
const allPaymentCredentials = [
  SimplePaymentCredential,
  PrePaidPaymentCredential,
  GenericPaymentCredential,
];

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

/**
 * Seed payment providers and credentials into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 */
export async function seedPaymentsToDrizzle(db) {
  const { paymentProviders, paymentCredentials } = await import('@unchainedshop/core-payment');

  // Delete all existing payment providers and credentials directly
  await db.delete(paymentCredentials);
  await db.delete(paymentProviders);

  // Insert all payment providers directly (bypassing module to avoid emitting events)
  for (const provider of allPaymentProviders) {
    await db.insert(paymentProviders).values({
      _id: provider._id,
      type: provider.type,
      adapterKey: provider.adapterKey,
      configuration: provider.configuration ? JSON.stringify(provider.configuration) : null,
      created: provider.created,
      updated: null,
      deleted: null,
    });
  }

  // Insert all payment credentials directly
  for (const credential of allPaymentCredentials) {
    await db.insert(paymentCredentials).values({
      _id: credential._id,
      paymentProviderId: credential.paymentProviderId,
      userId: credential.userId,
      token: credential.token || null,
      isPreferred: credential.isPreferred ?? false,
      meta: credential.meta ? JSON.stringify(credential.meta) : null,
      created: credential.created,
      updated: null,
    });
  }
}
