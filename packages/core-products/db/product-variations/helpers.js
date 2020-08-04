import 'meteor/dburles:collection-helpers';
import { findLocalizedText } from 'meteor/unchained:core';
import { Locale } from 'locale';
import { ProductVariations, ProductVariationTexts } from './collections';

ProductVariations.helpers({
  upsertLocalizedText(
    locale,
    { productVariationOptionValue = null, ...fields },
  ) {
    const selector = {
      productVariationId: this._id,
      productVariationOptionValue: productVariationOptionValue || { $eq: null },
      locale,
    };
    ProductVariationTexts.upsert(selector, {
      $set: {
        updated: new Date(),
        ...fields,
      },
      $setOnInsert: {
        productVariationId: this._id,
        productVariationOptionValue: productVariationOptionValue || null,
        locale,
        created: new Date(),
      },
    });
    return ProductVariationTexts.findOne(selector);
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return ProductVariations.getLocalizedTexts(
      this._id,
      optionValue,
      parsedLocale,
    );
  },
  optionObject(productVariationOption) {
    return {
      productVariationOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this,
    };
  },
});

ProductVariations.getLocalizedTexts = (
  productVariationId,
  productVariationOptionValue,
  locale,
) =>
  findLocalizedText(
    ProductVariationTexts,
    {
      productVariationId,
      productVariationOptionValue: productVariationOptionValue || { $eq: null },
    },
    locale,
  );
