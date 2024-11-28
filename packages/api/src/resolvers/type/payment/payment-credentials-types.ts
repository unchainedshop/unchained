import { Context } from '../../../context.js';
import {
  PaymentCredentials as PaymentCredentialsType,
  PaymentDirector,
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
  async user(obj, _, { modules }) {
    return modules.users.findUserById(obj.userId);
  },

  async paymentProvider(obj, _, { modules }) {
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async isValid(obj, _, requestContext) {
    const { modules, userId } = requestContext;

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
