export const mapOrderDataToGatewayObject = ({ order, orderPayment, pricing }, options = {}) => {
  const {
    EMAIL_WEBSITE_NAME = 'Unchained',
    EMAIL_WEBSITE_URL,
    DATATRANS_SUCCESS_PATH = '/payrexx/success',
    DATATRANS_ERROR_PATH = '/payrexx/error',
    DATATRANS_CANCEL_PATH = '/payrexx/cancel',
  } = process.env;

  const { currency, amount } = pricing.total({ useNetPrice: false });
  const gatewayObject = {
    amount: Math.round(amount),
    currency: currency.toUpperCase(),
    purpose: encodeURIComponent(`${EMAIL_WEBSITE_NAME} #${order._id}`),
    reservation: true,
    skipResultPage: true,
    successRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_SUCCESS_PATH}`,
    failedRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_ERROR_PATH}`,
    cancelRedirectUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_CANCEL_PATH}`,
    referenceId: orderPayment._id,
    'fields[email]': order.contact?.emailAddress,
    ...options,
  };
  return gatewayObject;
};
