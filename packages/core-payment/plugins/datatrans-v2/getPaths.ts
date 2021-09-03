const {
  ROOT_URL,
  DATATRANS_WEBHOOK_PATH,
  DATATRANS_SUCCESS_PATH,
  DATATRANS_ERROR_PATH,
  DATATRANS_CANCEL_PATH,
  DATATRANS_RETURN_PATH,
} = process.env;

type Paths = {
  postUrl: string;
  cancelUrl: string;
  successUrl: string;
  errorUrl: string;
  returnUrl: string;
};

export default (relative = false): Paths => ({
  postUrl: `${relative ? '' : ROOT_URL}${
    DATATRANS_WEBHOOK_PATH || '/payment/datatrans/webhook'
  }`,
  successUrl: `${relative ? '' : ROOT_URL}${
    DATATRANS_SUCCESS_PATH || '/payment/datatrans/success'
  }`,
  cancelUrl: `${relative ? '' : ROOT_URL}${
    DATATRANS_CANCEL_PATH || '/payment/datatrans/cancel'
  }`,
  errorUrl: `${relative ? '' : ROOT_URL}${
    DATATRANS_ERROR_PATH || '/payment/datatrans/error'
  }`,
  returnUrl: `${relative ? '' : ROOT_URL}${
    DATATRANS_RETURN_PATH || '/payment/datatrans/return'
  }`,
});
