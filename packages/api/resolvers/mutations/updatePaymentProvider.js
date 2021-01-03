import { log } from 'meteor/unchained:core-logger';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentProvider, paymentProviderId }, { userId }) => {
  log(`mutation updatePaymentProvider ${paymentProviderId}`, { userId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !PaymentProviders.findProvider({
      paymentProviderId,
    })
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentProviders.updateProvider({
    _id: paymentProviderId,
    ...paymentProvider,
  });
};
