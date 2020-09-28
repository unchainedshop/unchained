import {
  Products,
  ProductMedia,
  ProductVariations,
  Media,
} from 'meteor/unchained:core-products';

export default async function createProduct(payload, { logger, authorId }) {
  const { specification, media, variations, _id } = payload;
  logger.verbose('prepare: create product', payload);

  if (specification) {
    const {
      variationResolvers: assignments,
      content,
      warehousing: warehousingEmbeddedSupply,
      ...productData
    } = specification;

    const { dimensions: supply, ...warehousing } =
      warehousingEmbeddedSupply || {};

    const proxy = assignments ? { assignments } : undefined;

    const product = await Products.createProduct({
      ...productData,
      _id,
      warehousing,
      supply,
      proxy,
      authorId,
    });

    await Promise.all(
      Object.entries(content).map(async ([locale, localizedData]) => {
        return product.upsertLocalizedText(locale, {
          ...localizedData,
          authorId,
        });
      }),
    );
  }

  if (media) {
    await Promise.all(
      media.map(async ({ asset, content, ...mediaData }) => {
        const file = await Media.insertWithRemoteURL(asset);
        const mediaObject = await ProductMedia.createMedia({
          authorId,
          ...mediaData,
          productId: _id,
          mediaId: file._id,
        });
        await Promise.all(
          Object.entries(content).map(async ([locale, localizedData]) => {
            return mediaObject.upsertLocalizedText(locale, {
              ...localizedData,
              authorId,
            });
          }),
        );
      }),
    );
  }

  if (variations) {
    // Replace variations
    await Promise.all(
      variations.map(async ({ asset, content, options, ...variationsRest }) => {
        const variation = await ProductVariations.createVariation({
          authorId,
          ...variationsRest,
          options: options.map((option) => option.value),
          productId: _id,
        });
        await Promise.all(
          options.map(async ({ content: optionContent, optionValue }) => {
            await Promise.all(
              Object.entries(optionContent).map(
                async ([locale, localizedData]) => {
                  return variation.upsertLocalizedText(locale, {
                    ...localizedData,
                    productVariationOptionValue: optionValue,
                    authorId,
                  });
                },
              ),
            );
          }),
        );
        await Promise.all(
          Object.entries(content).map(async ([locale, localizedData]) => {
            return variation.upsertLocalizedText(locale, {
              ...localizedData,
              authorId,
            });
          }),
        );
      }),
    );
  }
}
