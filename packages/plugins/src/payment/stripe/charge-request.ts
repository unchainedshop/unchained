export type StripeChargeRequest =
  | {
      mode: 'acp-spt';
      acpToken: string;
      acpHandlerId?: string;
    }
  | {
      mode: 'payment-intent';
      paymentIntentId: string;
    }
  | {
      mode: 'stored-credential';
      paymentCredentials: any;
    };

const hasValue = (value: unknown) => value !== undefined && value !== null;

export const normalizeStripeChargeRequest = (transactionContext: any = {}): StripeChargeRequest => {
  if (hasValue(transactionContext.acpToken)) {
    if (typeof transactionContext.acpToken !== 'string' || !transactionContext.acpToken.trim()) {
      throw new Error('You have to provide a non-empty acpToken');
    }
    return {
      mode: 'acp-spt',
      acpToken: transactionContext.acpToken,
      acpHandlerId: transactionContext.acpHandlerId,
    };
  }

  if (hasValue(transactionContext.paymentIntentId)) {
    if (
      typeof transactionContext.paymentIntentId !== 'string' ||
      !transactionContext.paymentIntentId.trim()
    ) {
      throw new Error('You have to provide a non-empty paymentIntentId');
    }
    return {
      mode: 'payment-intent',
      paymentIntentId: transactionContext.paymentIntentId,
    };
  }

  if (hasValue(transactionContext.paymentCredentials)) {
    if (!transactionContext.paymentCredentials?.token) {
      throw new Error('You have to provide paymentCredentials with a token');
    }
    return {
      mode: 'stored-credential',
      paymentCredentials: transactionContext.paymentCredentials,
    };
  }

  throw new Error('You have to provide acpToken, paymentIntentId or paymentCredentials');
};
