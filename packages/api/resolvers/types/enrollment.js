export default {
  plan({ quantity, productId, configuration }) {
    return {
      quantity,
      productId,
      configuration,
    };
  },
};
