const {
  ROOT_URL,
  SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook',
  SAFERPAY_RETURN_PATH = '/saferpay/return',
} = process.env;

export const webhookPath = (orderPaymentId) =>
  `${ROOT_URL}${SAFERPAY_WEBHOOK_PATH}?orderPaymentId=${orderPaymentId}`;

export default (): string => `${ROOT_URL}${SAFERPAY_RETURN_PATH}`;
