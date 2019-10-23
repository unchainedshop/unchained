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
  }
};
