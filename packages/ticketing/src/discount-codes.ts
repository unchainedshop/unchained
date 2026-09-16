import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface DiscountCodeHandlers {
  generate: (amount: number, currencyCode?: string) => Promise<string>;
  verify: (code: string, currencyCode?: string) => Promise<number | null>;
}

export function createDefaultDiscountCodeHandlers(): DiscountCodeHandlers {
  const secret = process.env.DISCOUNT_CODE_SECRET;
  if (secret && !/^[a-f\d]{64}$/i.test(secret)) {
    throw new Error('DISCOUNT_CODE_SECRET must contain exactly 32 bytes encoded as hexadecimal');
  }
  const key = secret ? Buffer.from(secret, 'hex') : undefined;
  const sign = (payload: string) => createHmac('sha256', key!).update(`v1.${payload}`).digest();

  return {
    async generate(amount, currencyCode) {
      if (!key) throw new Error('DISCOUNT_CODE_SECRET is required to issue reimbursement codes');
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid reimbursement amount');
      if (!currencyCode || !/^[A-Z]{3}$/.test(currencyCode))
        throw new Error('Invalid reimbursement currency');
      const payload = Buffer.from(
        JSON.stringify([amount, currencyCode, randomBytes(16).toString('hex')]),
      ).toString('base64url');
      return `v1.${payload}.${sign(payload).toString('base64url')}`;
    },

    async verify(code, currencyCode) {
      if (!key || typeof code !== 'string' || code.length > 256) return null;
      const match = /^v1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(code);
      if (!match) return null;
      const [, payload, signature] = match;
      const supplied = Buffer.from(signature, 'base64url');
      // Alternative encodings must not create separate usage balances for one voucher.
      if (supplied.toString('base64url') !== signature || !timingSafeEqual(sign(payload), supplied))
        return null;
      try {
        const [amount, currency, nonce] = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (
          !Number.isSafeInteger(amount) ||
          amount <= 0 ||
          !/^[A-Z]{3}$/.test(currency) ||
          !/^[a-f\d]{32}$/.test(nonce)
        )
          return null;
        if (currencyCode && currency !== currencyCode) return null;
        return amount;
      } catch {
        return null;
      }
    },
  };
}
