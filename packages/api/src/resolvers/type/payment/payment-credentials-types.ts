import { PaymentDirector } from '@unchainedshop/core';
import { Context } from '../../../context.js';
import {
  PaymentCredentials as PaymentCredentialsType,
  PaymentProvider,
} from '@unchainedshop/core-payment';
import { User } from '@unchainedshop/core-users';

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

  async paymentProvider(obj, _, { modules }) {
    // TODO: use loader
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async isValid(obj, _, requestContext) {
    const { modules, userId } = requestContext;

    // TODO: use loader
    const paymentProvider = await modules.payment.paymentProviders.findProvider({
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
