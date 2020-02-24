import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default {
  async link({ assortmentId, childAssortmentId }) {
    return AssortmentLinks.findOne({
      parentAssortmentId: assortmentId,
      childAssortmentId
    });
  }
};
