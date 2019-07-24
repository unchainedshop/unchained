import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default {
  assortmentProduct: ({ _id }) =>
    AssortmentProducts.findOne({
      _id
    })
};
