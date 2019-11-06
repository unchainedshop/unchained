import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default {
  async link({ assortmentId, childAssortmentId }) {
    AssortmentLinks.findOne({
      parentAssortmentId: assortmentId,
      childAssortmentId
    });
  }
};
