export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  walletAddress(obj) {
    try {
      return obj.provider().run('walletAddress', {
        orderPayment: obj
      });
    } catch (error) {
      throw new Error({ error });
    }
  },
  walletBalance(obj) {
    try {
      return obj.provider().run('walletBalance', {
        orderPayment: obj
      });
    } catch (error) {
      throw new Error({ error });
    }
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
