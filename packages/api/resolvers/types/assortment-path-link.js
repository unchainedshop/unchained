import {
  AssortmentLinks,
  AssortmentTexts,
} from 'meteor/unchained:core-assortments';
import { findLocalizedText } from 'meteor/unchained:utils';
import { Locale } from 'locale';

export default {
  async link({ assortmentId, childAssortmentId }) {
    return AssortmentLinks.findLink({
      parentAssortmentId: assortmentId,
      childAssortmentId,
    });
  },
  async assortmentSlug(obj, { forceLocale } = {}, { localeContext }) {
    const locale = new Locale(forceLocale || localeContext.normalized);
    return findLocalizedText(
      AssortmentTexts,
      { assortmentId: obj.assortmentId },
      locale
    ).slug;
  },
  async assortmentTexts(obj, { forceLocale } = {}, { localeContext }) {
    const locale = new Locale(forceLocale || localeContext.normalized);
    return findLocalizedText(
      AssortmentTexts,
      { assortmentId: obj.assortmentId },
      locale
    );
  },
};
