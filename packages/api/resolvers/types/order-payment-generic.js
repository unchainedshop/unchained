import { OrderPaymentConfigurationError } from '../../errors';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  sign(obj, parameters) {
    try {
      return obj.provider().run(
        'sign',
        {
          orderPayment: obj
        },
        parameters
      );
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
  }
};
