import { Context } from '@unchainedshop/types/api.js';
import {
  PaymentCredentials as PaymentCredentialsType,
  PaymentProvider,
} from '@unchainedshop/types/payments.js';
import { User } from '@unchainedshop/types/user.js';

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

  async isValid(obj, _, context) {
    const { modules, userId } = context;

    return modules.payment.paymentProviders.validate(
      obj.paymentProviderId,
      { userId, token: obj },
      context,
    );
  },
};
