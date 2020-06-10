import {
  AssortmentLinks,
  AssortmentTexts,
} from 'meteor/unchained:core-assortments';
import { findLocalizedText } from 'meteor/unchained:core';

export default {
  async link({ assortmentId, childAssortmentId }) {
    return AssortmentLinks.findOne({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },
  async assortmentSlug(obj, params, { localeContext }) {
    return findLocalizedText(
      AssortmentTexts,
      { assortmentId: obj.assortmentId },
      localeContext.normalized,
    ).slug;
  },
  async assortmentTexts(obj, { forceLocale } = {}, { localeContext }) {
    return findLocalizedText(
      AssortmentTexts,
      { assortmentId: obj.assortmentId },
      forceLocale || localeContext.normalized,
    );
  },
};
