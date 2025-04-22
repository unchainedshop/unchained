const getRedirects = () => {
  const {
    EMAIL_WEBSITE_URL,
    DATATRANS_SUCCESS_PATH = '/payrexx/success',
    DATATRANS_ERROR_PATH = '/payrexx/error',
    DATATRANS_CANCEL_PATH = '/payrexx/cancel',
  } = process.env;

  return {
    successRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_SUCCESS_PATH}`,
    failedRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_ERROR_PATH}`,
    cancelRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_CANCEL_PATH}`,
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
