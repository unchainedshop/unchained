export const PAYREXX_ADAPTER_KEY = 'shop.unchained.payment.payrexx';

export class PayrexxWebhookError extends Error {}

const assertReferenceId = (referenceId: unknown): string => {
  if (typeof referenceId !== 'string' || !referenceId) {
    throw new PayrexxWebhookError('referenceId has to be a non-empty string');
  }
  return referenceId;
};

const assertPayrexxProvider = async (paymentProviderId: string, modules: any) => {
  const provider = await modules.payment.paymentProviders.findProvider({ paymentProviderId });
  if (provider?.adapterKey !== PAYREXX_ADAPTER_KEY) {
    throw new PayrexxWebhookError(`payment provider ${paymentProviderId} is not a Payrexx provider`);
  }
  return provider;
};

export const resolvePayrexxPaymentProviderId = async (referenceId: unknown, modules: any) => {
  const paymentProviderId = assertReferenceId(referenceId);
  await assertPayrexxProvider(paymentProviderId, modules);
  return paymentProviderId;
};

export const resolvePayrexxOrderPayment = async (referenceId: unknown, modules: any) => {
  const orderPaymentId = assertReferenceId(referenceId);
  const orderPayment = await modules.orders.payments.findOrderPayment({ orderPaymentId });
  if (!orderPayment) {
    throw new PayrexxWebhookError(`order payment not found with orderPaymentId: ${orderPaymentId}`);
  }
  await assertPayrexxProvider(orderPayment.paymentProviderId, modules);
  return orderPayment;
};

const getRedirects = () => {
  const {
    EMAIL_WEBSITE_URL,
    PAYREXX_SUCCESS_PATH = '/payrexx/success',
    PAYREXX_ERROR_PATH = '/payrexx/error',
    PAYREXX_CANCEL_PATH = '/payrexx/cancel',
  } = process.env;

  return {
    successRedirectUrl: `${EMAIL_WEBSITE_URL}${PAYREXX_SUCCESS_PATH}`,
    failedRedirectUrl: `${EMAIL_WEBSITE_URL}${PAYREXX_ERROR_PATH}`,
    cancelRedirectUrl: `${EMAIL_WEBSITE_URL}${PAYREXX_CANCEL_PATH}`,
  };
};

export const mapOrderDataToGatewayObject = ({ order, orderPayment, pricing }, options = {}) => {
  const { currencyCode, amount } = pricing.total({ useNetPrice: false });

  const customerData = {};
  if (order.contact?.emailAddress) {
    customerData['fields[email][value]'] = order.contact?.emailAddress;
  }
  if (order.billingAddress?.firstName) {
    customerData['fields[forename][value]'] = order.billingAddress?.firstName;
  }
  if (order.billingAddress?.lastName) {
    customerData['fields[surname][value]'] = order.billingAddress?.lastName;
  }

  const gatewayObject = {
    amount: Math.round(amount),
    currency: currencyCode.toUpperCase(),
    purpose: encodeURIComponent(`${process.env.EMAIL_WEBSITE_NAME || 'Unchained'} #${order._id}`),
    reservation: true,
    skipResultPage: true,
    ...getRedirects(),
    referenceId: orderPayment._id,
    ...customerData,
    ...options,
  };
  return gatewayObject;
};

export const mapUserToGatewayObject = ({ userId, emailAddress, currencyCode }, options = {}) => {
  const customerData = {};

  if (emailAddress) {
    customerData['fields[email][value]'] = emailAddress;
  }

  customerData['fields[custom_field_1][name][0]'] = 'userId';
  customerData['fields[custom_field_1][value]'] = userId;

  const gatewayObject = {
    amount: Math.round(0),
    currency: currencyCode,
    purpose: encodeURIComponent(`${process.env.EMAIL_WEBSITE_NAME || 'Unchained'} ${userId}`),
    preAuthorization: true,
    skipResultPage: true,
    ...getRedirects(),
    referenceId: userId,
    ...options,
  };
  return gatewayObject;
};
