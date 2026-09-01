export const buildSignature = async (transactionId, orderPaymentId) => {
  // SAFERPAY_PW is the deprecated v4.8 name, kept as fallback
  const secret = process.env.SAFERPAY_API_PASSWORD || process.env.SAFERPAY_PW;
  const payload = [transactionId, orderPaymentId, secret].filter(Boolean).join(':');

  const msgUint8 = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
