const { APPLE_IAP_ENVIRONMENT = 'sandbox' } = process.env;

// https://developer.apple.com/documentation/storekit/in-app_purchase/validating_receipts_with_the_app_store
const environments = {
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
  production: 'https://buy.itunes.apple.com/verifyReceipt',
};

export const verifyReceipt = async ({ receiptData, password }): Promise<any> => {
  const payload: any = {
    'receipt-data': receiptData,
  };
  if (password) {
    payload.password = password;
  }
  const result = await fetch(environments[APPLE_IAP_ENVIRONMENT], {
    body: JSON.stringify(payload),
    method: 'POST',
    // eslint-disable-next-line
    // @ts-ignore
    duplex: 'half',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return result.json();
};
