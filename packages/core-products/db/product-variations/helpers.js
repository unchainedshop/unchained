import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import { ProductVariations, ProductVariationTexts } from './collections';

ProductVariations.helpers({
  upsertLocalizedText({ locale, productVariationOptionValue, ...rest }) {
    const localizedData = { locale, ...rest };
    const selector = {
      productVariationId: this._id,
      productVariationOptionValue: productVariationOptionValue || { $eq: null },
      locale
    };
    ProductVariationTexts.upsert(
      selector,
      {
        $set: {
          updated: new Date(),
          ...localizedData,
          productVariationOptionValue: productVariationOptionValue || null
        }
      },
      { bypassCollection2: true }
    );
    return ProductVariationTexts.findOne(selector);
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return ProductVariations.getLocalizedTexts(
      this._id,
      optionValue,
      parsedLocale
    );
  },
  optionObject(productVariationOption) {
    return {
      productVariationOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this
    };
  }
});

ProductVariations.getLocalizedTexts = (
  productVariationId,
  productVariationOptionValue,
  locale
) =>
  findLocalizedText(
    ProductVariationTexts,
    {
      productVariationId,
      productVariationOptionValue: productVariationOptionValue || { $eq: null }
    },
    locale
  );
