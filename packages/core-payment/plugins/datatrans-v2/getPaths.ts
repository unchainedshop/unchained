const {
  ROOT_URL,
  DATATRANS_WEBHOOK_PATH = '/payment/datatrans',
  DATATRANS_SUCCESS_PATH = '/payment/datatrans/success',
  DATATRANS_ERROR_PATH = '/payment/datatrans/error',
  DATATRANS_CANCEL_PATH = '/payment/datatrans/cancel',
  DATATRANS_RETURN_PATH = '/payment/datatrans/return',
} = process.env;

type Paths = {
  postUrl: string;
  cancelUrl: string;
  successUrl: string;
  errorUrl: string;
  returnUrl: string;
}

export default (relative = false): Paths => ({
  postUrl: `${relative ? '' : ROOT_URL}${DATATRANS_WEBHOOK_PATH}`,
  successUrl: `${relative ? '' : ROOT_URL}${DATATRANS_SUCCESS_PATH}`,
  cancelUrl: `${relative ? '' : ROOT_URL}${DATATRANS_CANCEL_PATH}`,
  errorUrl: `${relative ? '' : ROOT_URL}${DATATRANS_ERROR_PATH}`,
  returnUrl: `${relative ? '' : ROOT_URL}${DATATRANS_RETURN_PATH}`,
});
