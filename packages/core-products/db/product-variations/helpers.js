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
  updateTexts({ texts, productVariationOptionValue, userId }) {
    return texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
        productVariationOptionValue,
      })
    );
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
      ...this,
    };
  },
  createVariationOption({ inputData, localeContext, userId }) {
    const { value, title } = inputData;
    ProductVariations.update(
      { _id: this._id },
      {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          options: value,
        },
      }
    );

    return this.upsertLocalizedText(localeContext.language, {
      authorId: userId,
      productVariationOptionValue: value,
      title,
    });
  },
  removeVariationOption({ productVariationOptionValue }) {
    ProductVariations.update(this._id, {
      $set: {
        updated: new Date(),
      },
      $pull: {
        options: productVariationOptionValue,
      },
    });
    return ProductVariations.findOne(this._id);
  },
});

ProductVariations.createVariation = ({
  type,
  locale,
  title,
  authorId,
  ...variationData
}) => {
  const variationId = ProductVariations.insert({
    created: new Date(),
    type: ProductVariationType[type],
    authorId,
    ...variationData,
  });
  const variation = ProductVariations.findOne({ _id: variationId });
  variation.upsertLocalizedText(locale, {
    title,
    authorId,
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
      productVariationOptionValue: productVariationOptionValue || { $eq: null },
    },
    locale
  );
