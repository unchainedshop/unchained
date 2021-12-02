import { Users } from 'meteor/unchained:core-users';
import { PaymentCredentialsHelperTypes } from '@unchainedshop/types/payments';

export const PaymentCredentials: PaymentCredentialsHelperTypes = {
  async user(obj) {
    return (Users as any).findOne({
      _id: obj.userId,
    });
  },

  async paymentProvider(obj, _, { modules }) {
    return await modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async isValid(obj, _, { modules, userId }) {
    return await modules.payment.paymentProviders.validate(
      obj.paymentProviderId,
      { paymentProviderId: obj.paymentProviderId, userId, token: obj }
    );
  },
};
