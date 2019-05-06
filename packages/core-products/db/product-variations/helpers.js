import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import { ProductVariations, ProductVariationTexts } from './collections';
import { ProductVariationType } from './schema';

ProductVariations.helpers({
  upsertLocalizedText(
    locale,
    { productVariationOptionValue = null, ...fields }
  ) {
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
          locale,
          authorId: this.authorId,
          ...fields,
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

ProductVariations.createVariation = ({
  type,
  locale,
  title,
  ...variationData
}) => {
  const variationId = ProductVariations.insert({
    created: new Date(),
    type: ProductVariationType[type],
    ...variationData
  });
  const variation = ProductVariations.findOne({ _id: variationId });
  variation.upsertLocalizedText(locale, {
    title
  });
  return variation;
};

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
