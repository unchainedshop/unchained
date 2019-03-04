import { PaypalConfigurationError } from '../../errors';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  clientToken(obj) {
    try {
      return obj.provider().run('clientToken');
    } catch (error) {
      throw new PaypalConfigurationError({ error });
    }
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
