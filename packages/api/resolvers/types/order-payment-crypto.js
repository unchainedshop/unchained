export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  walletAddress(obj) {
    try {
      return obj.provider().run('walletAddress');
    } catch (error) {
      throw new Error({ error });
    }
  },
  walletBalance(obj) {
    try {
      return obj.provider().run('walletBalance');
    } catch (error) {
      throw new Error({ error });
    }
  },
  meta(obj) {
    return obj.transformedContextValue('meta');
  }
};
