import { PaymentCredentialsHelperTypes } from '@unchainedshop/types/payments';

export const PaymentCredentials: PaymentCredentialsHelperTypes = {
  async user(obj, _, { modules }) {
    return modules.users.findUser({
      userId: obj.userId,
    });
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
      { paymentProviderId: obj.paymentProviderId, userId, token: obj },
      context,
    );
  },
};
