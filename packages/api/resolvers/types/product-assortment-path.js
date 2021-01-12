import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default {
  async assortmentProduct({ _id }) {
    return AssortmentProducts.findProduct({
      assortmentProductId: _id,
    });
  },
};
