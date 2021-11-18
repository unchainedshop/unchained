// import { logs } from '../transformations/helpers/logs';

export default {
  plan({ quantity, productId, configuration }) {
    return {
      quantity,
      productId,
      configuration,
    };
  },

  // logs: logs('enrollmentId'),
};
