import { PaymentDirector } from '@unchainedshop/core';
import type { Context } from '../../../context.ts';
import type {
  PaymentCredentials as PaymentCredentialsType,
  PaymentProvider,
} from '@unchainedshop/core-payment';
import type { User } from '@unchainedshop/core-users';

export type HelperType<P, T> = (credentials: PaymentCredentialsType, params: P, context: Context) => T;

export interface PaymentCredentialsHelperTypes {
  user: HelperType<never, Promise<User>>;
  paymentProvider: HelperType<never, Promise<PaymentProvider>>;
  isValid: HelperType<never, Promise<boolean>>;
}
export const PaymentCredentials: PaymentCredentialsHelperTypes = {
  async user(obj, _, { loaders }) {
    return loaders.userLoader.load({ userId: obj.userId });
  },

  async paymentProvider(obj, _, { loaders }) {
    return loaders.paymentProviderLoader.load({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async isValid(obj, _, requestContext) {
    const { loaders, userId } = requestContext;
    const paymentProvider = await loaders.paymentProviderLoader.load({
      paymentProviderId: obj.paymentProviderId,
    });
    const actions = await PaymentDirector.actions(
      paymentProvider,
      { userId, token: obj },
      requestContext,
    );
    return actions.validate();
  },
};
