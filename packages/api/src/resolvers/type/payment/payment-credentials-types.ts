import { PaymentCredentialsHelperTypes } from '@unchainedshop/types/payments';

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

    const paymentProvider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });

    return modules.payment.paymentProviders.validate(
      obj.paymentProviderId,
      { paymentProviderId: obj.paymentProviderId, paymentProvider, userId, token: obj },
      context,
    );
  },
};
