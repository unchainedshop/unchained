export const buildSignature = async (transactionId, orderPaymentId) => {
  const payload = [transactionId, orderPaymentId, process.env.SAFERPAY_PW].filter(Boolean).join(':');

  const msgUint8 = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
