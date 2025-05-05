const {
  ROOT_URL,
  EMAIL_WEBSITE_URL,
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook',
  DATATRANS_SUCCESS_PATH = '/datatrans/success',
  DATATRANS_ERROR_PATH = '/datatrans/error',
  DATATRANS_CANCEL_PATH = '/datatrans/cancel',
  DATATRANS_RETURN_PATH = '/datatrans/return',
} = process.env;

interface Paths {
  postUrl: string;
  cancelUrl: string;
  successUrl: string;
  errorUrl: string;
  returnUrl: string;
}

export default (): Paths => ({
  postUrl: `${ROOT_URL}${DATATRANS_WEBHOOK_PATH}`,
  successUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_SUCCESS_PATH}`,
  cancelUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_CANCEL_PATH}`,
  errorUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_ERROR_PATH}`,
  returnUrl: `${EMAIL_WEBSITE_URL}${DATATRANS_RETURN_PATH}`,
});
