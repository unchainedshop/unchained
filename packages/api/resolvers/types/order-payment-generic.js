import { OrderPaymentConfigurationError } from '../../errors';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  sign(obj, { transactionContext }) {
    try {
      return obj.provider().run('sign', transactionContext);
    } catch (error) {
      throw new OrderPaymentConfigurationError({ error });
    }
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
