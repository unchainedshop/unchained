import { createHmac, randomBytes } from 'node:crypto';
import { timingSafeStringEqual } from '@unchainedshop/utils';

export interface DiscountCodeHandlers {
  generate: (amount: number, currencyCode?: string) => Promise<string>;
  verify: (code: string, currencyCode?: string) => Promise<number | null>;
}

// The currencies module stores iso codes upper-cased; crypto symbols may exceed three characters.
const CURRENCY_CODE = /^[A-Z0-9]{2,16}$/;
const CODE_FORMAT = /^v1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/;

export function createDefaultDiscountCodeHandlers(): DiscountCodeHandlers {
  const secret = process.env.DISCOUNT_CODE_SECRET;
  if (!secret) {
    return {
      generate: async () => {
        throw new Error('DISCOUNT_CODE_SECRET is required to issue reimbursement codes');
      },
      verify: async () => null,
    };
  }
  if (!/^[a-f\d]{64}$/i.test(secret)) {
    throw new Error('DISCOUNT_CODE_SECRET must contain exactly 32 bytes encoded as hexadecimal');
  }
  const key = Buffer.from(secret, 'hex');
  const sign = (payload: string) =>
    createHmac('sha256', key).update(`v1.${payload}`).digest('base64url');

  return {
    async generate(amount, currencyCode) {
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid reimbursement amount');
      if (!currencyCode || !CURRENCY_CODE.test(currencyCode)) {
        throw new Error('Invalid reimbursement currency');
      }
      const payload = Buffer.from(
        JSON.stringify([amount, currencyCode, randomBytes(16).toString('hex')]),
      ).toString('base64url');
      return `v1.${payload}.${sign(payload)}`;
    },

    async verify(code, currencyCode) {
      if (typeof code !== 'string' || code.length > 256) return null;
      const match = CODE_FORMAT.exec(code);
      if (!match) return null;
      const [, payload, signature] = match;
      // Comparing with the canonical encoding also rejects alternative encodings of one
      // signature, which would otherwise create separate usage balances for a voucher.
      if (!(await timingSafeStringEqual(sign(payload), signature))) return null;
      try {
        const [amount, currency, nonce] = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!Number.isSafeInteger(amount) || amount <= 0) return null;
        if (!CURRENCY_CODE.test(currency) || !/^[a-f\d]{32}$/.test(nonce)) return null;
        if (currencyCode && currency !== currencyCode) return null;
        return amount;
      } catch {
        return null;
      }
    },
  };
}
