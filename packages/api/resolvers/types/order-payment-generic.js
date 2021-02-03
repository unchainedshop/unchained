import { OrderPaymentConfigurationError } from '../../errors';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  sign(obj, { transactionContext }) {
    try {
      return obj.sign({ transactionContext });
    } catch (error) {
      throw new OrderPaymentConfigurationError(error);
    }
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  },
  discounts(obj) {
    // IMPORTANT: Do not send any parameter to obj.discounts!
    return obj.discounts();
  },
};
