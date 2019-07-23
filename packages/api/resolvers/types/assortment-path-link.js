import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default {
  link: ({ assortmentId, childAssortmentId }) =>
    AssortmentLinks.findOne({
      parentAssortmentId: assortmentId,
      childAssortmentId
    })
};
